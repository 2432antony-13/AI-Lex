/**
 * Agent 工作流类型定义
 *
 * Pipeline: Decomposer → Matcher → GapAnalyzer → Orchestrator
 */

import type { Regulatory, RegulatoryArticle } from "../regulatory-library";
import type { GraphQueryResult, GraphPath } from "../knowledge-graph";

// ============================================================
// 数据处理活动 (Agent 1 输出)
// ============================================================

export type DataLifecycle = "collection" | "storage" | "processing" | "transfer" | "disclosure" | "deletion";

export interface DataProcessingActivity {
  id: string;
  lifecycle: DataLifecycle;
  activityName: string;
  description: string;
  dataTypes: string[];          // 涉及的数据类型标签
  personalData: boolean;         // 是否涉及个人信息
  sensitiveData: boolean;        // 是否涉及敏感信息
  crossBorder: boolean;          // 是否涉及跨境
  aiInvolved: boolean;           // 是否涉及 AI 处理
  thirdPartyInvolved: boolean;   // 是否涉及第三方
  regulatoryKeywords: string[];  // 用于法规匹配的关键词
}

// ============================================================
// 法规匹配结果 (Agent 2 输出)
// ============================================================

export interface MatchedRegulation {
  article: RegulatoryArticle;
  regulation: Regulatory;
  relevanceScore: number;
  matchMethod: "keyword" | "concept" | "citation" | "superior_law";
  triggeredBy: string;           // 匹配原因
}

/** 每条活动匹配到的法规集合 */
export interface ActivityRegulationMatch {
  activity: DataProcessingActivity;
  regulations: MatchedRegulation[];
  graphInsights: {
    citedBy: GraphQueryResult[];
    superiorLaws: GraphPath[];
    relatedConcepts: GraphQueryResult[];
  };
}

// ============================================================
// 差距分析结果 (Agent 3 输出)
// ============================================================

export type RiskSeverity = "critical" | "high" | "medium" | "low";
export type ComplianceStatus = "non_compliant" | "partial" | "compliant" | "not_applicable";

export interface GapFinding {
  id: string;
  riskLevel: RiskSeverity;
  violatedArticle: string;          // 违反的法规条款，如 "个保法第29条"
  articleOriginalText: string;       // 原文依据，如 "处理敏感个人信息应当取得个人的单独同意"
  gapDescription: string;            // 差距描述
  remediationSuggestion: string;     // 整改建议
  relatedActivity: string;           // 关联的数据处理活动
  penaltyRisk?: string;              // 处罚风险
  status: ComplianceStatus;
}

export interface AgentGapReport {
  productName: string;
  analysisTime: string;

  // 总体结论
  overallRiskLevel: RiskSeverity;
  overallRiskScore: number;
  conclusionText: string;

  // 详细发现（强制格式）
  findings: GapFinding[];

  // 按风险等级汇总
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };

  // 备案与安全评估判断
  filingRequired: boolean;
  filingList: { name: string; regulation: string }[];
  securityAssessmentRequired: boolean;
  securityAssessmentReason: string;

  // 图谱溯源
  graphTrace: {
    totalNodes: number;
    totalEdges: number;
    traversalDepth: number;
    keyPaths: { description: string; nodes: string[] }[];
  };
}

// ============================================================
// Agent 接口
// ============================================================

export interface DecomposerInput {
  productName: string;
  productDescription: string;
  productType: string;
  industry: string;
  features: string[];             // 产品功能列表
}

export interface DecomposerOutput {
  activities: DataProcessingActivity[];
  metadata: {
    totalActivities: number;
    lifecycleDistribution: Record<DataLifecycle, number>;
    dataTypeSummary: string[];
  };
}

export interface MatcherInput {
  activities: DataProcessingActivity[];
  productDescription: string;
}

export interface MatcherOutput {
  matches: ActivityRegulationMatch[];
  metadata: {
    totalMatchedArticles: number;
    uniqueRegulations: number;
    graphStats: { nodeCount: number; edgeCount: number };
  };
}

export interface GapAnalyzerInput {
  matches: ActivityRegulationMatch[];
  productFeatures: string[];      // 产品声称具备/不具备的能力
  productDescription: string;
}

export interface GapAnalyzerOutput {
  report: AgentGapReport;
}

// ============================================================
// Pipeline 聚合类型
// ============================================================

export interface AgentPipelineResult {
  decomposition: DecomposerOutput;
  matching: MatcherOutput;
  gapReport: AgentGapReport;
  pipelineMetadata: {
    startedAt: string;
    completedAt: string;
    agentChain: string[];
    totalDurationMs: number;
  };
}
