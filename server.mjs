import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { healthPayload } from "./api/health.js";
import { structureTicket } from "./api/structureTicketCore.js";

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

    if (url.pathname === "/api/structure-ticket" || url.pathname === "/api/structure-intent") {
      await handleStructureTicket(request, response);
      return;
    }

    if (url.pathname === "/api/health") {
      handleHealth(request, response);
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

function handleHealth(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  sendJson(response, 200, healthPayload(process.env));
}

async function handleStructureTicket(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    sendJson(response, error.message === "Request body too large." ? 413 : 400, { error: error.message });
    return;
  }

  const result = await structureTicket({
    userIntent: body.userIntent || body.intent,
    env: process.env,
    fetchImpl: fetch,
  });
  sendJson(response, result.status, result.body);
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
