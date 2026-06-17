/**
 * 合规分析引擎 — Lex 核心判定逻辑
 *
 * 架构设计：
 * ┌─────────────────────────────────────────────────────────┐
 * │  INPUT LAYER (输入层)                                    │
 * │  产品描述 + 结构化表单                                  │
 * ├─────────────────────────────────────────────────────────┤
 * │  PARSING LAYER (解析层)                                  │
 * │  特征提取 → 场景归类 → 法域确定                        │
 * ├─────────────────────────────────────────────────────────┤
 * │  MATCHING LAYER (匹配层)                                 │
 * │  关键词匹配 + 语义特征匹配 + 跨条款关联                 │
 * ├─────────────────────────────────────────────────────────┤
 * │  JUDGMENT LAYER (判定层)                                 │
 * │  义务类型判定 → 风险等级计算 → 处罚后果评估             │
 * ├─────────────────────────────────────────────────────────┤
 * │  OUTPUT LAYER (输出层)                                   │
 * │  风险报告 + 合规建议 + 整改清单 + 备案导引              │
 * └─────────────────────────────────────────────────────────┘
 */

import { REGULATORY_LIBRARY, ALL_ARTICLES, fullTextSearch } from "./regulatory-library";
import type { Regulatory, RegulatoryArticle, ObligationType } from "./regulatory-library";

// ============================================================
// TYPES
// ============================================================

export type Severity = "critical" | "high" | "medium" | "low";
export type RiskLevel = "critical" | "high" | "medium" | "low" | "none";
export type ConclusionType = "blocked" | "conditional" | "approved";

/** 风险维度（映射到原有四维度体系） */
export type RiskDimension = "policy" | "industry" | "product" | "data";

/** 合规特征提取结果 */
export interface ComplianceFeatures {
  /** 是否涉及生成式AI */
  hasGenerativeAI: boolean;
  /** AI 技术路径 */
  aiTechPath: "llm_api" | "fine_tuned" | "rag" | "deep_synthesis" | "recommendation" | "none";
  /** 产品形态 */
  productForm: "app" | "miniprogram" | "web" | "api" | "platform" | "unknown";
  /** 目标用户 */
  targetUsers: "general" | "minors" | "enterprise" | "mixed";
  /** 是否收集个人信息 */
  collectsPersonalData: boolean;
  /** 个人数据类型标签 */
  personalDataTypeTags: string[];
  /** 涉及敏感信息 */
  involvesSensitiveData: boolean;
  /** 涉及跨境数据 */
  involvesCrossBorder: boolean;
  /** 内容类型 */
  contentType: "text" | "image" | "video" | "audio" | "code" | "mixed" | "unknown";
  /** 部署区域 */
  deploymentRegion: "cn" | "cn_and_hk" | "overseas" | "cross_border";
  /** 商业模式 */
  businessModel: "free" | "paid" | "freemium" | "b2b" | "unknown";
}

/** 单条匹配结果 */
export interface ArticleMatch {
  article: RegulatoryArticle;
  regulation: Regulatory;
  dimension: RiskDimension;
  severity: Severity;
  matchReason: string;
  matchedTriggers: string[];
  complianceGap: string;
  remediation: string;
  mandatoryAction: string;
}

/** 综合分析报告 */
export interface ComplianceReport {
  /** 综合分析 */
  conclusion: ConclusionType;
  conclusionText: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100

  /** 风险摘要 */
  summary: {
    totalFindings: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };

  /** 四维分解 */
  dimensions: Record<RiskDimension, { level: Severity; findings: number; detail: string[] }>;

  /** 详细匹配结果 */
  matches: ArticleMatch[];

  /** 备案判断 */
  filingRequirements: {
    required: boolean;
    items: { name: string; urgency: "immediate" | "before_launch" | "ongoing"; regulation: string }[];
  };

  /** 安全评估判断 */
  securityAssessment: {
    required: boolean;
    reason: string;
    regulation: string;
  };

  /** 整改清单 */
  remediationList: {
    priority: "P0" | "P1" | "P2";
    action: string;
    regulation: string;
    deadline: "immediate" | "1_week" | "1_month" | "before_launch";
  }[];

  /** 建议先行试点的低风险版本 */
  recommendedMinimalVersion?: string;

  /** 处罚风险提示 */
  penaltyRisks: {
    description: string;
    maxPenalty: string;
    regulation: string;
  }[];

  /** 数据溯源 */
  traceability: {
    analysisTime: string;
    regulatoryLibraryVersion: string;
    totalRegulations: number;
    totalArticles: number;
    triggeredArticles: number;
  };
}

// ============================================================
// LAYER 1 — 输入解析 (Feature Extraction)
// ============================================================

/**
 * 从用户输入中提取合规特征向量
 */
export function extractFeatures(input: {
  productName: string;
  description: string;
  productType?: string;
  industry?: string;
  aiModelProvider?: string;
  collectsPersonalData?: boolean;
  personalDataTypes?: string;
  involvesSensitiveData?: boolean;
  involvesCrossBorderData?: boolean;
  usesRecommendationAlgorithm?: boolean;
  involvesDeepSynthesis?: boolean;
  hasUserContent?: boolean;
  targetsMinors?: boolean;
  hasPaymentFeature?: boolean;
  deploymentRegion?: string;
}): ComplianceFeatures {
  const allText = [
    input.description,
    input.productName,
    input.industry ?? "",
    input.aiModelProvider ?? "",
    input.personalDataTypes ?? "",
    input.deploymentRegion ?? "",
  ]
    .join(" ")
    .toLowerCase();

  // AI 技术路径识别
  let aiTechPath: ComplianceFeatures["aiTechPath"] = "none";
  if (/大模型|LLM|GPT|Claude|文心|通义|生成式AI|生成式/.test(allText)) {
    if (/微调|fine.?tun|RAG|向量|embedding/.test(allText)) {
      aiTechPath = "rag";
    } else if (/微调|fine.?tun/.test(allText)) {
      aiTechPath = "fine_tuned";
    } else {
      aiTechPath = "llm_api";
    }
  }
  if (/深度合成|数字人|换脸|语音合成|视频生成|虚拟人/.test(allText)) {
    aiTechPath = "deep_synthesis";
  }
  if (/推荐|个性化|信息流|内容推送/.test(allText)) {
    aiTechPath = aiTechPath === "none" ? "recommendation" : aiTechPath;
  }

  // 产品形态
  let productForm: ComplianceFeatures["productForm"] = "unknown";
  if (/app(?!.*小程序)|iOS|安卓|android/i.test(allText)) productForm = "app";
  if (/小程序/.test(allText)) productForm = "miniprogram";
  if (/网站|Web|SaaS/.test(allText)) productForm = "web";
  if (/API|接口/.test(allText)) productForm = "api";
  if (/平台/.test(allText)) productForm = "platform";

  // 目标用户
  let targetUsers: ComplianceFeatures["targetUsers"] = "general";
  if (/未成年|青少年|儿童|学生|少儿/.test(allText)) targetUsers = "minors";
  if (/企业|B2B|SaaS|内部/.test(allText)) targetUsers = "enterprise";

  // 个人数据
  const personalDataTypeTags: string[] = [];
  if (/手机号|邮箱|用户名|账号/.test(allText)) personalDataTypeTags.push("basic_identity");
  if (/位置|定位|GPS/.test(allText)) personalDataTypeTags.push("location");
  if (/身份证|人脸|指纹|银行卡/.test(allText)) personalDataTypeTags.push("sensitive");
  if (/行为|浏览|点击|画像/.test(allText)) personalDataTypeTags.push("behavioral");
  if (/内容|对话|聊天|UGC|用户生成/.test(allText)) personalDataTypeTags.push("content");

  // 内容类型
  let contentType: ComplianceFeatures["contentType"] = "unknown";
  if (/文案|文本|写作|文章/.test(allText)) contentType = "text";
  if (/图片|图像|照片|绘画/.test(allText)) contentType = "image";
  if (/视频|短视频/.test(allText)) contentType = "video";
  if (/音频|语音|音乐/.test(allText)) contentType = "audio";
  if (/代码|编程/.test(allText)) contentType = "code";
  if (/文案|图片|视频|文本|图像/.test(allText).toString().match(/true/g)?.length ?? 0 > 1) contentType = "mixed";

  // 部署区域
  let deploymentRegion: ComplianceFeatures["deploymentRegion"] = "cn";
  if (/跨境|海外|境外|国外|global/.test(allText)) {
    if (/香港|HK|澳门/.test(allText)) deploymentRegion = "cn_and_hk";
    else deploymentRegion = "cross_border";
  }

  // 商业模式
  let businessModel: ComplianceFeatures["businessModel"] = "unknown";
  if (/付费|订阅|会员|充值|购买/.test(allText)) businessModel = "paid";
  if (/免费/.test(allText)) businessModel = "free";
  if (/B2B|企业服务|SaaS/.test(allText)) businessModel = "b2b";

  return {
    hasGenerativeAI: /生成式|AI|LLM|GPT|大模型|大语言|生成|Claude|文心|通义/.test(allText),
    aiTechPath,
    productForm,
    targetUsers,
    collectsPersonalData:
      input.collectsPersonalData ?? /个人信息|手机号|邮箱|注册|账号/.test(allText),
    personalDataTypeTags,
    involvesSensitiveData:
      input.involvesSensitiveData ?? /敏感|身份证|人脸|指纹|银行卡/.test(allText),
    involvesCrossBorder:
      input.involvesCrossBorderData ?? /跨境|海外|境外|国外/.test(allText),
    contentType,
    deploymentRegion,
    businessModel,
  };
}

// ============================================================
// LAYER 2 — 法规匹配 (Regulatory Matching)
// ============================================================

/**
 * 基于特征向量匹配适用的法律法规条款
 * 采用分层匹配策略：
 *   Level 1: 关键词精确匹配（triggerKeywords）
 *   Level 2: 语义特征匹配（特征标签与条款义务类型的映射）
 *   Level 3: 跨条款关联（触发一条后，自动关联相关条款）
 */
export function matchRegulations(
  features: ComplianceFeatures,
  description: string
): ArticleMatch[] {
  const matches: ArticleMatch[] = [];
  const descText = description.toLowerCase();
  const addedArticleIds = new Set<string>();

  // ---- Level 1: 关键词精确匹配 ----
  for (const article of ALL_ARTICLES) {
    for (const ob of article.obligations) {
      const matchedTriggers: string[] = [];
      for (const tk of ob.triggerKeywords) {
        if (descText.includes(tk.toLowerCase())) {
          matchedTriggers.push(tk);
        }
      }

      if (matchedTriggers.length > 0 && !addedArticleIds.has(article.id)) {
        addedArticleIds.add(article.id);
        const regulation = REGULATORY_LIBRARY.find((r) => r.id === article.regulationId)!;

        matches.push(buildMatch(article, regulation, ob.type, ob.severity, matchedTriggers, features));
        break; // 一个条款匹配一次
      }
    }
  }

  // ---- Level 2: 语义特征匹配 ----
  // 基于特征标签的补充匹配（处理关键词未覆盖的情况）
  const contextRules = deriveContextMatches(features);
  for (const rule of contextRules) {
    if (!addedArticleIds.has(rule)) {
      const article = ALL_ARTICLES.find((a) => a.id === rule);
      if (article) {
        addedArticleIds.add(rule);
        const regulation = REGULATORY_LIBRARY.find((r) => r.id === article.regulationId)!;
        const ob = article.obligations[0];
        matches.push(
          buildMatch(article, regulation, ob.type, ob.severity, [features.aiTechPath.toString()], features)
        );
      }
    }
  }

  // ---- Level 3: 跨条款关联 ----
  // 若触发了某种义务（如内容生成），自动关联内容标识义务
  const crossRefs = deriveCrossReferences(matches, features);
  for (const ref of crossRefs) {
    if (!addedArticleIds.has(ref)) {
      const article = ALL_ARTICLES.find((a) => a.id === ref);
      if (article) {
        addedArticleIds.add(ref);
        const regulation = REGULATORY_LIBRARY.find((r) => r.id === article.regulationId)!;
        const ob = article.obligations[0];
        matches.push(
          buildMatch(article, regulation, ob.type, ob.severity, ["跨条款关联"], features)
        );
      }
    }
  }

  // 按严重程度排序
  const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  matches.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return matches;
}

/** 构建 Match 对象 */
function buildMatch(
  article: RegulatoryArticle,
  regulation: Regulatory,
  obligationType: ObligationType,
  severity: Severity,
  matchedTriggers: string[],
  features: ComplianceFeatures
): ArticleMatch {
  const dimension = mapCategoryToDimension(regulation.category, article.obligations[0]?.target);

  return {
    article,
    regulation,
    dimension,
    severity,
    matchReason: `在用户输入中检测到[${matchedTriggers.join(", ")}]，触发 ${regulation.shortTitle || regulation.title} ${article.articleNumber}「${article.title || ""}」`,
    matchedTriggers,
    complianceGap: generateComplianceGap(article, features),
    remediation: generateRemediation(article, obligationType),
    mandatoryAction: article.obligations[0]?.target ?? "无明确义务",
  };
}

/** 分类映射到风险维度 */
function mapCategoryToDimension(category: string, target?: string): RiskDimension {
  switch (category) {
    case "ai":
      return target?.includes("备案") ? "policy" : "product";
    case "data_privacy":
      return "data";
    case "cybersecurity":
      return "policy";
    case "consumer":
    case "advertising":
      return "product";
    default:
      return "industry";
  }
}

/** 基于语义特征的上下文匹配 */
function deriveContextMatches(features: ComplianceFeatures): string[] {
  const matched: string[] = [];

  // 收集个人信息 → 必然触发隐私政策+用户协议
  if (features.collectsPersonalData) {
    matched.push("pipl-art-17"); // 告知义务
  }

  // 敏感信息 → 触发单独同意
  if (features.involvesSensitiveData) {
    matched.push("pipl-art-28"); // 敏感信息处理
  }

  // 未成年人
  if (features.targetUsers === "minors") {
    matched.push("minor-law-art-75");
  }

  // AI + 广告/营销
  if (features.hasGenerativeAI && ["广告", "营销"].some((t) => features.aiTechPath.includes(t))) {
    matched.push("ad-law-art-4");
  }

  return matched;
}

/** 跨条款关联推导 */
function deriveCrossReferences(
  matches: ArticleMatch[],
  features: ComplianceFeatures
): string[] {
  const refs: string[] = [];
  const matchedIds = new Set(matches.map((m) => m.article.id));

  // 生成式AI → 必须关联内容标识
  if (features.hasGenerativeAI && !matchedIds.has("gen-ai-art-12")) {
    refs.push("gen-ai-art-12");
  }

  // 深度合成 → 必须关联深度合成标识
  if (features.aiTechPath === "deep_synthesis" && !matchedIds.has("deep-syn-art-16")) {
    refs.push("deep-syn-art-16");
  }

  // AI + 营销 → 关联消费者保护
  if (
    features.hasGenerativeAI &&
    ["广告", "营销"].some((k) =>
      matches.some((m) => m.article.keywords.some((kw) => kw.includes(k)))
    ) &&
    !matchedIds.has("cpl-art-20")
  ) {
    refs.push("cpl-art-20");
  }

  return refs;
}

// ============================================================
// LAYER 3 — 风险等级判定 (Risk Scoring Algorithm)
// ============================================================

/**
 * 多维风险评分算法
 *
 * 评分维度：
 *   1. 义务类型权重：mandatory(25) > prohibitive(20) > conditional(15) > procedural(10)
 *   2. 条款严重等级：critical(×2) > high(×1.5) > medium(×1) > low(×0.5)
 *   3. 处罚后果因子：刑事(+20) > 吊销许可(+15) > 停业(+10) > 罚款(+5)
 *   4. 累积效应：相同维度多条目触发叠加
 *
 * 风险等级阈值：
 *   0-15: low | 16-30: medium | 31-50: high | 51-100: critical
 */
export function calculateRiskScore(matches: ArticleMatch[]): {
  score: number;
  level: RiskLevel;
  breakdown: { dimension: RiskDimension; score: number; maxScore: number }[];
} {
  const dimensionScores: Record<RiskDimension, number> = {
    policy: 0,
    industry: 0,
    product: 0,
    data: 0,
  };

  const obligationWeights: Record<ObligationType, number> = {
    mandatory: 25,
    prohibitive: 20,
    conditional: 15,
    procedural: 10,
  };

  const severityMultipliers: Record<Severity, number> = {
    critical: 2.0,
    high: 1.5,
    medium: 1.0,
    low: 0.5,
  };

  let totalScore = 0;

  for (const match of matches) {
    const obType = match.article.obligations[0]?.type ?? "conditional";
    const base = obligationWeights[obType];
    const multiplier = severityMultipliers[match.severity];
    const itemScore = base * multiplier;

    // 处罚后果附加分
    let penaltyBonus = 0;
    if (match.article.penalty) {
      const penaltyText = match.article.penalty.description + match.article.penalty.statutoryPenalty;
      if (/吊销|revoke/.test(penaltyText)) penaltyBonus = 15;
      else if (/停业|暂停|shutdown|suspend/.test(penaltyText)) penaltyBonus = 10;
      else if (/罚款|fine|处罚/.test(penaltyText)) penaltyBonus = 5;
    }

    const finalScore = itemScore + penaltyBonus;
    dimensionScores[match.dimension] += finalScore;
    totalScore += finalScore;
  }

  // 归一化（最高 100 分）
  const normalized = Math.min(100, totalScore);

  // 风险等级判定
  let level: RiskLevel;
  if (normalized >= 51) level = "critical";
  else if (normalized >= 31) level = "high";
  else if (normalized >= 16) level = "medium";
  else if (normalized > 0) level = "low";
  else level = "none";

  // 各维度 maxScore 为 100
  const breakdown = (Object.entries(dimensionScores) as [RiskDimension, number][]).map(
    ([dim, score]) => ({
      dimension: dim,
      score: Math.min(100, Math.round(score)),
      maxScore: 100,
    })
  );

  return { score: normalized, level, breakdown };
}

/** 判定评审结论 */
export function determineConclusion(
  riskLevel: RiskLevel,
  matches: ArticleMatch[]
): { conclusion: ConclusionType; text: string } {
  const criticalCount = matches.filter((m) => m.severity === "critical").length;
  const highCount = matches.filter((m) => m.severity === "high").length;

  if (riskLevel === "critical" || criticalCount >= 2) {
    return {
      conclusion: "blocked",
      text: `存在 ${criticalCount} 项严重合规风险（${highCount} 项高风险），建议完成整改后再进入开发。涉及强制性合规义务，违规可能导致严重处罚。`,
    };
  }

  if (riskLevel === "high" || highCount >= 2) {
    return {
      conclusion: "conditional",
      text: `存在 ${highCount} 项高风险项，有条件放行：需在开发中同步整改高风险项，建议设置合规里程碑检查点。`,
    };
  }

  if (riskLevel === "medium") {
    return {
      conclusion: "conditional",
      text: "存在若干中等风险项，有条件放行：建议在开发过程中逐步整改，上线前完成合规确认。",
    };
  }

  return {
    conclusion: "approved",
    text: "合规风险可控，符合当前法规要求，可以进入开发。建议持续关注法规动态并在上线前进行最终合规检查。",
  };
}

// ============================================================
// LAYER 4 — 输出生成 (Report Generation)
// ============================================================

/**
 * 生成完整的合规分析报告
 */
export function generateComplianceReport(
  input: Parameters<typeof extractFeatures>[0],
  existingMatches?: ArticleMatch[]
): ComplianceReport {
  // 1. 特征提取
  const features = extractFeatures(input);

  // 2. 法规匹配
  const matches = existingMatches ?? matchRegulations(features, input.description);

  // 3. 风险评分
  const { score, level, breakdown } = calculateRiskScore(matches);

  // 4. 评审结论
  const { conclusion, text: conclusionText } = determineConclusion(level, matches);

  // 5. 四维分解
  const dimensions: Record<RiskDimension, { level: Severity; findings: number; detail: string[] }> = {
    policy: { level: "low", findings: 0, detail: [] },
    industry: { level: "low", findings: 0, detail: [] },
    product: { level: "low", findings: 0, detail: [] },
    data: { level: "low", findings: 0, detail: [] },
  };

  for (const match of matches) {
    const dim = dimensions[match.dimension];
    dim.findings++;
    dim.detail.push(`${match.regulation.shortTitle || match.regulation.title} · ${match.article.articleNumber}`);
    const severityOrder: Severity[] = ["low", "medium", "high", "critical"];
    if (severityOrder.indexOf(match.severity) > severityOrder.indexOf(dim.level as Severity)) {
      dim.level = match.severity;
    }
  }

  // 6. 备案判断
  const filingItems: ComplianceReport["filingRequirements"]["items"] = [];
  if (features.hasGenerativeAI) {
    filingItems.push({ name: "算法备案", urgency: "immediate", regulation: "《生成式AI暂行办法》第4条、《算法推荐管理规定》第24条" });
    filingItems.push({ name: "生成式AI服务备案", urgency: "before_launch", regulation: "《生成式AI暂行办法》第4条" });
  }
  if (features.aiTechPath === "deep_synthesis") {
    filingItems.push({ name: "深度合成服务备案", urgency: "before_launch", regulation: "《深度合成管理规定》" });
  }
  if (features.productForm === "app" || features.productForm === "miniprogram") {
    filingItems.push({ name: "ICP备案", urgency: "before_launch", regulation: "《互联网信息服务管理办法》" });
  }
  if (features.hasGenerativeAI && features.targetUsers !== "enterprise") {
    filingItems.push({ name: "安全评估（舆论属性/社会动员能力）", urgency: "immediate", regulation: "《生成式AI暂行办法》第4条" });
  }

  // 7. 安全评估判断
  const needsSecurityAssessment =
    features.involvesSensitiveData ||
    features.involvesCrossBorder ||
    features.targetUsers === "minors" ||
    (features.hasGenerativeAI && features.productForm !== "api");

  const securityAssessmentReason = (() => {
    if (features.involvesSensitiveData) return "涉及敏感个人信息处理，需进行个人信息保护影响评估";
    if (features.involvesCrossBorder) return "涉及数据跨境传输，需通过数据出境安全评估";
    if (features.targetUsers === "minors") return "面向未成年人提供服务，需进行未成年人保护影响评估";
    if (features.hasGenerativeAI) return "提供生成式AI服务，依法需进行安全评估";
    return "暂无需强制性安全评估";
  })();

  // 8. 整改清单
  const remediationList: ComplianceReport["remediationList"] = matches
    .filter((m) => m.severity === "critical" || m.severity === "high")
    .map((m) => ({
      priority: m.severity === "critical" ? "P0" as const : "P1" as const,
      action: m.mandatoryAction,
      regulation: `${m.regulation.shortTitle || m.regulation.title} ${m.article.articleNumber}`,
      deadline: m.severity === "critical" ? "immediate" as const : "1_month" as const,
    }));

  // 9. 处罚风险
  const penaltyRisks: ComplianceReport["penaltyRisks"] = matches
    .filter((m) => m.article.penalty)
    .map((m) => ({
      description: m.article.penalty!.description,
      maxPenalty: m.article.penalty!.statutoryPenalty,
      regulation: `${m.regulation.shortTitle || m.regulation.title} ${m.article.articleNumber}`,
    }));

  // 10. 建议先行试点的低风险版本
  const recommendedMinimalVersion = generateMinimalVersion(features, matches);

  return {
    conclusion,
    conclusionText,
    riskLevel: level,
    riskScore: Math.round(score),

    summary: {
      totalFindings: matches.length,
      critical: matches.filter((m) => m.severity === "critical").length,
      high: matches.filter((m) => m.severity === "high").length,
      medium: matches.filter((m) => m.severity === "medium").length,
      low: matches.filter((m) => m.severity === "low").length,
    },

    dimensions,

    matches: matches.map((m) => ({
      ...m,
      regulation: { ...m.regulation, articles: [] }, // 去除冗余数据
    })),

    filingRequirements: {
      required: filingItems.length > 0,
      items: filingItems,
    },

    securityAssessment: {
      required: needsSecurityAssessment,
      reason: securityAssessmentReason,
      regulation: needsSecurityAssessment
        ? features.hasGenerativeAI
          ? "《生成式AI暂行办法》第4条"
          : "《个人信息保护法》第55-56条"
        : "暂无",
    },

    remediationList,
    recommendedMinimalVersion,
    penaltyRisks,
    traceability: {
      analysisTime: new Date().toISOString(),
      regulatoryLibraryVersion: "demo-v1.0-20260606",
      totalRegulations: REGULATORY_LIBRARY.length,
      totalArticles: ALL_ARTICLES.length,
      triggeredArticles: matches.length,
    },
  };
}

// ============================================================
// 辅助函数
// ============================================================

/** 生成合规差距说明 */
function generateComplianceGap(article: RegulatoryArticle, features: ComplianceFeatures): string {
  const ob = article.obligations[0];
  if (!ob) return "该条款适用于您的产品场景，当前可能存在合规差距。" as const;

  switch (ob.type) {
    case "mandatory":
      return `强制性义务：必须${ob.target}，当前产品功能触发了此要求，如未执行可能面临处罚风险。`;
    case "prohibitive":
      return `禁止性规定：不得${ob.target}，当前产品描述中存在相关风险特征，需确认是否逾越红线。`;
    case "conditional":
      return `附条件义务：${ob.target}需要满足特定条件，请确认当前方案是否具备合规基础。`;
    case "procedural":
      return `程序性义务：需履行${ob.target}程序，建议在开发计划中预留相应流程。`;
  }
}

/** 生成整改建议 */
function generateRemediation(article: RegulatoryArticle, obType: ObligationType): string {
  switch (obType) {
    case "mandatory":
      return `立即采取整改措施：${article.obligations[0]?.target || "完成相关合规要求"}`;
    case "prohibitive":
      return `立即停止相关行为或调整产品方案以避免触发此禁令`;
    case "conditional":
      return `满足前置条件后再推进：${article.obligations[0]?.target || "确认合规基础"}`;
    case "procedural":
      return `在产品开发计划中纳入此程序性要求：${article.obligations[0]?.target || "完成相关流程"}`;
  }
}

/** 生成建议先行试点的低风险版本 */
function generateMinimalVersion(
  features: ComplianceFeatures,
  matches: ArticleMatch[]
): string {
  const highRiskItems = matches.filter((m) => m.severity === "critical" || m.severity === "high");

  if (highRiskItems.length === 0) {
    return "当前方案合规风险整体可控，可以直接推进。建议参考整改清单完成P1/P2项即可。";
  }

  const suggestions: string[] = ["建议以下低风险试点方案："];

  if (features.involvesSensitiveData) {
    suggestions.push("1. 先行上线不涉及敏感个人信息的基础功能版本（如仅收集邮箱/用户名，暂缓人脸/身份证/定位等功能）");
  }

  if (features.involvesCrossBorder) {
    suggestions.push("2. 先行部署中国境内版本，数据全部存储于境内服务器；跨境功能留待 V2.0");
  }

  if (features.aiTechPath === "deep_synthesis") {
    suggestions.push("3. 先行以文本生成为切入点，暂缓视频生成/人脸合成功能，待深度合成备案完成后逐步上线");
  }

  if (features.targetUsers === "minors") {
    suggestions.push("4. 先行面向成年用户群体，暂缓未成年人功能模块，待建立防沉迷和过滤机制后以独立模式上线");
  }

  if (features.productForm === "app" && features.hasGenerativeAI) {
    suggestions.push("5. 先行以 Web 版本灰度测试，完成算法备案后再提交 App Store 上架");
  }

  if (suggestions.length === 1) {
    suggestions.push("风险项可通过前端调整快速规避，建议完成高风险整改后全量推进。");
  }

  return suggestions.join("\n");
}

// ============================================================
// 工具函数
// ============================================================

/** 对比两版分析的差异 */
export function diffAnalyses(
  before: ComplianceReport,
  after: ComplianceReport
): { added: ArticleMatch[]; removed: ArticleMatch[]; scoreDelta: number } {
  const beforeIds = new Set(before.matches.map((m) => m.article.id));
  const afterIds = new Set(after.matches.map((m) => m.article.id));

  const added = after.matches.filter((m) => !beforeIds.has(m.article.id));
  const removed = before.matches.filter((m) => !afterIds.has(m.article.id));

  return {
    added,
    removed,
    scoreDelta: after.riskScore - before.riskScore,
  };
}
