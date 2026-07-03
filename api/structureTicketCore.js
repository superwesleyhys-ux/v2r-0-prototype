import { buildLocalStructuredTicket } from "./localDraft.js";
import { localRealityGate } from "./policy/realityGate.js";
import { V2R_TICKET_SCHEMA } from "./schema/v2rTicketSchema.js";

export async function structureTicket({ userIntent, env = process.env, fetchImpl = fetch }) {
  const intent = String(userIntent || "").trim();
  if (!intent) {
    return {
      status: 400,
      body: { error: "Missing userIntent" },
    };
  }

  const localGate = localRealityGate(intent);
  if (localGate.stop) {
    return {
      status: 200,
      body: localGate.result,
    };
  }

  if (env.V2R_USE_LOCAL_AI_MOCK === "1") {
    return {
      status: 200,
      body: buildLocalStructuredTicket(intent),
    };
  }

  const apiKey = env.OPENAI_API_KEY;
  const model = env.OPENAI_MODEL;
  if (!apiKey || !model) {
    return {
      status: 500,
      body: { error: "Server missing OPENAI_API_KEY or OPENAI_MODEL" },
    };
  }

  const baseUrl = env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  let response;
  try {
    response = await fetchImpl(new URL("responses", `${baseUrl.replace(/\/$/, "")}/`), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
            schema: V2R_TICKET_SCHEMA,
          },
        },
      }),
    });
  } catch (error) {
    return {
      status: 502,
      body: {
        error: "Unable to reach the OpenAI API from this server.",
        detail: error.message,
      },
    };
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      status: response.status,
      body: {
        error: "OpenAI API error",
        detail: data.error?.message || data,
      },
    };
  }

  const outputText = extractOutputText(data);
  if (!outputText) {
    return {
      status: 502,
      body: {
        error: "No structured output returned",
        detail: data,
      },
    };
  }

  try {
    return {
      status: 200,
      body: JSON.parse(outputText),
    };
  } catch (error) {
    return {
      status: 502,
      body: {
        error: "Structured output was not valid JSON",
        detail: error.message,
      },
    };
  }
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
