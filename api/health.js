import { DEFAULT_OPENAI_MODEL } from "./structureTicketCore.js";
import { getAllowedOrigins, setCors } from "./http.js";

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
  const keyConfigured = Boolean(env.OPENAI_API_KEY);
  const model = env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
  const allowedOrigins = getAllowedOrigins(env);
  return {
    ok: true,
    service: "v2r-api",
    keyConfigured,
    modelConfigured: Boolean(keyConfigured && model),
    model,
    mockMode: env.V2R_USE_LOCAL_AI_MOCK === "1",
    allowedOriginsConfigured: allowedOrigins.has("https://superwesleyhys-ux.github.io"),
  };
}
