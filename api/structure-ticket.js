import { structureTicket } from "./structureTicketCore.js";
import { parseBody, setCors } from "./http.js";

export default async function handler(req, res) {
  setCors(req, res, process.env);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? parseBody(req.body) : req.body || {};
  if (body === null) {
    return res.status(400).json({ error: "Invalid JSON request body", code: "INVALID_JSON" });
  }

  const userIntent = body.userIntent || body.intent;
  const result = await structureTicket({ userIntent, env: process.env, fetchImpl: fetch });
  return res.status(result.status).json(result.body);
}
