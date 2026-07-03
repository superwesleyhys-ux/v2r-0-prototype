const defaultAllowedOrigins = ["http://localhost:8766", "http://127.0.0.1:8766", "https://superwesleyhys-ux.github.io"];

export function setCors(req, res, env = process.env) {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins(env);
  if (allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function getAllowedOrigins(env = process.env) {
  const configured = String(env.V2R_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return new Set([...defaultAllowedOrigins, ...configured]);
}

export function parseBody(rawBody) {
  try {
    return JSON.parse(rawBody || "{}");
  } catch {
    return null;
  }
}
