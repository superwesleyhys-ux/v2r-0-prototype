import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));
const inheritedEnv = new Set(Object.keys(process.env));
const maxBodyBytes = 64 * 1024;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

await loadEnvFile(".env", false);
await loadEnvFile(".env.local", true);

const port = Number(process.env.PORT || 8766);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

    if (url.pathname === "/api/structure-intent") {
      await handleStructureIntent(request, response);
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }

    await serveStaticFile(url, response, request.method === "HEAD");
  } catch (error) {
    sendJson(response, 500, { error: "Internal server error.", detail: error.message });
  }
});

server.listen(port, () => {
  console.log(`V2R-0 server running at http://localhost:${port}/`);
});

async function loadEnvFile(fileName, overrideFileValues) {
  let text;
  try {
    text = await readFile(resolve(rootDir, fileName), "utf8");
  } catch {
    return;
  }

  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex < 1) return;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (!/^[A-Z0-9_]+$/.test(key)) return;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (inheritedEnv.has(key)) return;
    if (overrideFileValues || process.env[key] == null) process.env[key] = value;
  });
}

async function serveStaticFile(url, response, headOnly) {
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const normalizedPath = normalize(`.${pathname}`);
  const filePath = resolve(rootDir, normalizedPath);

  if (!filePath.startsWith(`${rootDir}${sep}`) && filePath !== rootDir) {
    sendPlain(response, 403, "Forbidden");
    return;
  }

  const fileInfo = await stat(filePath).catch(() => null);
  if (!fileInfo?.isFile()) {
    sendPlain(response, 404, "Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
    "Content-Length": fileInfo.size,
    "Cache-Control": "no-store",
  });

  if (headOnly) {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
}

async function handleStructureIntent(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(response, 500, { error: "OPENAI_API_KEY is not configured on the server." });
    return;
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    sendJson(response, error.message === "Request body too large." ? 413 : 400, { error: error.message });
    return;
  }

  const intent = String(body.intent || "").trim();
  if (!intent) {
    sendJson(response, 400, { error: "Missing intent." });
    return;
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  let upstream;
  try {
    upstream = await fetch(new URL("responses", `${baseUrl.replace(/\/$/, "")}/`), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_output_tokens: 900,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "You structure V2R user intents into safe reality-ops drafts. Return only compact JSON. Do not approve risky, illegal, medical, child-safety, food-contact, electrical, vehicle, or load-bearing items for automatic execution.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildStructurePrompt(intent),
              },
            ],
          },
        ],
      }),
    });
  } catch (error) {
    sendJson(response, 502, {
      error: "Unable to reach the OpenAI API from this server.",
      detail: error.message,
    });
    return;
  }

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    sendJson(response, upstream.status, {
      error: data.error?.message || "OpenAI request failed.",
      type: data.error?.type || "openai_error",
    });
    return;
  }

  const outputText = extractOutputText(data);
  sendJson(response, 200, {
    model,
    output_text: outputText,
    draft: parseJsonDraft(outputText),
  });
}

function buildStructurePrompt(intent) {
  return [
    "User intent:",
    intent,
    "",
    "Return JSON with these keys:",
    "category, risk_class, object_type, functions, required_measurements, suggested_mode, safety_notes, missing_questions.",
    "risk_class must be A, B, C, or D.",
    "missing_questions must contain at most 3 concise questions.",
  ].join("\n");
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) throw new Error("Request body too large.");
    chunks.push(chunk);
  }

  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("Invalid JSON request body.");
  }
}

function extractOutputText(data) {
  if (typeof data.output_text === "string") return data.output_text.trim();

  return (data.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || content.output_text || "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function parseJsonDraft(text) {
  const trimmed = String(text || "").trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendPlain(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(message);
}
