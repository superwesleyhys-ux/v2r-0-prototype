import { DEFAULT_OPENAI_MODEL } from "./structureTicketCore.js";
import { setCors } from "./http.js";

export default function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json(healthPayload(process.env));
}

export function healthPayload(env = process.env) {
  return {
    ok: true,
    service: "v2r-api",
    modelConfigured: Boolean(env.OPENAI_API_KEY && (env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL)),
  };
}
