/**
 * Agent 工作流编排器 (Orchestrator)
 *
 * Pipeline: Decomposer → Matcher → GapAnalyzer
 * 责任链模式：每个 Agent 的输出是下一个 Agent 的输入
 */

import { decompose } from "./decomposer";
import { match } from "./matcher";
import { analyze } from "./gap-analyzer";
import type {
  DecomposerInput,
  AgentPipelineResult,
  AgentGapReport,
} from "./types";

/**
 * 完整 Agent 管道
 *
 * @example
 * const result = runAgentPipeline({
 *   productName: "灵犀文案",
 *   productDescription: "基于GPT的电商文案生成工具，收集用户手机号和浏览行为...",
 *   productType: "Web",
 *   industry: "ai_marketing",
 *   features: ["AI文案生成", "用户行为分析", "内容推荐"],
 * });
 *
 * // result.gapReport.findings[] → 每项都是强制格式
 * // "【风险等级】：高 | 【违反条款】：个保法第28条 | ..."
 */
export function runAgentPipeline(input: DecomposerInput): AgentPipelineResult {
  const startedAt = new Date().toISOString();

  // Agent 1: 需求拆解
  const decomposition = decompose({
    productName: input.productName,
    productDescription: input.productDescription,
    productType: input.productType,
    industry: input.industry,
    features: input.features,
  });

  // Agent 2: 法规匹配（含图谱增强）
  const matching = match({
    activities: decomposition.activities,
    productDescription: input.productDescription,
  });

  // Agent 3: 差距分析
  const { report: gapReport } = analyze({
    matches: matching.matches,
    productFeatures: input.features,
    productDescription: input.productDescription,
  });

  const completedAt = new Date().toISOString();
  const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();

  return {
    decomposition,
    matching,
    gapReport,
    pipelineMetadata: {
      startedAt,
      completedAt,
      agentChain: ["Decomposer", "Matcher", "GapAnalyzer"],
      totalDurationMs: duration,
    },
  };
}

/**
 * 将单条 GapFinding 格式化为指定字符串格式
 */
export function formatGapFinding(finding: AgentGapReport["findings"][number]): string {
  const parts = [
    `【风险等级】：${mapRiskLabel(finding.riskLevel)}`,
    `【违反条款】：${finding.violatedArticle}`,
    `【原文依据】："${finding.articleOriginalText}"`,
    `【差距描述】：${finding.gapDescription}`,
    `【整改建议】：${finding.remediationSuggestion}`,
  ];

  if (finding.penaltyRisk) {
    parts.push(`【处罚风险】：${finding.penaltyRisk}`);
  }

  parts.push(`【关联活动】：${finding.relatedActivity}`);

  return parts.join(" \n");
}

function mapRiskLabel(level: string): string {
  switch (level) {
    case "critical": return "严重 🔴";
    case "high": return "高 🟠";
    case "medium": return "中 🟡";
    case "low": return "低 🟢";
    default: return "未知";
  }
}
