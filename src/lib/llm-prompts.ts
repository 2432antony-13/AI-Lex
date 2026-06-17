/**
 * 合规分析 Prompt 模板
 *
 * 用于 LLM 驱动的语义合规分析。
 * 配合 src/lib/llm.ts 使用。
 */

import type { ChatMessage } from "./llm";
import { REGULATORY_LIBRARY } from "./regulatory-library";

// ============================================================
// 系统提示词
// ============================================================

/**
 * 构建法规知识注入的系统 prompt（轻量版，quick/flash 模式使用）
 * 只注入法规标题和简要职责，不注入全文条款，大幅降低 token 消耗
 */
function buildRegulatoryContextQuick(): string {
  const laws = REGULATORY_LIBRARY.filter(
    (r) => r.status === "effective" && r.lawType === "law"
  );
  const keyRules = REGULATORY_LIBRARY.filter(
    (r) =>
      r.status === "effective" &&
      r.articles.length > 0 &&
      r.articles[0].dataStatus !== "metadata_only" &&
      r.lawType !== "law"
  );

  const summary = [
    ...laws.map((r) => `- ${r.shortTitle || r.title}（${r.summary}）`),
    ...keyRules.map((r) => `- ${r.shortTitle || r.title}（${r.summary}）`),
  ].join("\n");

  return `你是中国数据合规与AI法律顾问。你熟悉以下法规：

${summary}

## 核心规则
- 法律 > 行政法规 > 部门规章 > 规范性文件
- AI专项 > 通用数据法
- 新法 > 旧法
- 2024年《促进和规范数据跨境流动规定》重大松绑：不满10万非敏感个人信息免报；评估有效期3年
- 个保审计：1000万+个人信息每两年强制审计；100万+须指定保护负责人

## 输出：JSON，不输出其他内容，不确定的标 unknown`;
}

/**
 * 构建法规知识注入的系统 prompt（完整版，full/pro 模式使用）
 * 注入法规+条款摘要，用于深度推理
 */
function buildRegulatoryContextFull(): string {
  const effective = REGULATORY_LIBRARY.filter((r) => r.status === "effective");
  const withArticles = effective.filter(
    (r) => r.articles.length > 0 && r.articles[0].dataStatus !== "metadata_only"
  );

  const context = withArticles.map((r) => {
    const articlesSummary = r.articles
      .map(
        (a) =>
          `  - ${a.articleNumber}: ${a.title || a.content.slice(0, 80)} [${
            a.obligations.map((o) => `${o.type}:${o.severity}`).join(", ") || "无具体义务标注"
          }]`
      )
      .join("\n");
    return `【${r.shortTitle || r.title}】${r.lawType} | ${r.industry || "通用"} | 出海:${r.crossBorderLevel || "—"}\n${articlesSummary}`;
  });

  return `你是一位专业的中国数据合规与AI法律顾问。你拥有以下法律法规知识：

${context.join("\n\n")}

## 核心判断规则

1. **法律 > 行政法规 > 部门规章 > 规范性文件**（上位法优先）
2. **特别法 > 一般法**（例如：AI专项规定优先于通用数据保护法）
3. **新法 > 旧法**（同一事项，以后颁布的为准）
4. **强制性国标(GB) > 推荐性国标(GB/T)**
5. **2024年《促进和规范数据跨境流动规定》对数据出境制度做了重大松绑**，与2022/2023旧规不一致的，以新规为准

## 输出要求
- 以JSON格式严格输出
- 不输出任何JSON之外的文字
- 如果产品描述不足以判断某项，标记为 unknown（不要猜测）`;
}

// ============================================================
// 分析结果类型
// ============================================================

interface FeatureAnalysis {
  /** 是否涉及生成式AI */
  hasGenerativeAI: boolean | "unknown";
  /** AI技术路径 */
  aiTechPath: "llm_api" | "fine_tuned" | "rag" | "deep_synthesis" | "recommendation" | "none" | "unknown";
  /** 产品形态 */
  productForm: "app" | "miniprogram" | "web" | "api" | "platform" | "unknown";
  /** 目标用户 */
  targetUsers: "general" | "minors" | "enterprise" | "mixed" | "unknown";
  /** 是否收集个人信息 */
  collectsPersonalData: boolean | "unknown";
  /** 涉及敏感信息 */
  involvesSensitiveData: boolean | "unknown";
  /** 涉及跨境数据 */
  involvesCrossBorder: boolean | "unknown";
  /** 内容类型 */
  contentType: "text" | "image" | "video" | "audio" | "code" | "mixed" | "unknown";
  /** 部署区域 */
  deploymentRegion: "cn" | "cn_and_hk" | "overseas" | "cross_border" | "unknown";
}

interface ObligationHit {
  regulationTitle: string;
  regulationId: string;
  articleNumber: string;
  articleTitle: string;
  obligationType: "mandatory" | "prohibitive" | "conditional" | "procedural";
  severity: "critical" | "high" | "medium" | "low";
  reasoning: string;
  penalty?: {
    type: string;
    description: string;
    maxPenalty: string;
  };
}

interface GapFinding {
  dimension: "policy" | "industry" | "product" | "data";
  riskLevel: "critical" | "high" | "medium" | "low";
  gapDescription: string;
  violatedArticle: string;
  remediationSuggestion: string;
}

interface LLMComplianceAnalysis {
  features: FeatureAnalysis;
  obligations: ObligationHit[];
  gaps: GapFinding[];
  overallRiskLevel: "critical" | "high" | "medium" | "low" | "none";
  conclusionText: string;
  filingRequired: boolean;
  filingItems: { name: string; urgency: string; regulation: string }[];
  securityAssessmentRequired: boolean;
  crossBorderPath: "security_assessment" | "standard_contract" | "certification" | "exempt" | "none";
  unansweredQuestions: string[];
}

// ============================================================
// 构建分析 Prompt
// ============================================================

export function buildComplianceAnalysisMessages(
  productName: string,
  description: string,
  additionalContext?: {
    productType?: string;
    industry?: string;
    userScale?: string;
    deploymentRegion?: string;
    knownFeatures?: string[];
  },
  mode: "quick" | "full" = "full"
): ChatMessage[] {
  const contextParts: string[] = [];
  if (additionalContext?.productType)
    contextParts.push(`- 产品类型：${additionalContext.productType}`);
  if (additionalContext?.industry)
    contextParts.push(`- 行业领域：${additionalContext.industry}`);
  if (additionalContext?.userScale)
    contextParts.push(`- 用户规模：${additionalContext.userScale}`);
  if (additionalContext?.deploymentRegion)
    contextParts.push(`- 部署区域：${additionalContext.deploymentRegion}`);
  if (additionalContext?.knownFeatures?.length)
    contextParts.push(`- 已知功能：${additionalContext.knownFeatures.join("、")}`);

  const contextStr = contextParts.length > 0 ? `\n补充信息：\n${contextParts.join("\n")}` : "";

  // quick 模式用轻量 prompt（flash 低延迟+低 token），full 用完整 prompt（pro 深度推理）
  const systemPrompt = mode === "quick" ? buildRegulatoryContextQuick() : buildRegulatoryContextFull();

  const userPrompt = `请对以下AI产品进行合规分析：

产品名称：${productName}
产品描述：${description}${contextStr}

请分析并输出JSON（不要输出其他内容）：

{
  "features": {
    "hasGenerativeAI": true/false/"unknown",
    "aiTechPath": "llm_api|fine_tuned|rag|deep_synthesis|recommendation|none|unknown",
    "productForm": "app|miniprogram|web|api|platform|unknown",
    "targetUsers": "general|minors|enterprise|mixed|unknown",
    "collectsPersonalData": true/false/"unknown",
    "involvesSensitiveData": true/false/"unknown",
    "involvesCrossBorder": true/false/"unknown",
    "contentType": "text|image|video|audio|code|mixed|unknown",
    "deploymentRegion": "cn|cn_and_hk|overseas|cross_border|unknown"
  },
  "obligations": [{
    "regulationTitle": "法规名称",
    "regulationId": "法规ID",
    "articleNumber": "第X条",
    "articleTitle": "条款标题",
    "obligationType": "mandatory|prohibitive|conditional|procedural",
    "severity": "critical|high|medium|low",
    "reasoning": "判断依据（1-2句话说明为什么触发该条款）",
    "penalty": {"type": "罚款等", "description": "违规描述", "maxPenalty": "法定最高处罚"}
  }],
  "gaps": [{
    "dimension": "policy|industry|product|data",
    "riskLevel": "critical|high|medium|low",
    "gapDescription": "合规差距描述",
    "violatedArticle": "违规条款（法规名+条款号）",
    "remediationSuggestion": "整改建议"
  }],
  "overallRiskLevel": "critical|high|medium|low|none",
  "conclusionText": "2-3句话的综合结论",
  "filingRequired": true/false,
  "filingItems": [{"name": "备案项目名", "urgency": "immediate|before_launch|ongoing", "regulation": "依据法规"}],
  "securityAssessmentRequired": true/false,
  "crossBorderPath": "security_assessment|standard_contract|certification|exempt|none",
  "unansweredQuestions": ["需要补充了解的问题"]
}`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

/** 构建追问 Prompt */
export function buildFollowUpMessages(
  previousAnalysis: LLMComplianceAnalysis,
  userQuestion: string
): ChatMessage[] {
  return [
    {
      role: "system",
      content: `你是AI合规法律顾问。基于之前的分析结论（综合风险等级：${previousAnalysis.overallRiskLevel}），回答用户的追问。回答要精确引用法规条款，给出可操作的建议。`,
    },
    {
      role: "assistant",
      content: `我已完成对产品的合规分析，结论：${previousAnalysis.conclusionText}`,
    },
    { role: "user", content: userQuestion },
  ];
}

/** 构建法规检索 Prompt */
export function buildRegulationSearchMessages(query: string): ChatMessage[] {
  return [
    {
      role: "system",
      content: `你是中国数据合规和AI法律知识库。根据用户的问题，从你的法规知识中检索最相关的法规条款。输出JSON格式：{"results":[{"regulationTitle":"","articleNumber":"","content":"相关条文内容","relevance":"high|medium|low","explanation":"为什么相关"}]}`,
    },
    { role: "user", content: query },
  ];
}

export type { LLMComplianceAnalysis, FeatureAnalysis, ObligationHit, GapFinding };
