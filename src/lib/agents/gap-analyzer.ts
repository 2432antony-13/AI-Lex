/**
 * Agent 3 — 差距分析器 (Gap Analyzer)
 *
 * 功能：对比产品现状与法规要求，输出结构化差距报告
 *
 * 强制输出格式（每条发现）：
 *   【风险等级】：高
 *   【违反条款】：个保法第29条
 *   【原文依据】："处理敏感个人信息应当取得个人的单独同意"
 *   【整改建议】：门禁系统需增加单独授权弹窗
 *
 * 输入：Matcher 输出的活动-法规匹配结果
 * 输出：AgentGapReport（结构化差距报告）
 */

import type {
  GapAnalyzerInput,
  GapAnalyzerOutput,
  GapFinding,
  AgentGapReport,
  RiskSeverity,
  ComplianceStatus,
  ActivityRegulationMatch,
  MatchedRegulation,
} from "./types";
import { legalGraph } from "../knowledge-graph";

export function analyze(input: GapAnalyzerInput): GapAnalyzerOutput {
  const findings = generateFindings(input.matches, input.productFeatures, input.productDescription);
  const report = buildReport(input, findings);

  return { report };
}

// ============================================================
// 差距发现生成
// ============================================================

function generateFindings(
  matches: ActivityRegulationMatch[],
  productFeatures: string[],
  productDescription: string
): GapFinding[] {
  const findings: GapFinding[] = [];
  const descLower = productDescription.toLowerCase();
  const featuresLower = productFeatures.map((f) => f.toLowerCase());
  let findingId = 1;

  for (const match of matches) {
    for (const reg of match.regulations) {
      const article = reg.article;
      const ob = article.obligations[0];
      if (!ob) continue;

      // 判定合规状态：如果产品描述中声明的功能与此义务相符 → compliant
      // 如果产品描述暗示未满足 → non_compliant
      // 默认 → partial
      const status = determineComplianceStatus(ob.target, descLower, featuresLower);
      const riskLevel = mapSeverity(ob.severity);

      // 生成差距描述
      const gapDescription = generateGapDescription(article, match.activity.activityName, status);
      const remediationSuggestion = generateRemediation(article, match.activity.activityName);

      // 处罚风险
      let penaltyRisk: string | undefined;
      if (article.penalty) {
        penaltyRisk = `最高处罚：${article.penalty.statutoryPenalty}`;
      }

      findings.push({
        id: `GAP-${String(findingId).padStart(3, "0")}`,
        riskLevel,
        violatedArticle: `${reg.regulation.shortTitle || reg.regulation.title.split("》")[0]}》${article.articleNumber}`,
        articleOriginalText: article.content.slice(0, 200) + (article.content.length > 200 ? "…" : ""),
        gapDescription,
        remediationSuggestion,
        relatedActivity: match.activity.activityName,
        penaltyRisk,
        status,
      });

      findingId++;
    }
  }

  // 按风险等级排序：critical → high → medium → low
  const severityOrder: RiskSeverity[] = ["critical", "high", "medium", "low"];
  findings.sort((a, b) => severityOrder.indexOf(a.riskLevel) - severityOrder.indexOf(b.riskLevel));

  return findings;
}

// ============================================================
// 报告生成
// ============================================================

function buildReport(input: GapAnalyzerInput, findings: GapFinding[]): AgentGapReport {
  const criticalCount = findings.filter((f) => f.riskLevel === "critical").length;
  const highCount = findings.filter((f) => f.riskLevel === "high").length;
  const mediumCount = findings.filter((f) => f.riskLevel === "medium").length;
  const lowCount = findings.filter((f) => f.riskLevel === "low").length;

  // 综合风险等级
  let overallRiskLevel: RiskSeverity;
  let overallRiskScore: number;
  if (criticalCount >= 2) {
    overallRiskLevel = "critical";
    overallRiskScore = 80 + Math.min(20, criticalCount * 5);
  } else if (criticalCount === 1 || highCount >= 2) {
    overallRiskLevel = "high";
    overallRiskScore = 50 + Math.min(30, (criticalCount * 15 + highCount * 5));
  } else if (highCount === 1 || mediumCount >= 3) {
    overallRiskLevel = "medium";
    overallRiskScore = 25 + Math.min(25, (highCount * 8 + mediumCount * 2));
  } else {
    overallRiskLevel = "low";
    overallRiskScore = Math.min(25, (mediumCount * 3 + lowCount * 1));
  }

  // 结论文本
  const conclusionText = generateConclusion(overallRiskLevel, criticalCount, highCount);

  // 备案判断
  const filingList = buildFilingList(findings, input.productDescription);
  const filingRequired = filingList.length > 0;

  // 安全评估判断
  const { required: securityRequired, reason: securityReason } = determineSecurityAssessment(findings, input.productDescription);

  // 图谱溯源
  const allGraphInsights = input.matches.flatMap((m) => m.graphInsights);
  const keyPaths = extractKeyGraphPaths(allGraphInsights);

  return {
    productName: input.productDescription.slice(0, 30),
    analysisTime: new Date().toISOString(),

    overallRiskLevel,
    overallRiskScore,
    conclusionText,

    findings,

    summary: { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount },

    filingRequired,
    filingList,
    securityAssessmentRequired: securityRequired,
    securityAssessmentReason: securityReason,

    graphTrace: {
      totalNodes: legalGraph.getStats().nodeCount,
      totalEdges: legalGraph.getStats().edgeCount,
      traversalDepth: 2,
      keyPaths,
    },
  };
}

// ============================================================
// 辅助函数
// ============================================================

function mapSeverity(severity: string): RiskSeverity {
  switch (severity) {
    case "critical": return "critical";
    case "high": return "high";
    case "medium": return "medium";
    default: return "low";
  }
}

function determineComplianceStatus(
  obligationTarget: string,
  desc: string,
  features: string[]
): ComplianceStatus {
  const target = obligationTarget.toLowerCase();

  // 检测产品描述中是否包含了合规措施的暗示
  const complianceIndicators = [
    "已经", "已实现", "已完成", "配置了", "部署了",
    "隐私政策", "用户协议", "同意", "授权",
    "加密", "脱敏", "匿名化",
    "标识", "水印", "标注",
    "审核", "过滤", "拦截",
    "备案", "许可",
  ];

  const hasCompliance = complianceIndicators.some((ind) => desc.includes(ind) || features.some((f) => f.includes(ind)));
  const hasRiskFeature = desc.includes(target) || features.some((f) => f.includes(target));

  if (hasCompliance) return "partial";
  if (hasRiskFeature) return "non_compliant";
  return "not_applicable";
}

function generateGapDescription(article: { articleNumber: string; title?: string; obligations: { type: string; target: string; severity: string }[] }, activityName: string, status: ComplianceStatus): string {
  const ob = article.obligations[0];
  if (!ob) return `产品涉及「${activityName}」，需遵守${article.articleNumber}要求`;

  switch (ob.type) {
    case "mandatory":
      return `「${activityName}」活动涉及强制义务：${ob.target}。当前产品${status === "non_compliant" ? "未提供相应的合规措施" : "合规措施不完善"}，存在合规差距。`;
    case "prohibitive":
      return `「${activityName}」活动触及禁止性规定：${ob.target}。需确认产品是否逾越法律红线。`;
    case "conditional":
      return `「${activityName}」活动需满足前置条件：${ob.target}。需在开发中落实。`;
    case "procedural":
      return `「${activityName}」活动需履行程序性义务：${ob.target}。建议在产品计划中纳入。`;
    default:
      return `「${activityName}」活动需满足${ob.target}的要求。`;
  }
}

function generateRemediation(article: { articleNumber: string; title?: string; obligations: { target: string }[] }, activityName: string): string {
  const ob = article.obligations[0];
  if (!ob) return "建议咨询专业律师评估合规方案";

  const remediationMap: Record<string, string> = {
    "安全评估": `对「${activityName}」活动进行安全评估，并在产品中内置评估流程入口`,
    "算法备案": `在产品上线前完成算法备案，系统内预置备案材料准备清单`,
    "内容标识": `在「${activityName}」的输出内容中添加AI生成标识（显著+隐式双重标识）`,
    "提供隐私政策": `为产品生成并展示隐私政策，覆盖「${activityName}」涉及的数据处理`,
    "单独同意": `为「${activityName}」涉及的敏感信息处理增加弹窗获取用户单独同意`,
    "取得同意": `为「${activityName}」配置用户授权流程，记录同意时间与范围`,
    "数据分类分级": `对「${activityName}」涉及的数据进行分类分级标注，建立保护策略`,
    "数据安全管理制度": `制定数据安全管理制度文件，覆盖「${activityName}」的全流程`,
    "等级保护": `对产品进行网络安全等级保护定级备案`,
    "未成年人保护措施": `为「${activityName}」增加年龄验证机制和未成年人保护模式`,
    "数据本地化存储": `将「${activityName}」的数据存储迁移至境内服务器`,
    "辟谣机制": `为「${activityName}」建立内容举报与快速辟谣通道`,
  };

  return remediationMap[ob.target] || `针对「${activityName}」的${ob.target}要求，制定合规方案并落地实施`;
}

function generateConclusion(level: RiskSeverity, critical: number, high: number): string {
  switch (level) {
    case "critical":
      return `产品存在 ${critical} 项严重合规风险和 ${high} 项高风险，建议立即暂停开发并进行全面合规整改。涉及强制性义务的不合规可能导致停止运营、高额罚款等严重后果。`;
    case "high":
      return `产品存在 ${high} 项高风险事项，建议优先整改 P0 级别问题后再推进开发。可以通过调整部分高风险功能来降低整体风险等级。`;
    case "medium":
      return "产品合规状况总体可控，存在若干中等风险需在开发过程中逐步解决。建议设置合规里程碑并在上线前完成全部整改。";
    case "low":
      return "产品合规基础良好，仅有少量低风险建议项。可在正常开发节奏中纳入整改。";
  }
}

function buildFilingList(findings: GapFinding[], description: string): { name: string; regulation: string }[] {
  const list: { name: string; regulation: string }[] = [];
  const desc = description.toLowerCase();

  const hasAI = /生成式|AI|LLM|大模型|GPT/.test(desc);
  const hasRecommend = /推荐|个性化|算法/.test(desc);
  const hasDeepSynthesis = /深度合成|数字人|换脸|视频生成/.test(desc);
  const hasApp = /App|小程序/.test(desc);

  if (hasAI || hasRecommend) list.push({ name: "算法备案", regulation: "《生成式AI暂行办法》第4条 / 《算法推荐管理规定》第24条" });
  if (hasAI) list.push({ name: "生成式AI服务备案", regulation: "《生成式AI暂行办法》第4条" });
  if (hasDeepSynthesis) list.push({ name: "深度合成服务备案", regulation: "《深度合成管理规定》" });
  if (hasApp) list.push({ name: "ICP备案", regulation: "《互联网信息服务管理办法》" });

  return list;
}

function determineSecurityAssessment(findings: GapFinding[], description: string): { required: boolean; reason: string } {
  const desc = description.toLowerCase();
  const reasons: string[] = [];

  if (/敏感|人脸|身份证|银行卡|行踪/.test(desc)) {
    reasons.push("涉及敏感个人信息处理");
  }
  if (/跨境|海外|境外|境外传输/.test(desc)) {
    reasons.push("涉及数据跨境传输");
  }
  if (/未成年人|青少年|儿童/.test(desc)) {
    reasons.push("面向未成年人");
  }
  if (/生成式|AI|LLM|大模型/.test(desc)) {
    reasons.push("提供生成式AI服务");
  }

  if (reasons.length > 0) {
    return { required: true, reason: reasons.join("；") + "，依法需进行安全评估" };
  }
  return { required: false, reason: "当前产品特征暂不触发强制性安全评估要求" };
}

function extractKeyGraphPaths(
  graphInsights: { citedBy: { node: { label: string } }[]; superiorLaws: { pathDescription: string; nodes: { label: string }[] }[] }[]
): { description: string; nodes: string[] }[] {
  const paths: { description: string; nodes: string[] }[] = [];

  for (const insight of graphInsights) {
    for (const path of insight.superiorLaws.slice(0, 3)) {
      paths.push({
        description: path.pathDescription,
        nodes: path.nodes.map((n) => n.label),
      });
    }
  }

  return paths.slice(0, 5); // Top 5
}
