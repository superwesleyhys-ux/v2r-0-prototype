import { z } from "zod";

export const riskClassValues = ["A", "B", "C", "D", "UNSUPPORTED"];
export const realizationModeValues = ["buy", "print", "hybrid", "manual_review", "unsupported", "refuse"];
export const bomTypeValues = ["buy", "print", "inventory", "unknown"];

export const V2RTicketPatchSchema = z
  .object({
    risk_class: z.enum(riskClassValues),
    category: z.string().min(1),
    object_type: z.string().min(1),
    handling_strategy: z.string().min(1),
    reason: z.string().min(1),
    quotes_allowed: z.boolean(),
    realization_mode: z.enum(realizationModeValues),
    spec: z
      .object({
        project_name: z.string().min(1),
        user_goal: z.string().min(1),
        functions: z.array(z.string()),
        environment: z.string(),
        constraints: z.array(z.string()),
        acceptance: z.array(z.string()),
      })
      .strict(),
    questions: z
      .array(
        z
          .object({
            id: z.string().min(1),
            label: z.string().min(1),
            why_needed: z.string().min(1),
          })
          .strict()
      )
      .max(3),
    bom: z.array(
      z
        .object({
          name: z.string().min(1),
          type: z.enum(bomTypeValues),
          quantity: z.number().positive(),
          spec: z.string(),
          status: z.string(),
        })
        .strict()
    ),
  })
  .strict()
  .superRefine((ticket, ctx) => {
    if (ticket.risk_class !== "A" && ticket.quotes_allowed) {
      ctx.addIssue({
        code: "custom",
        path: ["quotes_allowed"],
        message: "quotes_allowed must be false unless risk_class is A",
      });
    }

    if (["D", "UNSUPPORTED"].includes(ticket.risk_class) && ticket.bom.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["bom"],
        message: "D and UNSUPPORTED tickets must not generate BOM",
      });
    }

    if (ticket.risk_class === "D" && ticket.realization_mode !== "refuse") {
      ctx.addIssue({
        code: "custom",
        path: ["realization_mode"],
        message: "D tickets must use refuse realization_mode",
      });
    }

    if (ticket.risk_class === "UNSUPPORTED" && ticket.realization_mode !== "unsupported") {
      ctx.addIssue({
        code: "custom",
        path: ["realization_mode"],
        message: "UNSUPPORTED tickets must use unsupported realization_mode",
      });
    }
  });

export const V2R_TICKET_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "risk_class",
    "category",
    "object_type",
    "handling_strategy",
    "reason",
    "quotes_allowed",
    "realization_mode",
    "spec",
    "questions",
    "bom",
  ],
  properties: {
    risk_class: {
      type: "string",
      enum: riskClassValues,
    },
    category: { type: "string" },
    object_type: { type: "string" },
    handling_strategy: { type: "string" },
    reason: { type: "string" },
    quotes_allowed: { type: "boolean" },
    realization_mode: {
      type: "string",
      enum: realizationModeValues,
    },
    spec: {
      type: "object",
      additionalProperties: false,
      required: ["project_name", "user_goal", "functions", "environment", "constraints", "acceptance"],
      properties: {
        project_name: { type: "string" },
        user_goal: { type: "string" },
        functions: {
          type: "array",
          items: { type: "string" },
        },
        environment: { type: "string" },
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
            enum: bomTypeValues,
          },
          quantity: { type: "number" },
          spec: { type: "string" },
          status: { type: "string" },
        },
      },
    },
  },
};

export function validateTicketPatch(value) {
  return V2RTicketPatchSchema.safeParse(value);
}

export function formatSchemaIssues(issues) {
  return issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);
}
