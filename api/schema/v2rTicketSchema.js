export const V2R_TICKET_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "risk_class",
    "category",
    "handling_strategy",
    "reason",
    "object_type",
    "questions",
    "spec",
    "realization_mode",
    "bom",
    "quotes_allowed",
  ],
  properties: {
    risk_class: {
      type: "string",
      enum: ["A", "B", "C", "D", "UNSUPPORTED"],
    },
    category: { type: "string" },
    handling_strategy: { type: "string" },
    reason: { type: "string" },
    object_type: { type: "string" },
    questions: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "why_needed"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          why_needed: { type: "string" },
        },
      },
    },
    spec: {
      type: "object",
      additionalProperties: false,
      required: ["project_name", "user_goal", "environment", "functions", "constraints", "acceptance"],
      properties: {
        project_name: { type: "string" },
        user_goal: { type: "string" },
        environment: { type: "string" },
        functions: {
          type: "array",
          items: { type: "string" },
        },
        constraints: {
          type: "array",
          items: { type: "string" },
        },
        acceptance: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
    realization_mode: {
      type: "string",
      enum: ["buy", "print", "hybrid", "manual_review", "unsupported", "refuse"],
    },
    bom: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "type", "quantity", "spec", "status"],
        properties: {
          name: { type: "string" },
          type: {
            type: "string",
            enum: ["buy", "print", "stock", "outsource", "unknown"],
          },
          quantity: { type: "number" },
          spec: { type: "string" },
          status: { type: "string" },
        },
      },
    },
    quotes_allowed: { type: "boolean" },
  },
};
