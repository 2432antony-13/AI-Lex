/**
 * Agent 管道快速测试脚本
 * 运行: npx tsx src/lib/agents/__test__.ts
 */
import { runAgentPipeline } from "./orchestrator";
import { formatGapFinding } from "./orchestrator";

const result = runAgentPipeline({
  productName: "灵犀文案",
  productDescription: "基于大语言模型的电商文案智能生成平台，收集用户手机号和浏览行为数据，集成GPT-4生成营销文案",
  productType: "Web",
  industry: "ai_marketing",
  features: ["AI文案生成", "用户行为分析", "内容推荐", "订阅付费"],
});

console.log("=".repeat(60));
console.log("Agent Pipeline Test Results");
console.log("=".repeat(60));

console.log("\n--- Pipeline Metadata ---");
console.log(`Chain: ${result.pipelineMetadata.agentChain.join(" → ")}`);
console.log(`Duration: ${result.pipelineMetadata.totalDurationMs}ms`);

console.log("\n--- Decomposer Output ---");
console.log(`Activities: ${result.decomposition.metadata.totalActivities}`);
console.log(`Lifecycle: ${JSON.stringify(result.decomposition.metadata.lifecycleDistribution)}`);

console.log("\n--- Matcher Output ---");
console.log(`Matched Articles: ${result.matching.metadata.totalMatchedArticles}`);
console.log(`Unique Regulations: ${result.matching.metadata.uniqueRegulations}`);

console.log("\n--- Gap Report ---");
console.log(`Risk Level: ${result.gapReport.overallRiskLevel}`);
console.log(`Risk Score: ${result.gapReport.overallRiskScore}`);
console.log(`Findings: ${result.gapReport.findings.length} (critical: ${result.gapReport.summary.critical}, high: ${result.gapReport.summary.high}, medium: ${result.gapReport.summary.medium}, low: ${result.gapReport.summary.low})`);
console.log(`Filing Required: ${result.gapReport.filingRequired}`);
console.log(`Security Assessment: ${result.gapReport.securityAssessmentRequired}`);
console.log(`Conclusion: ${result.gapReport.conclusionText.slice(0, 120)}...`);

console.log("\n--- Graph Trace ---");
console.log(`Nodes: ${result.gapReport.graphTrace.totalNodes}, Edges: ${result.gapReport.graphTrace.totalEdges}`);
for (const path of result.gapReport.graphTrace.keyPaths) {
  console.log(`  ${path.description}`);
}

console.log("\n--- Sample Findings (Top 3) ---");
for (const f of result.gapReport.findings.slice(0, 3)) {
  console.log(`\n[${f.id}] Risk: ${f.riskLevel} | ${f.violatedArticle}`);
  console.log(`  Gap: ${f.gapDescription.slice(0, 100)}`);
  console.log(`  Fix: ${f.remediationSuggestion.slice(0, 100)}`);
}

console.log("\n--- Formatted Finding (Sample) ---");
if (result.gapReport.findings[0]) {
  console.log(formatGapFinding(result.gapReport.findings[0]));
}
