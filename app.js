const STORAGE_KEY = "v2r0-reality-ops-state";

const statuses = [
  "DRAFT",
  "NEEDS_CLARIFICATION",
  "SAFE_APPROVED",
  "PLANNED",
  "QUOTED",
  "USER_APPROVED",
  "PAID_HELD",
  "SOURCING",
  "PRINTING",
  "ASSEMBLY",
  "QC_PENDING",
  "PACKING",
  "SHIPPED",
  "DELIVERED",
  "ACCEPTED",
  "REWORK_REQUESTED",
  "REFUNDED",
];

const fallbackVendors = [
  {
    vendor_id: "standard_parts_bin",
    name: "认证标准件箱",
    capabilities: ["m4_screws", "rubber_pads", "packaging"],
    trust_score: 95,
    qc_supported: true,
    photo_record_supported: true,
    average_turnaround_days: 1,
    failure_rate: 0.02,
    note: "螺丝、螺母、防滑垫、包装盒有库存记录。",
  },
  {
    vendor_id: "local_print_a",
    name: "本地打印点 A",
    capabilities: ["PLA", "PETG", "small_parts"],
    trust_score: 88,
    qc_supported: true,
    photo_record_supported: true,
    average_turnaround_days: 3,
    failure_rate: 0.07,
    note: "PETG/PLA 小件稳定，支持拍照质检。",
  },
  {
    vendor_id: "approved_marketplace_vendor",
    name: "审核过的平台商户",
    capabilities: ["finished_goods", "tracked_shipping", "returns"],
    trust_score: 82,
    qc_supported: false,
    photo_record_supported: false,
    average_turnaround_days: 4,
    failure_rate: 0.05,
    note: "可追踪物流，支持退换货，价格无异常低值。",
  },
];

let vendorCatalog = fallbackVendors;

const quoteProfiles = {
  桌边夹式耳机架: {
    buy: { productCost: 12, shippingCost: 5.5, packagingCost: 1, taxRate: 0.06, platformFeeRate: 0.12, reworkRiskRate: 0.02, delivery: "2-4 天", trust: 82 },
    print: { materialGrams: 72, materialCostPerGram: 0.035, printHours: 2.8, machineHourlyRate: 2.5, laborMinutes: 16, laborHourlyRate: 15, standardPartsCost: 0, packagingCost: 2.2, shippingCost: 5.5, taxRate: 0.05, platformFeeRate: 0.12, reworkRiskRate: 0.11, delivery: "3-6 天", trust: 76 },
    hybrid: { materialGrams: 65, materialCostPerGram: 0.035, printHours: 2.4, machineHourlyRate: 2.5, laborMinutes: 12, laborHourlyRate: 15, standardPartsCost: 4.8, packagingCost: 2.1, shippingCost: 5.5, taxRate: 0.06, platformFeeRate: 0.12, reworkRiskRate: 0.08, delivery: "3-5 天", trust: 91 },
  },
  default: {
    buy: { productCost: 10.5, shippingCost: 5.5, packagingCost: 1, taxRate: 0.06, platformFeeRate: 0.12, reworkRiskRate: 0.02, delivery: "2-5 天", trust: 80 },
    print: { materialGrams: 55, materialCostPerGram: 0.035, printHours: 2, machineHourlyRate: 2.5, laborMinutes: 10, laborHourlyRate: 15, standardPartsCost: 0, packagingCost: 2, shippingCost: 5.5, taxRate: 0.05, platformFeeRate: 0.12, reworkRiskRate: 0.1, delivery: "3-6 天", trust: 74 },
    hybrid: { materialGrams: 48, materialCostPerGram: 0.035, printHours: 1.8, machineHourlyRate: 2.5, laborMinutes: 10, laborHourlyRate: 15, standardPartsCost: 3.8, packagingCost: 2, shippingCost: 5.5, taxRate: 0.06, platformFeeRate: 0.12, reworkRiskRate: 0.07, delivery: "3-5 天", trust: 88 },
  },
};

const riskRules = [
  {
    risk: "D",
    level: "blocked",
    category: "禁止用途",
    action: "拒绝处理",
    reason: "涉及武器、危险器具、违法或规避规则的用途。",
    keywords: ["武器", "枪", "刀", "爆炸", "bomb", "weapon", "bypass", "规避", "违法"],
  },
  {
    risk: "C",
    level: "high",
    category: "高风险消费品",
    action: "转专业合规流程",
    reason: "涉及医疗、儿童、食品接触、电气、交通工具或运动安全关键件。",
    keywords: [
      "儿童",
      "婴儿",
      "宝宝",
      "医疗",
      "医用",
      "固定器",
      "餐具",
      "杯子",
      "食品",
      "接电",
      "插座",
      "电源",
      "自行车",
      "汽车",
      "滑板",
      "刹车",
      "攀爬",
      "头盔",
      "baby",
      "medical",
      "food",
      "electrical",
      "vehicle",
    ],
  },
  {
    risk: "B",
    level: "review",
    category: "中风险结构件",
    action: "人工审核",
    reason: "可能涉及承重、人体安全、精度或材料强度，需要人工判断。",
    keywords: ["承重", "椅子", "桌腿", "梯子", "吊", "人体", "床", "load-bearing", "chair", "ladder"],
  },
];

const defaultState = () => ({
  ticket_id: "V2R-0001",
  user_intent: "",
  category: "未分类",
  risk_level: "unrated",
  risk_class: "-",
  status: "DRAFT",
  gate: {
    level: "unrated",
    action: "等待输入",
    reason: "系统会先拦截承重、儿童、医疗、食品接触、电气、交通安全件和危险用途。",
  },
  spec: {
    object_type: "待结构化物件",
    functions: [],
    color: "未指定",
    environment: "未指定",
    required_measurements: [],
    budget: null,
    deadline: null,
    acceptance: [],
  },
  questions: [],
  answers: {},
  realization_mode: "undecided",
  bom: [],
  quotes: [],
  selected_quote_id: null,
  vendors: [],
  qc_requirements: [],
  package_items: [],
  delivery_method: "ship_to_home",
  learning: [],
  quote_inputs: null,
  history: [],
  last_action_message: "等待用户输入。",
});

let state = loadState();

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

document.addEventListener("DOMContentLoaded", async () => {
  await loadCatalogs();
  bindEvents();
  hydrateInputs();
  render();
  if (window.lucide) window.lucide.createIcons();
});

async function loadCatalogs() {
  try {
    const response = await fetch("data/vendors.json");
    if (!response.ok) return;
    const data = await response.json();
    if (Array.isArray(data.vendors)) vendorCatalog = data.vendors;
  } catch {
    vendorCatalog = fallbackVendors;
  }
}

function bindEvents() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => setTab(button.dataset.tab));
  });

  $$(".sample-idea").forEach((button) => {
    button.addEventListener("click", () => {
      $("#idea-input").value = button.dataset.idea;
      runPipeline();
    });
  });

  $("#run-gate").addEventListener("click", () => runPipeline());
  $("#load-headset").addEventListener("click", () => {
    $("#idea-input").value = "我想要一个夹在桌边的耳机架，还能绕数据线，黑色，不要打孔。";
    runPipeline({
      desk_thickness: "25mm",
      load_weight: "普通游戏耳机，约 320g",
      priority: "定制一点但不要太贵",
    });
  });

  $("#clarification-form").addEventListener("submit", (event) => {
    event.preventDefault();
    state.questions.forEach((question) => {
      const field = $(`[name="${question.id}"]`);
      state.answers[question.id] = field ? field.value.trim() : "";
    });
    finishPlanning();
  });

  $("#advance-status").addEventListener("click", advanceStatus);
  $("#mark-qc").addEventListener("click", markQcPassed);
  $("#save-feedback").addEventListener("click", saveFeedback);
  $("#export-json").addEventListener("click", exportJson);
  $("#reset-demo").addEventListener("click", resetDemo);
}

function setTab(name) {
  $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.tab === name));
  $$(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `tab-${name}`));
}

function hydrateInputs() {
  $("#idea-input").value = state.user_intent || "";
}

function addHistory(event, actor, note) {
  if (!Array.isArray(state.history)) state.history = [];
  state.history.push({
    at: new Date().toISOString(),
    event,
    actor,
    note,
  });
}

function runPipeline(seedAnswers = {}) {
  const intent = $("#idea-input").value.trim();
  if (!intent) return;

  const parsed = parseIntent(intent);
  state = {
    ...defaultState(),
    ticket_id: state.ticket_id || "V2R-0001",
    user_intent: intent,
    category: parsed.category,
    risk_level: parsed.riskLevel,
    risk_class: parsed.riskClass,
    status: parsed.riskClass === "A" ? "NEEDS_CLARIFICATION" : "DRAFT",
    gate: parsed.gate,
    spec: parsed.spec,
    questions: parsed.questions,
    answers: { ...seedAnswers },
    realization_mode: "undecided",
    qc_requirements: buildQc(parsed.spec.object_type),
    package_items: buildPackageItems(parsed.spec.object_type),
    delivery_method: "ship_to_home",
    learning: buildLearningSeed(parsed.spec.object_type),
  };
  addHistory("INTENT_CREATED", "user", "用户输入原始需求。");
  addHistory(parsed.riskClass === "A" ? "GATE_APPROVED" : "GATE_REVIEW_REQUIRED", "system", `${parsed.riskClass} 类：${parsed.gate.action}`);

  if (Object.keys(seedAnswers).length) finishPlanning();
  saveState();
  render();
}

function parseIntent(rawIntent) {
  const intent = rawIntent.toLowerCase();
  const matchedRule = riskRules.find((rule) => rule.keywords.some((keyword) => intent.includes(keyword.toLowerCase())));
  const objectType = inferObjectType(intent);
  const functions = inferFunctions(intent, objectType);
  const color = inferColor(intent);
  const environment = inferEnvironment(intent);
  const questions = buildQuestions(objectType, intent);
  const lowRiskCategory = inferCategory(objectType);

  if (matchedRule) {
    return {
      category: matchedRule.category,
      riskLevel: matchedRule.level === "blocked" ? "prohibited" : "high",
      riskClass: matchedRule.risk,
      gate: {
        level: matchedRule.level,
        action: matchedRule.action,
        reason: matchedRule.reason,
      },
      spec: buildSpec(objectType, functions, color, environment, questions, rawIntent, true),
      questions: [],
    };
  }

  const isKnownLowRisk = [
    "桌边夹式耳机架",
    "手机支架",
    "线缆管理器",
    "抽屉分隔件",
    "显示器小配件",
    "轻量挂钩",
    "桌面收纳件",
    "非承重外壳",
    "模型摆件",
  ].includes(objectType);

  if (!isKnownLowRisk) {
    return {
      category: "待人工归类",
      riskLevel: "medium",
      riskClass: "B",
      gate: {
        level: "review",
        action: "人工审核",
        reason: "不在第一版自动处理品类内，需要运营人员判断是否属于低风险小物件。",
      },
      spec: buildSpec(objectType, functions, color, environment, questions, rawIntent, true),
      questions: [],
    };
  }

  return {
    category: lowRiskCategory,
    riskLevel: "low",
    riskClass: "A",
    gate: {
      level: "low",
      action: "可自动生成草案",
      reason: "属于低风险桌面/宿舍/房间小物件，可进入人工增强 MVP 流程。",
    },
    spec: buildSpec(objectType, functions, color, environment, questions, rawIntent, false),
    questions,
  };
}

function inferObjectType(intent) {
  if (matches(intent, ["耳机", "headphone", "headset"])) return "桌边夹式耳机架";
  if (matches(intent, ["手机", "phone", "stand"])) return "手机支架";
  if (matches(intent, ["线缆", "数据线", "电线", "cable"])) return "线缆管理器";
  if (matches(intent, ["抽屉", "drawer", "分隔"])) return "抽屉分隔件";
  if (matches(intent, ["显示器", "monitor"])) return "显示器小配件";
  if (matches(intent, ["挂钩", "hook"])) return "轻量挂钩";
  if (matches(intent, ["外壳", "case", "shell"])) return "非承重外壳";
  if (matches(intent, ["摆件", "模型", "装饰", "figurine"])) return "模型摆件";
  if (matches(intent, ["收纳", "盒子", "托盘", "organizer", "storage"])) return "桌面收纳件";
  return "待结构化小物件";
}

function inferCategory(objectType) {
  const map = {
    桌边夹式耳机架: "桌面配件",
    手机支架: "桌面配件",
    线缆管理器: "线缆管理",
    抽屉分隔件: "桌面收纳",
    显示器小配件: "显示器小配件",
    轻量挂钩: "轻量挂钩",
    桌面收纳件: "桌面收纳",
    非承重外壳: "非承重外壳",
    模型摆件: "模型摆件",
  };
  return map[objectType] || "低风险小物件";
}

function inferFunctions(intent, objectType) {
  const functions = [];
  if (objectType === "桌边夹式耳机架") functions.push("挂耳机");
  if (objectType === "手机支架") functions.push("支撑手机");
  if (objectType === "线缆管理器") functions.push("固定线缆");
  if (objectType === "抽屉分隔件") functions.push("分隔收纳");
  if (objectType === "显示器小配件") functions.push("适配显示器周边");
  if (objectType === "轻量挂钩") functions.push("轻量悬挂");
  if (objectType === "模型摆件") functions.push("装饰展示");
  if (matches(intent, ["绕", "线", "cable"])) functions.push("整理数据线");
  if (matches(intent, ["不打孔", "免打孔", "夹", "clamp"])) functions.push("不打孔固定");
  if (matches(intent, ["可拆", "拆卸"])) functions.push("可拆卸");
  return [...new Set(functions.length ? functions : ["满足用户描述的基础功能"])];
}

function inferColor(intent) {
  if (matches(intent, ["黑", "black"])) return "黑色";
  if (matches(intent, ["白", "white"])) return "白色";
  if (matches(intent, ["灰", "gray", "grey"])) return "灰色";
  if (matches(intent, ["透明", "clear"])) return "透明";
  return "未指定";
}

function inferEnvironment(intent) {
  if (matches(intent, ["桌边", "桌子边", "desk edge"])) return "桌边";
  if (matches(intent, ["桌下", "under desk"])) return "桌下";
  if (matches(intent, ["宿舍", "dorm"])) return "宿舍/书桌";
  if (matches(intent, ["抽屉", "drawer"])) return "抽屉内部";
  if (matches(intent, ["显示器", "monitor"])) return "显示器周边";
  if (matches(intent, ["房间", "room"])) return "房间";
  return "桌面/室内";
}

function buildQuestions(objectType, intent) {
  const questionSets = {
    桌边夹式耳机架: [
      { id: "desk_thickness", label: "桌板厚度", placeholder: "例如 25mm" },
      { id: "load_weight", label: "耳机重量", placeholder: "例如 普通游戏耳机 / 320g" },
      { id: "priority", label: "优先级", placeholder: "便宜 / 快 / 更定制" },
    ],
    手机支架: [
      { id: "phone_size", label: "手机尺寸", placeholder: "例如 iPhone 15 Pro / 78mm 宽" },
      { id: "view_angle", label: "观看角度", placeholder: "例如 60 度" },
      { id: "priority", label: "优先级", placeholder: "便宜 / 快 / 更好看" },
    ],
    线缆管理器: [
      { id: "cable_count", label: "线缆数量", placeholder: "例如 3 根" },
      { id: "mount_surface", label: "固定位置", placeholder: "例如 桌下 / 桌边" },
      { id: "priority", label: "优先级", placeholder: "便宜 / 快 / 更稳" },
    ],
    抽屉分隔件: [
      { id: "drawer_size", label: "抽屉内径", placeholder: "例如 320 x 220 x 60mm" },
      { id: "compartments", label: "分隔数量", placeholder: "例如 6 格" },
      { id: "priority", label: "优先级", placeholder: "便宜 / 定制 / 耐用" },
    ],
  };

  return questionSets[objectType] || [
    { id: "outer_size", label: "大概尺寸", placeholder: "例如 120 x 80 x 40mm" },
    { id: "budget", label: "预算", placeholder: "例如 $30 以内" },
    { id: "priority", label: "优先级", placeholder: "便宜 / 快 / 定制" },
  ];
}

function buildSpec(objectType, functions, color, environment, questions, rawIntent, blocked) {
  return {
    project_name: objectType === "桌边夹式耳机架" ? "桌边夹式耳机架 + 线缆管理器" : objectType,
    object_type: objectType,
    user_goal: rawIntent,
    functions,
    color,
    environment,
    required_measurements: blocked ? [] : questions.map((question) => question.label),
    budget: null,
    deadline: null,
    manufacturing_constraints: [
      "优先使用 3D 打印或标准件",
      "不使用危险材料",
      "不接电",
      "不承载人体重量",
      "适合人工审核后执行",
    ],
    acceptance: [
      "能稳定完成核心功能",
      "关键尺寸符合用户提供参数",
      "外观无明显破损",
      "边缘不过度尖锐",
      "用户能在 5 分钟内完成安装或使用",
    ],
  };
}

function finishPlanning() {
  if (state.risk_class !== "A") return;

  state.status = "QUOTED";
  state.spec = enrichSpecWithAnswers(state.spec, state.answers);
  state.realization_mode = chooseMode(state.user_intent, state.spec);
  state.bom = buildBom(state.spec.object_type, state.realization_mode);
  state.quote_inputs = buildQuoteInputs(state.spec.object_type, state.answers);
  state.quotes = buildQuotes(state.spec.object_type, state.quote_inputs);
  state.vendors = buildVendors();
  state.last_action_message = "报价已由本地 quote engine 计算，仍属于模拟履约。";
  addHistory("SPEC_GENERATED", "system", "规格书和 BOM 已生成。");
  addHistory("QUOTE_GENERATED", "quote_engine", "由材料、打印时间、人工、物流、平台费和重做风险计算报价。");
  saveState();
  render();
  setTab("quote");
}

function enrichSpecWithAnswers(spec, answers) {
  const values = Object.entries(answers)
    .filter(([, value]) => value)
    .map(([key, value]) => `${labelForAnswer(key)}：${value}`);

  const budgetAnswer = answers.budget || "";
  return {
    ...spec,
    key_dimensions: values,
    budget: budgetAnswer || spec.budget,
    acceptance: spec.acceptance,
  };
}

function labelForAnswer(key) {
  const labels = {
    desk_thickness: "桌板厚度",
    load_weight: "负载重量",
    priority: "优先级",
    phone_size: "手机尺寸",
    view_angle: "观看角度",
    cable_count: "线缆数量",
    mount_surface: "固定位置",
    drawer_size: "抽屉内径",
    compartments: "分隔数量",
    outer_size: "大概尺寸",
    budget: "预算",
  };
  return labels[key] || key;
}

function chooseMode(intent, spec) {
  const raw = intent.toLowerCase();
  if (matches(raw, ["定制", "尺寸", "夹", "不打孔", "贴合"])) return "hybrid";
  if (spec.object_type === "模型摆件") return "print";
  if (matches(raw, ["现成", "买", "便宜", "快"])) return "buy";
  return "hybrid";
}

function buildBom(objectType, mode) {
  if (objectType === "桌边夹式耳机架") {
    return [
      item("主体支架", "print", 1, "PETG/PLA，黑色，圆角处理", 86, "ready_to_slice"),
      item("夹持结构", "print", 1, "按桌板厚度参数生成", 82, "ready_to_slice"),
      item("绕线槽", "print", 1, "适配 1-2 根数据线", 84, "ready_to_slice"),
      item("防滑橡胶垫", "buy", 2, "20 x 30mm，可替代规格", 91, "needs_quote"),
      item("M4 螺丝", "inventory", 1, "M4 x 35mm", 95, "in_stock"),
      item("M4 螺母", "inventory", 1, "标准六角螺母", 95, "in_stock"),
      item("包装盒", "inventory", 1, "小号瓦楞盒", 93, "in_stock"),
    ];
  }

  const common = [
    item("参数化主体件", mode === "buy" ? "buy" : "print", 1, "按规格书确认", 82, "needs_quote"),
    item("固定/缓冲配件", "buy", 1, "橡胶垫、胶贴或螺丝", 88, "needs_quote"),
    item("包装材料", "inventory", 1, "小号包装", 93, "in_stock"),
  ];
  return common;
}

function item(name, type, quantity, spec, trust, status) {
  return {
    name,
    type,
    quantity,
    spec,
    required: true,
    alternatives: [],
    risk_level: "low",
    trust_score: trust,
    source_status: status,
  };
}

function buildQuoteInputs(objectType, answers = {}) {
  const profile = quoteProfiles[objectType] || quoteProfiles.default;
  const loadText = String(answers.load_weight || "").toLowerCase();
  const heavyLoadFactor = matches(loadText, ["重", "heavy", "500g", "600g"]) ? 1.15 : 1;
  return {
    buy: { ...profile.buy },
    print: {
      ...profile.print,
      materialGrams: Math.round(profile.print.materialGrams * heavyLoadFactor),
      printHours: roundMoney(profile.print.printHours * heavyLoadFactor),
    },
    hybrid: {
      ...profile.hybrid,
      materialGrams: Math.round(profile.hybrid.materialGrams * heavyLoadFactor),
      printHours: roundMoney(profile.hybrid.printHours * heavyLoadFactor),
    },
  };
}

function buildQuotes(objectType, quoteInputs = buildQuoteInputs(objectType)) {
  const buyCosts = calculateBuyQuote(quoteInputs.buy);
  const printCosts = calculateManufacturingQuote(quoteInputs.print);
  const hybridCosts = calculateManufacturingQuote(quoteInputs.hybrid);

  return [
    {
      id: "buy",
      name: "方案 A：直接购买",
      badge: "最快",
      final_price: buyCosts.final_price,
      delivery: quoteInputs.buy.delivery,
      trust: quoteInputs.buy.trust,
      risk: "低",
      customization: "低",
      user_work: "按普通商品安装",
      refundable: "取决于商户",
      recommended: false,
      costs: buyCosts.costs,
      reasons: ["交付快", "售后简单", "不保证完全贴合桌板尺寸"],
    },
    {
      id: "print",
      name: "方案 B：全 3D 打印",
      badge: "最定制",
      final_price: printCosts.final_price,
      delivery: quoteInputs.print.delivery,
      trust: quoteInputs.print.trust,
      risk: "中低",
      customization: "高",
      user_work: "可能需要简单打磨或试装",
      refundable: "可重打一次",
      recommended: false,
      costs: printCosts.costs,
      reasons: ["尺寸贴合", "材料和夹持强度需要验证", "失败重打成本较高"],
    },
    {
      id: "hybrid",
      name: "方案 C：混合方案",
      badge: "推荐",
      final_price: hybridCosts.final_price,
      delivery: quoteInputs.hybrid.delivery,
      trust: quoteInputs.hybrid.trust,
      risk: "低",
      customization: "高",
      user_work: "贴防滑垫并旋紧固定件",
      refundable: "可补件或重打",
      recommended: true,
      costs: hybridCosts.costs,
      reasons: ["打印主体 + 标准件更稳", "保留定制尺寸", "采购和质检路径清晰"],
    },
  ];
}

function calculateBuyQuote(input) {
  const base = input.productCost + input.shippingCost + input.packagingCost;
  const tax = base * input.taxRate;
  const platform = base * input.platformFeeRate;
  const rework = base * input.reworkRiskRate;
  return {
    final_price: roundMoney(base + tax + platform + rework),
    costs: {
      product: roundMoney(input.productCost),
      material: 0,
      machine: 0,
      labor: 0,
      standard_parts: 0,
      manufacturing: 0,
      packaging: roundMoney(input.packagingCost),
      shipping: roundMoney(input.shippingCost),
      tax: roundMoney(tax),
      platform: roundMoney(platform),
      rework: roundMoney(rework),
    },
  };
}

function calculateManufacturingQuote(input) {
  const material = input.materialGrams * input.materialCostPerGram;
  const machine = input.printHours * input.machineHourlyRate;
  const labor = (input.laborMinutes / 60) * input.laborHourlyRate;
  const manufacturing = material + machine + labor;
  const base = manufacturing + input.standardPartsCost + input.packagingCost + input.shippingCost;
  const tax = base * input.taxRate;
  const platform = base * input.platformFeeRate;
  const rework = base * input.reworkRiskRate;
  return {
    final_price: roundMoney(base + tax + platform + rework),
    costs: {
      product: 0,
      material: roundMoney(material),
      machine: roundMoney(machine),
      labor: roundMoney(labor),
      standard_parts: roundMoney(input.standardPartsCost),
      manufacturing: roundMoney(manufacturing),
      packaging: roundMoney(input.packagingCost),
      shipping: roundMoney(input.shippingCost),
      tax: roundMoney(tax),
      platform: roundMoney(platform),
      rework: roundMoney(rework),
    },
  };
}

function roundMoney(value) {
  return Number(value.toFixed(2));
}

function buildVendors() {
  return vendorCatalog.map((vendor) => ({
    vendor_id: vendor.vendor_id,
    name: vendor.name,
    score: vendor.trust_score ?? vendor.score,
    note: vendor.note || `${vendor.capabilities?.join(", ") || "通用能力"}；平均 ${vendor.average_turnaround_days || "-"} 天。`,
    capabilities: vendor.capabilities || [],
    failure_rate: vendor.failure_rate,
    qc_supported: Boolean(vendor.qc_supported),
    photo_record_supported: Boolean(vendor.photo_record_supported),
  }));
}

function buildQc(objectType) {
  if (objectType === "桌边夹式耳机架") {
    return [
      { id: "appearance", label: "外观无明显断层、裂纹或破损", passed: false },
      { id: "dimension", label: "夹持尺寸符合用户桌板厚度", passed: false },
      { id: "stability", label: "挂耳机后不明显滑动", passed: false },
      { id: "cable", label: "线缆能绕上去并保持", passed: false },
      { id: "kit", label: "防滑垫、螺丝、螺母齐全", passed: false },
      { id: "photos", label: "正面、侧面、安装测试照片已留档", passed: false },
    ];
  }

  return [
    { id: "appearance", label: "外观无明显失败", passed: false },
    { id: "dimension", label: "关键尺寸符合", passed: false },
    { id: "function", label: "核心功能测试通过", passed: false },
    { id: "edges", label: "边缘不过度尖锐", passed: false },
    { id: "kit", label: "配件和包装齐全", passed: false },
  ];
}

function buildPackageItems(objectType) {
  return [
    { name: "主体件", note: objectType || "定制小物件" },
    { name: "配件包", note: "标准件、垫片、胶贴或螺丝" },
    { name: "安装卡片", note: "5 分钟内可完成的步骤" },
    { name: "售后入口", note: "订单编号、反馈、重打/补件入口" },
  ];
}

function buildLearningSeed(objectType) {
  return [
    { title: "模板成功率", note: `${objectType || "小物件"} 模板等待首单验证。` },
    { title: "供应商记录", note: "优先使用认证标准件箱和本地打印点。" },
    { title: "售后观察", note: "重点记录尺寸不合适、夹持不稳、缺件和物流异常。" },
  ];
}

function render() {
  renderTopbar();
  renderGate();
  renderQuestions();
  renderSpec();
  renderDecision();
  renderBom();
  renderQuotes();
  renderVendors();
  renderCosts();
  renderTimeline();
  renderQc();
  renderPackage();
  renderLearning();
  renderJson();
  if (window.lucide) window.lucide.createIcons();
}

function renderTopbar() {
  $("#ticket-id").textContent = state.ticket_id;
  $("#ticket-status").textContent = state.status;
}

function renderGate() {
  $("#gate-category").textContent = state.category || "-";
  $("#gate-action").textContent = state.gate.action;
  $("#gate-reason").textContent = state.gate.reason;

  const pill = $("#risk-pill");
  const levelText = {
    low: "A 类低风险",
    review: "B 类审核",
    high: "C 类高风险",
    blocked: "D 类拒绝",
  };
  pill.textContent = levelText[state.gate.level] || "未评估";
  pill.className = `risk-pill risk-${state.gate.level || "low"}`;

  const meter = $(".gate-meter");
  meter.className = `gate-meter ${state.gate.level || "low"}`;
}

function clearNode(node) {
  node.replaceChildren();
}

function textEl(tag, text, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = valueText(text);
  return node;
}

function valueText(value) {
  if (value == null || value === "") return "-";
  return String(value);
}

function appendEmptyState(container, message, tag = "div") {
  clearNode(container);
  const empty = textEl(tag, message, "empty-state");
  container.append(empty);
}

function appendIcon(container, name) {
  const icon = document.createElement("i");
  icon.dataset.lucide = name;
  container.append(icon);
  return icon;
}

function safeClassToken(value) {
  return String(value || "").replace(/[^a-z0-9_-]/gi, "");
}

function renderQuestions() {
  const form = $("#clarification-form");
  $("#question-count").textContent = `${state.questions.length}/3`;
  clearNode(form);

  if (!state.questions.length) {
    form.append(textEl("div", "当前请求未进入自动追问流程。", "empty-state"));
    return;
  }

  state.questions.forEach((question) => {
    const label = document.createElement("label");
    label.append(document.createTextNode(valueText(question.label)));
    const input = document.createElement("input");
    input.name = question.id;
    input.value = state.answers[question.id] || "";
    input.placeholder = question.placeholder || "";
    label.append(input);
    form.append(label);
  });

  const actions = document.createElement("div");
  actions.className = "form-actions";
  const button = document.createElement("button");
  button.className = "primary-button";
  button.type = "submit";
  appendIcon(button, "file-check-2");
  button.append(textEl("span", "生成规格与报价"));
  actions.append(button);
  form.append(actions);
}

function renderSpec() {
  const spec = state.spec;
  $("#realization-mode").textContent = modeLabel(state.realization_mode);

  const rows = [
    ["项目名称", spec.project_name || "-"],
    ["用户目标", spec.user_goal || state.user_intent || "-"],
    ["使用环境", spec.environment || "-"],
    ["功能要求", listText(spec.functions)],
    ["关键尺寸", listText(spec.key_dimensions || spec.required_measurements)],
    ["制造约束", listText(spec.manufacturing_constraints)],
    ["验收标准", listText(spec.acceptance)],
  ];

  const container = $("#spec-sheet");
  clearNode(container);
  rows.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "spec-row";
    row.append(textEl("span", label), textEl("span", value));
    container.append(row);
  });
}

function renderDecision() {
  $("#decision-badge").textContent = modeLabel(state.realization_mode);
  const steps = [
    ["buy", "现成品完全满足", "买", "shopping-bag"],
    ["modify", "现成品基本满足", "买 + 小改造", "wrench"],
    ["print", "结构简单且可参数化", "3D 打印", "box"],
    ["hybrid", "标准件 + 定制件", "混合", "boxes"],
    ["review", "风险高或精度高", "人工审核/外包", "shield-alert"],
  ];

  const active = state.realization_mode === "buy" ? "buy" : state.realization_mode === "print" ? "print" : state.realization_mode === "hybrid" ? "hybrid" : state.risk_class === "A" ? "modify" : "review";

  const map = $("#decision-map");
  clearNode(map);
  steps.forEach(([id, title, label, icon]) => {
    const step = document.createElement("div");
    step.className = `decision-step ${id === active ? "active" : ""}`.trim();
    appendIcon(step, icon);

    const copy = document.createElement("div");
    copy.append(textEl("strong", title), textEl("span", label));
    step.append(copy);

    if (id === active) appendIcon(step, "check-circle-2");
    map.append(step);
  });
}

function renderBom() {
  const body = $("#bom-body");
  clearNode(body);
  if (!state.bom.length) {
    const row = document.createElement("tr");
    const cell = textEl("td", "等待规格书与现实化方案。");
    cell.colSpan = 6;
    row.append(cell);
    body.append(row);
    return;
  }

  state.bom.forEach((item) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.append(textEl("strong", item.name));

    const typeCell = document.createElement("td");
    const typePill = textEl("span", typeLabel(item.type), `type-pill ${safeClassToken(item.type)}`);
    typeCell.append(typePill);

    row.append(
      nameCell,
      typeCell,
      textEl("td", item.quantity),
      textEl("td", item.spec),
      textEl("td", item.trust_score),
      textEl("td", statusLabel(item.source_status))
    );
    body.append(row);
  });
}

function renderQuotes() {
  const grid = $("#quote-grid");
  clearNode(grid);
  if (["B", "C", "D"].includes(state.risk_class)) {
    grid.append(textEl("div", "该请求未通过 A 类自动处理门槛，报价需转人工或拒绝。", "empty-state"));
    return;
  }
  if (!state.quotes.length) {
    grid.append(textEl("div", "补充关键参数后生成 2-3 个现实化方案。", "empty-state"));
    return;
  }

  state.quotes.forEach((quote) => {
    const article = document.createElement("article");
    article.className = `quote-card ${quote.recommended ? "recommended" : ""} ${state.selected_quote_id === quote.id ? "selected" : ""}`.trim();

    const title = document.createElement("div");
    title.className = "quote-title";
    title.append(textEl("h4", quote.name), textEl("span", quote.badge, "quote-badge"));

    const price = textEl("p", `$${quote.final_price.toFixed(2)}`, "quote-price");

    const meta = document.createElement("div");
    meta.className = "quote-meta";
    [
      ["交付", quote.delivery],
      ["可信度", quote.trust],
      ["风险", quote.risk],
      ["定制", quote.customization],
    ].forEach(([label, value]) => {
      const item = document.createElement("div");
      item.append(textEl("span", label), textEl("strong", value));
      meta.append(item);
    });

    const reasons = document.createElement("ul");
    quote.reasons.forEach((reason) => reasons.append(textEl("li", reason)));

    const button = document.createElement("button");
    button.className = state.selected_quote_id === quote.id ? "primary-button" : "secondary-button";
    button.dataset.quoteId = quote.id;
    appendIcon(button, state.selected_quote_id === quote.id ? "check-circle-2" : "circle");
    button.append(textEl("span", state.selected_quote_id === quote.id ? "已确认" : "确认方案"));

    article.append(title, price, meta, reasons, button);
    grid.append(article);
  });

  $$("[data-quote-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selected_quote_id = button.dataset.quoteId;
      state.status = "USER_APPROVED";
      state.last_action_message = "用户已确认方案；下一步为模拟支付托管。";
      const selected = state.quotes.find((quote) => quote.id === state.selected_quote_id);
      addHistory("QUOTE_SELECTED", "user", selected ? `${selected.name}，到手价 $${selected.final_price.toFixed(2)}` : "用户选择了报价方案。");
      saveState();
      render();
    });
  });
}

function renderVendors() {
  const vendors = state.vendors.length ? state.vendors : buildVendors();
  const list = $("#vendor-list");
  clearNode(list);
  vendors.forEach((vendor) => {
    const item = document.createElement("div");
    item.className = "vendor-item";
    const copy = document.createElement("div");
    copy.append(textEl("strong", vendor.name), textEl("p", vendor.note));
    item.append(copy, textEl("span", vendor.score, "vendor-score"));
    list.append(item);
  });
}

function renderCosts() {
  const selected = state.quotes.find((quote) => quote.id === state.selected_quote_id) || state.quotes.find((quote) => quote.recommended);
  const costs = selected?.costs;
  const list = $("#cost-list");
  clearNode(list);
  if (!costs) {
    list.append(textEl("li", "商品价格 + 运费 + 税费 + 平台手续费 + 制造费用 + 包装费用 + 失败重做风险。"));
    return;
  }

  const rows = [
    ["商品价格", costs.product],
    ["材料费用", costs.material],
    ["机器时间", costs.machine],
    ["人工费用", costs.labor],
    ["标准件", costs.standard_parts],
    ["运费", costs.shipping],
    ["税费", costs.tax],
    ["平台手续费", costs.platform],
    ["制造费用", costs.manufacturing],
    ["包装费用", costs.packaging],
    ["失败重做风险", costs.rework],
  ];

  rows.forEach(([label, value]) => list.append(textEl("li", `${label}: $${Number(value || 0).toFixed(2)}`)));
}

function renderTimeline() {
  const index = statuses.indexOf(state.status);
  const timeline = $("#status-timeline");
  clearNode(timeline);
  statuses.forEach((status, statusIndex) => {
    const isDone = index >= 0 && statusIndex < index;
    const isCurrent = statusIndex === index;
    const step = document.createElement("div");
    step.className = `timeline-step ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`.trim();
    const dot = document.createElement("span");
    dot.className = "timeline-dot";
    step.append(dot, textEl("strong", status));
    timeline.append(step);
  });
  const note = $("#state-note");
  const check = canAdvance();
  note.textContent = state.last_action_message || check.reason;
  note.title = check.allowed ? `下一步：${check.next || "无"}` : check.reason;
}

function renderQc() {
  const list = $("#qc-list");
  clearNode(list);
  if (!state.qc_requirements.length) {
    list.append(textEl("div", "生成 Ticket 后会显示质检清单。", "empty-state"));
    return;
  }

  state.qc_requirements.forEach((item) => {
    const label = document.createElement("label");
    label.className = "qc-item";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.qcId = item.id;
    input.checked = Boolean(item.passed);
    label.append(input, textEl("span", item.label));
    list.append(label);
  });

  $$("[data-qc-id]").forEach((box) => {
    box.addEventListener("change", () => {
      const item = state.qc_requirements.find((qc) => qc.id === box.dataset.qcId);
      if (item) item.passed = box.checked;
      saveState();
      renderJson();
    });
  });
}

function renderPackage() {
  const grid = $("#package-grid");
  clearNode(grid);
  state.package_items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "package-item";
    card.append(textEl("strong", item.name), textEl("p", item.note));
    grid.append(card);
  });
}

function renderLearning() {
  const list = $("#learning-list");
  clearNode(list);
  state.learning.forEach((item) => {
    const card = document.createElement("div");
    card.className = "learning-item";
    card.append(textEl("strong", item.title), textEl("p", item.note));
    list.append(card);
  });
}

function renderJson() {
  $("#json-view").textContent = JSON.stringify(state, null, 2);
}

function advanceStatus() {
  const current = statuses.indexOf(state.status);
  if (current < 0 || current >= statuses.length - 1) return;

  const check = canAdvance();
  if (!check.allowed) {
    state.last_action_message = check.reason;
    if (state.status === "QUOTED") setTab("quote");
    saveState();
    render();
    return;
  }

  state.status = check.next || statuses[current + 1];
  state.last_action_message = `模拟状态推进：${statuses[current]} -> ${state.status}`;
  addHistory("STATUS_ADVANCED", "operator", state.last_action_message);
  saveState();
  render();
}

function canAdvance() {
  const next = statuses[statuses.indexOf(state.status) + 1];
  const hasBom = state.bom.length > 0;
  const hasQuotes = state.quotes.length > 0;
  const hasSelectedQuote = Boolean(state.selected_quote_id);
  const qcPassed = state.qc_requirements.length > 0 && state.qc_requirements.every((item) => item.passed);
  const packageReady = state.package_items.length > 0;

  const checks = {
    DRAFT: {
      allowed: Boolean(state.user_intent && state.risk_class === "A"),
      reason: "需要先输入需求并通过 Reality Gate。",
      next,
    },
    NEEDS_CLARIFICATION: {
      allowed: false,
      reason: "需要先补齐关键参数并生成规格与报价。",
      next: "QUOTED",
    },
    SAFE_APPROVED: {
      allowed: Boolean(state.spec?.object_type),
      reason: "需要可用规格书。",
      next,
    },
    PLANNED: {
      allowed: hasBom && hasQuotes,
      reason: "需要 BOM 和报价方案。",
      next,
    },
    QUOTED: {
      allowed: hasSelectedQuote,
      reason: "需要用户先确认一个报价方案。",
      next: "USER_APPROVED",
    },
    USER_APPROVED: {
      allowed: hasSelectedQuote,
      reason: "需要已确认方案；当前为模拟支付托管。",
      next: "PAID_HELD",
    },
    PAID_HELD: {
      allowed: state.risk_class === "A" && hasSelectedQuote,
      reason: "需要付款托管成功且无高风险项。",
      next: "SOURCING",
    },
    SOURCING: {
      allowed: hasBom,
      reason: "需要 BOM 采购/库存项可用。",
      next: "PRINTING",
    },
    PRINTING: {
      allowed: state.bom.some((item) => item.type === "print"),
      reason: "需要至少一个打印件或转为纯购买履约。",
      next: "ASSEMBLY",
    },
    ASSEMBLY: {
      allowed: packageReady && state.qc_requirements.length > 0,
      reason: "需要交付包和质检清单。",
      next: "QC_PENDING",
    },
    QC_PENDING: {
      allowed: qcPassed,
      reason: "需要 QC 全部通过才能进入包装。",
      next: "PACKING",
    },
    PACKING: {
      allowed: packageReady,
      reason: "需要交付包完整。",
      next: "SHIPPED",
    },
    SHIPPED: {
      allowed: hasSelectedQuote,
      reason: "需要物流追踪事件；当前为模拟送达。",
      next: "DELIVERED",
    },
    DELIVERED: {
      allowed: false,
      reason: "需要用户保存验收反馈后才能 ACCEPTED 或 REWORK_REQUESTED。",
      next: "ACCEPTED",
    },
  };

  return checks[state.status] || { allowed: false, reason: "当前状态没有可模拟推进的下一步。", next };
}

function markQcPassed() {
  state.qc_requirements = state.qc_requirements.map((item) => ({ ...item, passed: true }));
  state.status = "PACKING";
  state.last_action_message = "QC 全部通过，模拟进入包装。";
  addHistory("QC_PASSED", "operator", "外观、尺寸、功能、配件和照片记录已模拟通过。");
  saveState();
  render();
}

function saveFeedback() {
  const result = $("#feedback-result").value;
  const note = $("#feedback-note").value.trim() || "用户完成验收。";
  state.status = result === "稳定可用" ? "ACCEPTED" : "REWORK_REQUESTED";
  state.learning = [
    {
      title: `反馈：${result}`,
      note,
    },
    ...state.learning,
  ];
  state.last_action_message = result === "稳定可用" ? "用户验收通过，订单完成。" : "用户反馈触发重做/售后流程。";
  addHistory("FEEDBACK_SAVED", "user", `${result}：${note}`);
  $("#feedback-note").value = "";
  saveState();
  render();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${state.ticket_id}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function resetDemo() {
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  $("#idea-input").value = "";
  saveState();
  render();
  setTab("intake");
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultState(), ...JSON.parse(saved) } : defaultState();
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function modeLabel(mode) {
  const labels = {
    buy: "直接购买",
    print: "3D 打印",
    hybrid: "混合方案",
    undecided: "未决策",
  };
  return labels[mode] || "人工审核";
}

function typeLabel(type) {
  const labels = {
    buy: "购买",
    print: "打印",
    inventory: "库存",
    outsource: "外包",
  };
  return labels[type] || type;
}

function statusLabel(status) {
  const labels = {
    needs_quote: "待报价",
    ready_to_slice: "待切片",
    in_stock: "库存可用",
  };
  return labels[status] || status;
}

function listText(values) {
  if (!values || !values.length) return "-";
  return values.join("；");
}

function matches(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}
