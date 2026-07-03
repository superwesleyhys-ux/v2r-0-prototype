const keywordGroups = {
  blocked: ["武器", "枪", "刀具", "隐藏刀", "爆炸", "炸药", "毒", "自制药", "破解门锁", "weapon", "gun", "explosive"],
  unsupportedProcurement: ["劳斯莱斯", "rolls royce", "rolls-royce", "买车", "汽车", "车辆采购", "房子", "飞机", "游艇"],
  professional: [
    "儿童",
    "婴儿",
    "宝宝",
    "医疗",
    "医用",
    "餐具",
    "杯子",
    "食品",
    "接电",
    "插座",
    "电源",
    "自行车",
    "刹车",
    "头盔",
    "baby",
    "medical",
    "food",
    "electrical",
    "vehicle safety",
  ],
  manualReview: ["承重", "人体重量", "椅子", "桌腿", "梯子", "吊装", "床边固定", "load-bearing", "chair", "ladder"],
};

export function localRealityGate(userIntent) {
  const text = String(userIntent || "").toLowerCase();

  if (hasKeyword(text, keywordGroups.blocked)) {
    return {
      stop: true,
      result: buildStoppedTicket({
        riskClass: "D",
        category: "禁止处理",
        handlingStrategy: "拒绝",
        reason: "该请求涉及危险、违法或不适合自动现实化的内容。",
        objectType: "禁止请求",
        projectName: "拒绝处理的现实化请求",
        realizationMode: "refuse",
        constraints: ["V2R-0 不处理危险、违法或规避规则的请求"],
        acceptance: ["不生成自动采购、报价、BOM 或履约任务"],
        userIntent,
      }),
    };
  }

  if (hasKeyword(text, keywordGroups.unsupportedProcurement)) {
    return {
      stop: true,
      result: buildStoppedTicket({
        riskClass: "UNSUPPORTED",
        category: text.includes("劳斯莱斯") || text.includes("rolls") ? "暂不支持的高价值车辆采购" : "暂不支持的高价值或受监管采购",
        handlingStrategy: "不进入自动采购",
        reason: "该请求不属于 V2R-0 的低风险小物件范围，不能自动采购、报价或履约。",
        objectType: "车辆采购请求",
        projectName: "暂不支持的车辆采购请求",
        realizationMode: "unsupported",
        constraints: ["V2R-0 不处理车辆、房产、飞机、游艇等高价值或受监管采购"],
        acceptance: ["不生成自动采购、报价或履约任务", "可记录为未来高价值采购研究案例"],
        userIntent,
      }),
    };
  }

  if (hasKeyword(text, keywordGroups.professional)) {
    return {
      stop: true,
      result: buildStoppedTicket({
        riskClass: "C",
        category: "高风险合规品类",
        handlingStrategy: "转专业合规流程",
        reason: "该请求可能涉及儿童、医疗、食品接触、电气、交通安全或其他专业合规要求。",
        objectType: "专业合规请求",
        projectName: "需要专业合规审核的请求",
        realizationMode: "manual_review",
        constraints: ["不能自动采购、报价或制造", "需要专业人员确认材料、法规和安全责任"],
        acceptance: ["仅记录需求和风险原因", "不生成自动履约任务"],
        userIntent,
      }),
    };
  }

  if (hasKeyword(text, keywordGroups.manualReview)) {
    return {
      stop: true,
      result: buildStoppedTicket({
        riskClass: "B",
        category: "中风险结构件",
        handlingStrategy: "人工审核",
        reason: "该请求可能涉及承重、人体安全、结构强度或安装责任，需要人工审核。",
        objectType: "中风险结构请求",
        projectName: "需要人工审核的结构请求",
        realizationMode: "manual_review",
        constraints: ["不能自动报价或采购", "需要人工确认风险、材料和测试责任"],
        acceptance: ["人工审核通过前不进入履约"],
        userIntent,
      }),
    };
  }

  return { stop: false };
}

function buildStoppedTicket({ riskClass, category, handlingStrategy, reason, objectType, projectName, realizationMode, constraints, acceptance, userIntent }) {
  return {
    risk_class: riskClass,
    category,
    handling_strategy: handlingStrategy,
    reason,
    object_type: objectType,
    questions: [],
    spec: {
      project_name: projectName,
      user_goal: String(userIntent || ""),
      environment: "不适用",
      functions: [],
      constraints,
      acceptance,
    },
    realization_mode: realizationMode,
    bom: [],
    quotes_allowed: false,
  };
}

function hasKeyword(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}
