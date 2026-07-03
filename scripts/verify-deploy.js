#!/usr/bin/env node

const baseUrl = normalizeBaseUrl(process.argv[2]);

if (!baseUrl) {
  console.error("Usage: node scripts/verify-deploy.js https://your-vercel-url.vercel.app");
  process.exit(1);
}

const tests = [
  ["GET /api/health", verifyHealth],
  ["OPTIONS /api/structure-ticket CORS preflight", verifyCorsPreflight],
  ["POST /api/structure-ticket low risk", verifyLowRisk],
  ["POST /api/structure-ticket empty userIntent", verifyEmptyIntent],
  ["POST /api/structure-ticket unsupported procurement", verifyUnsupportedProcurement],
];

let failed = 0;

for (const [name, fn] of tests) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(`  ${error.message}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} deployment check(s) failed for ${baseUrl}`);
  process.exit(1);
}

console.log(`\nAll deployment checks passed for ${baseUrl}`);

async function verifyHealth() {
  const { status, json } = await requestJson("/api/health");
  assert(status === 200, `Expected 200, got ${status}`);
  assert(json.ok === true, "Expected ok=true");
  assert(json.service === "v2r-api", `Expected service=v2r-api, got ${json.service}`);
  assert(json.keyConfigured === true, "keyConfigured is false. Configure OPENAI_API_KEY in Vercel.");
  assert(json.modelConfigured === true, "modelConfigured is false. Configure OPENAI_API_KEY and OPENAI_MODEL in Vercel.");
  assert(typeof json.model === "string" && json.model.length > 0, "Expected non-empty model name");
  assert(json.allowedOriginsConfigured === true, "allowedOriginsConfigured is false. Include the GitHub Pages origin in V2R_ALLOWED_ORIGINS.");
}

async function verifyCorsPreflight() {
  const response = await fetch(new URL("/api/structure-ticket", `${baseUrl}/`), {
    method: "OPTIONS",
    headers: {
      Origin: "https://superwesleyhys-ux.github.io",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "Content-Type",
    },
  });

  const allowOrigin = response.headers.get("access-control-allow-origin");
  const allowMethods = response.headers.get("access-control-allow-methods") || "";
  assert(response.status === 204, `Expected 204, got ${response.status}`);
  assert(allowOrigin === "https://superwesleyhys-ux.github.io", `Expected GitHub Pages allow-origin, got ${allowOrigin || "empty"}`);
  assert(allowMethods.includes("POST") && allowMethods.includes("OPTIONS"), `Expected POST and OPTIONS in allow-methods, got ${allowMethods || "empty"}`);
}

async function verifyLowRisk() {
  const { status, json } = await requestJson("/api/structure-ticket", {
    method: "POST",
    body: {
      userIntent: "我想要一个夹在桌边的耳机架，还能绕数据线，黑色，不要打孔。",
    },
  });
  assert(status === 200, `Expected 200, got ${status}: ${JSON.stringify(json)}`);
  assert(json.risk_class === "A", `Expected risk_class=A, got ${json.risk_class}`);
  assert(Array.isArray(json.questions), "Expected questions array");
  assert(json.questions.length <= 3, `Expected <= 3 questions, got ${json.questions.length}`);
  assert(json.quotes_allowed === true, "Expected quotes_allowed=true");
  assert(Array.isArray(json.bom) && json.bom.length > 0, "Expected non-empty BOM");
}

async function verifyEmptyIntent() {
  const { status, json } = await requestJson("/api/structure-ticket", {
    method: "POST",
    body: { userIntent: "" },
  });
  assert(status === 400, `Expected 400, got ${status}`);
  assert(json.code === "MISSING_USER_INTENT", `Expected MISSING_USER_INTENT, got ${json.code}`);
}

async function verifyUnsupportedProcurement() {
  const { status, json } = await requestJson("/api/structure-ticket", {
    method: "POST",
    body: { userIntent: "买个劳斯莱斯" },
  });
  assert(status === 200, `Expected 200, got ${status}`);
  assert(json.risk_class === "UNSUPPORTED", `Expected UNSUPPORTED, got ${json.risk_class}`);
  assert(json.quotes_allowed === false, "Expected quotes_allowed=false");
  assert(Array.isArray(json.bom) && json.bom.length === 0, "Expected empty BOM");
}

async function requestJson(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(new URL(path, `${baseUrl}/`), {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    const contentType = response.headers.get("content-type") || "";

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Expected JSON but received ${contentType || "unknown content-type"} with status ${response.status}: ${text.slice(0, 180)}`);
    }

    return { status: response.status, json };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out after 30s");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeBaseUrl(rawValue) {
  if (!rawValue) return "";
  try {
    const url = new URL(rawValue);
    return url.origin;
  } catch {
    return "";
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
