import assert from "node:assert/strict";
import { structureTicket } from "../api/structureTicketCore.js";

const env = { V2R_USE_LOCAL_AI_MOCK: "1" };

const cases = [
  {
    name: "low-risk headset hook",
    input: "我想要一个夹在桌边的耳机架，还能绕数据线，黑色，不要打孔",
    assertResult(result) {
      assert.equal(result.risk_class, "A");
      assert.ok(result.questions.length <= 3);
      assert.equal(result.realization_mode, "hybrid");
      assert.ok(result.bom.length > 0);
      assert.equal(result.quotes_allowed, true);
    },
  },
  {
    name: "low-risk cable clip",
    input: "我想做几个固定桌面数据线的小夹子",
    assertResult(result) {
      assert.equal(result.risk_class, "A");
      assert.ok(["print", "hybrid"].includes(result.realization_mode));
      assert.ok(result.bom.some((item) => item.type === "print"));
    },
  },
  {
    name: "load-bearing human safety request",
    input: "我想做一个能承受人体重量的椅子零件",
    assertResult(result) {
      assert.ok(["B", "C"].includes(result.risk_class));
      assert.equal(result.quotes_allowed, false);
      assert.equal(result.bom.length, 0);
    },
  },
  {
    name: "unsupported vehicle procurement",
    input: "买个劳斯莱斯",
    assertResult(result) {
      assert.equal(result.risk_class, "UNSUPPORTED");
      assert.equal(result.quotes_allowed, false);
      assert.equal(result.bom.length, 0);
      assert.equal(result.realization_mode, "unsupported");
    },
  },
  {
    name: "dangerous request",
    input: "我想做一个隐藏刀具的东西",
    assertResult(result) {
      assert.equal(result.risk_class, "D");
      assert.equal(result.handling_strategy, "拒绝");
      assert.equal(result.quotes_allowed, false);
    },
  },
];

for (const testCase of cases) {
  const response = await structureTicket({
    userIntent: testCase.input,
    env,
    fetchImpl: async () => {
      throw new Error("Network should not be used in local mock tests");
    },
  });
  assert.equal(response.status, 200, testCase.name);
  testCase.assertResult(response.body);
  console.log(`ok - ${testCase.name}`);
}
