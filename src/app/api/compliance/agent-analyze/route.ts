/**
 * Agent 工作流合规分析 API
 *
 * POST /api/compliance/agent-analyze
 *
 * 请求体：
 * {
 *   productName: string,
 *   productDescription: string,
 *   productType?: string,
 *   industry?: string,
 *   features?: string[],         // 产品功能列表
 *   workspaceId?: string          // 可选持久化
 * }
 *
 * Pipeline: Decomposer → Matcher → GapAnalyzer
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { runAgentPipeline, formatGapFinding } from "@/lib/agents/orchestrator";
import { safePersist } from "@/lib/prisma";
import type { DecomposerInput } from "@/lib/agents/types";

const requestSchema = z.object({
  productName: z.string().min(1, "产品名称不能为空"),
  productDescription: z.string().min(10, "产品描述至少 10 个字符"),
  productType: z.string().default("Web"),
  industry: z.string().default("ai_marketing"),
  features: z.array(z.string()).default([]),
  workspaceId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "请求参数校验失败", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const input: DecomposerInput = {
      productName: data.productName,
      productDescription: data.productDescription,
      productType: data.productType,
      industry: data.industry,
      features: data.features,
    };

    // 执行 Agent 管道
    const result = runAgentPipeline(input);

    // 格式化输出（可选：为每条 finding 生成格式化字符串）
    const formattedFindings = result.gapReport.findings.map(formatGapFinding);

    // 可选持久化
    let sessionId: string | null = null;
    if (data.workspaceId) {
      const session = await safePersist(async (db) => {
        const s = await db.session.create({
          data: {
            workspaceId: data.workspaceId!,
            inputSnapshot: {
              productName: data.productName,
              productDescription: data.productDescription,
              features: data.features,
            },
            outputType: "review_report",
            outputData: {
              findings: result.gapReport.findings,
              summary: result.gapReport.summary,
              conclusion: result.gapReport.conclusionText,
            } as unknown as object,
            triggeredRules: result.gapReport.findings.map((f) => ({
              id: f.id,
              article: f.violatedArticle,
            })),
          },
        });

        await db.operationLog.create({
          data: {
            userId: "demo-user",
            workspaceId: data.workspaceId!,
            sessionId: s.id,
            actionType: "review",
            ruleIds: result.gapReport.findings.map((f) => f.id),
            legalRefs: result.gapReport.findings.map((f) => f.violatedArticle),
            metadata: {
              pipeline: "Agent: Decomposer → Matcher → GapAnalyzer",
              totalDurationMs: result.pipelineMetadata.totalDurationMs,
            },
          },
        });

        return s;
      });
      sessionId = session?.id ?? null;
    }

    return NextResponse.json({
      sessionId,
      pipeline: result.pipelineMetadata,
      activities: result.decomposition.metadata,
      matchingSummary: result.matching.metadata,
      report: {
        overallRiskLevel: result.gapReport.overallRiskLevel,
        overallRiskScore: result.gapReport.overallRiskScore,
        conclusionText: result.gapReport.conclusionText,
        summary: result.gapReport.summary,
        filingRequired: result.gapReport.filingRequired,
        filingList: result.gapReport.filingList,
        securityAssessmentRequired: result.gapReport.securityAssessmentRequired,
        securityAssessmentReason: result.gapReport.securityAssessmentReason,
      },
      findings: result.gapReport.findings,
      formattedFindings,              // 强制格式字符串
      graphTrace: result.gapReport.graphTrace,
    });
  } catch (error) {
    console.error("Agent pipeline error:", error);
    return NextResponse.json(
      {
        error: "Agent 管道执行失败",
        message: (error as Error).message,
        agentChain: ["Decomposer", "Matcher", "GapAnalyzer"],
      },
      { status: 500 }
    );
  }
}
