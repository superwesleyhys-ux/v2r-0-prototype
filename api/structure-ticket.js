import { structureTicket } from "./structureTicketCore.js";

const allowedOrigins = new Set(["http://localhost:8766", "http://127.0.0.1:8766", "https://superwesleyhys-ux.github.io"]);

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? parseBody(req.body) : req.body || {};
  const result = await structureTicket({ userIntent: body.userIntent, env: process.env, fetchImpl: fetch });
  return res.status(result.status).json(result.body);
}

function setCors(req, res) {
  const origin = req.headers.origin;
  if (allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function parseBody(rawBody) {
  try {
    return JSON.parse(rawBody || "{}");
  } catch {
    return {};
  }
}
