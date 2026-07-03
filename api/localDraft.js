export function buildLocalStructuredTicket(userIntent) {
  const text = String(userIntent || "").toLowerCase();
  const objectType = inferObjectType(text);
  const questions = buildQuestions(objectType);
  const mode = objectType === "线缆管理器" ? "print" : "hybrid";

  return {
    risk_class: "A",
    category: inferCategory(objectType),
    handling_strategy: "可生成结构化 Ticket 草案",
    reason: "该请求属于 V2R-0 可试运行的低风险桌面/房间小物件范围。",
    object_type: objectType,
    questions,
    spec: {
      project_name: objectType,
      user_goal: String(userIntent || ""),
      environment: inferEnvironment(text),
      functions: inferFunctions(text, objectType),
      constraints: ["优先使用 3D 打印或标准件", "不接电", "不承重", "不涉及儿童、医疗或食品接触"],
      acceptance: ["核心功能可用", "关键尺寸可验证", "无明显尖锐边缘", "可在 5 分钟内安装或使用"],
    },
    realization_mode: mode,
    bom: buildBom(objectType, mode),
    quotes_allowed: true,
  };
}

function inferObjectType(text) {
  if (hasAny(text, ["耳机", "headphone", "headset"])) return "桌边夹式耳机架";
  if (hasAny(text, ["线缆", "数据线", "电线", "cable"])) return "线缆管理器";
  if (hasAny(text, ["手机", "phone", "stand"])) return "手机支架";
  if (hasAny(text, ["抽屉", "drawer", "分隔"])) return "抽屉分隔件";
  if (hasAny(text, ["挂钩", "hook"])) return "轻量挂钩";
  return "桌面收纳件";
}

function inferCategory(objectType) {
  const categories = {
    桌边夹式耳机架: "桌面配件",
    线缆管理器: "线缆管理",
    手机支架: "桌面配件",
    抽屉分隔件: "桌面收纳",
    轻量挂钩: "轻量挂钩",
    桌面收纳件: "桌面收纳",
  };
  return categories[objectType] || "低风险小物件";
}

function inferEnvironment(text) {
  if (hasAny(text, ["桌边", "desk edge"])) return "桌边";
  if (hasAny(text, ["桌下", "under desk"])) return "桌下";
  if (hasAny(text, ["抽屉", "drawer"])) return "抽屉内部";
  if (hasAny(text, ["宿舍", "dorm"])) return "宿舍/书桌";
  return "桌面/室内";
}

function inferFunctions(text, objectType) {
  const functions = [];
  if (objectType === "桌边夹式耳机架") functions.push("挂耳机");
  if (objectType === "线缆管理器") functions.push("固定线缆");
  if (objectType === "手机支架") functions.push("支撑手机");
  if (objectType === "抽屉分隔件") functions.push("分隔收纳");
  if (hasAny(text, ["绕线", "绕数据线"])) functions.push("整理数据线");
  if (hasAny(text, ["不打孔", "免打孔", "夹"])) functions.push("不打孔固定");
  return functions.length ? [...new Set(functions)] : ["满足用户描述的基础功能"];
}

function buildQuestions(objectType) {
  const questionSets = {
    桌边夹式耳机架: [
      question("desk_thickness", "桌板厚度", "用于确认夹持结构尺寸"),
      question("load_weight", "耳机重量", "用于判断材料和打印方向"),
      question("priority", "优先级", "用于在价格、速度和定制程度之间取舍"),
    ],
    线缆管理器: [
      question("cable_count", "线缆数量", "用于确定夹槽数量和间距"),
      question("mount_surface", "固定位置", "用于选择胶贴、夹持或摆放方式"),
      question("priority", "优先级", "用于在价格、速度和稳定性之间取舍"),
    ],
    手机支架: [
      question("phone_size", "手机尺寸", "用于确认支撑宽度"),
      question("view_angle", "观看角度", "用于确认支架角度"),
      question("priority", "优先级", "用于在价格、速度和外观之间取舍"),
    ],
    抽屉分隔件: [
      question("drawer_size", "抽屉内径", "用于生成分隔尺寸"),
      question("compartments", "分隔数量", "用于确定格子布局"),
      question("priority", "优先级", "用于在价格、定制和耐用之间取舍"),
    ],
  };

  return questionSets[objectType] || [
    question("outer_size", "大概尺寸", "用于估算材料和打印时间"),
    question("budget", "预算", "用于过滤方案"),
    question("priority", "优先级", "用于在价格、速度和定制程度之间取舍"),
  ];
}

function question(id, label, whyNeeded) {
  return { id, label, why_needed: whyNeeded };
}

function buildBom(objectType, mode) {
  if (objectType === "桌边夹式耳机架") {
    return [
      bom("主体支架", "print", 1, "PETG/PLA，颜色按用户指定", "draft"),
      bom("夹持结构", "print", 1, "按桌板厚度参数生成", "draft"),
      bom("防滑橡胶垫", "buy", 2, "20 x 30mm，可替代规格", "needs_quote"),
      bom("M4 螺丝", "inventory", 1, "M4 x 35mm", "candidate"),
    ];
  }

  if (objectType === "线缆管理器") {
    return [
      bom("线缆夹主体", "print", 3, "按线缆数量生成夹槽", "draft"),
      bom("固定胶贴", "buy", 3, "可移除双面胶", "needs_quote"),
    ];
  }

  return [
    bom("参数化主体件", mode === "print" ? "print" : "print", 1, "按规格书确认", "draft"),
    bom("固定/缓冲配件", "buy", 1, "橡胶垫、胶贴或螺丝", "needs_quote"),
  ];
}

function bom(name, type, quantity, spec, status) {
  return { name, type, quantity, spec, status };
}

function hasAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}
