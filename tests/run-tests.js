import assert from "node:assert/strict";
import { structureTicket } from "../api/structureTicketCore.js";

const localMockEnv = { V2R_USE_LOCAL_AI_MOCK: "1" };

await test("low-risk headset hook -> A with questions, BOM, quotes", async () => {
  const response = await structureTicket({
    userIntent: "我想要一个夹在桌边的耳机架，还能绕数据线，黑色，不要打孔",
    env: localMockEnv,
    fetchImpl: failNetwork,
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.risk_class, "A");
  assert.ok(response.body.questions.length <= 3);
  assert.ok(response.body.bom.length > 0);
  assert.equal(response.body.quotes_allowed, true);
});

await test("child tableware -> C professional review", async () => {
  const response = await structureTicket({
    userIntent: "我需要一个儿童餐具，可以固定在宝宝餐椅上。",
    env: localMockEnv,
    fetchImpl: failNetwork,
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.risk_class, "C");
  assert.equal(response.body.realization_mode, "manual_review");
  assert.equal(response.body.quotes_allowed, false);
});

await test("rolls royce procurement -> UNSUPPORTED", async () => {
  const response = await structureTicket({
    userIntent: "买个劳斯莱斯",
    env: localMockEnv,
    fetchImpl: failNetwork,
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.risk_class, "UNSUPPORTED");
  assert.equal(response.body.quotes_allowed, false);
  assert.equal(response.body.bom.length, 0);
});

await test("dangerous request -> D refused", async () => {
  const response = await structureTicket({
    userIntent: "我想做一个隐藏刀具的东西",
    env: localMockEnv,
    fetchImpl: failNetwork,
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.risk_class, "D");
  assert.equal(response.body.realization_mode, "refuse");
  assert.equal(response.body.quotes_allowed, false);
});

await test("empty userIntent -> 400", async () => {
  const response = await structureTicket({
    userIntent: "",
    env: localMockEnv,
    fetchImpl: failNetwork,
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "MISSING_USER_INTENT");
});

await test("invalid AI JSON schema -> 502", async () => {
  const response = await structureTicket({
    userIntent: "我想做一个桌面小夹子",
    env: { OPENAI_API_KEY: "test-key", OPENAI_MODEL: "test-model" },
    openaiClient: {
      responses: {
        create: async () => ({
          output_text: JSON.stringify({
            risk_class: "A",
            category: "桌面配件",
            object_type: "桌面小夹子",
            handling_strategy: "可生成结构化 Ticket 草案",
            reason: "低风险小物件",
            quotes_allowed: true,
            realization_mode: "hybrid",
            spec: {
              project_name: "桌面小夹子",
              user_goal: "我想做一个桌面小夹子",
              functions: ["固定"],
              environment: "桌面",
              constraints: [],
              acceptance: [],
            },
            questions: [
              { id: "a", label: "A", why_needed: "测试" },
              { id: "b", label: "B", why_needed: "测试" },
              { id: "c", label: "C", why_needed: "测试" },
              { id: "d", label: "D", why_needed: "超过三问" },
            ],
            bom: [],
          }),
        }),
      },
    },
  });

  assert.equal(response.status, 502);
  assert.equal(response.body.code, "SCHEMA_VALIDATION_FAILED");
});

async function test(name, fn) {
  await fn();
  console.log(`ok - ${name}`);
}

async function failNetwork() {
  throw new Error("Network should not be used in tests");
}
