import OpenAI from "openai";
import { buildLocalStructuredTicket } from "./localDraft.js";
import { localRealityGate } from "./policy/realityGate.js";
import { formatSchemaIssues, validateTicketPatch, V2R_TICKET_JSON_SCHEMA } from "./schema/v2rTicketSchema.js";

export const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

export async function structureTicket({ userIntent, env = process.env, openaiClient = null, fetchImpl = fetch }) {
  const intent = String(userIntent || "").trim();
  if (!intent) {
    return {
      status: 400,
      body: { error: "Missing userIntent", code: "MISSING_USER_INTENT" },
    };
  }

  const localGate = localRealityGate(intent);
  if (localGate.stop) {
    return finalizeTicket(localGate.result);
  }

  if (env.V2R_USE_LOCAL_AI_MOCK === "1") {
    return finalizeTicket(buildLocalStructuredTicket(intent));
  }

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      status: 500,
      body: { error: "OPENAI_API_KEY missing", code: "OPENAI_API_KEY_MISSING" },
    };
  }

  const model = env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
  const baseURL = env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const client = openaiClient || new OpenAI({ apiKey, baseURL, fetch: fetchImpl });

  let data;
  try {
    data = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "你是 V2R-0 Reality Gate + Ticket Structuring Agent。只处理低风险桌面/房间小物件。不要自动处理车辆、房产、高额采购、危险物品、医疗、儿童用品、食品接触、电气、交通安全件、承重结构。输出必须符合 JSON Schema。",
        },
        {
          role: "user",
          content: `用户想现实化的东西：${intent}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "v2r_ticket_patch",
          strict: true,
          schema: V2R_TICKET_JSON_SCHEMA,
        },
      },
    });
  } catch (error) {
    return {
      status: mapOpenAIErrorStatus(error),
      body: {
        error: "OpenAI API error",
        code: "OPENAI_API_ERROR",
        detail: error.message,
      },
    };
  }

  const outputText = extractOutputText(data);
  if (!outputText) {
    return {
      status: 502,
      body: {
        error: "No structured output returned",
        code: "NO_STRUCTURED_OUTPUT",
      },
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(outputText);
  } catch (error) {
    return {
      status: 502,
      body: {
        error: "Structured output was not valid JSON",
        code: "INVALID_AI_JSON",
        detail: error.message,
      },
    };
  }

  return finalizeTicket(parsed);
}

export function finalizeTicket(ticket) {
  const validation = validateTicketPatch(ticket);
  if (!validation.success) {
    return {
      status: 502,
      body: {
        error: "AI output failed V2R schema validation",
        code: "SCHEMA_VALIDATION_FAILED",
        issues: formatSchemaIssues(validation.error.issues),
      },
    };
  }

  return {
    status: 200,
    body: validation.data,
  };
}

export function extractOutputText(data) {
  if (typeof data.output_text === "string") return data.output_text.trim();

  return (data.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || content.output_text || "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function mapOpenAIErrorStatus(error) {
  if (Number.isInteger(error.status)) return error.status;
  if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") return 502;
  return 502;
}
