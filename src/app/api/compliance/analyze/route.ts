/**
 * 合规分析 API
 *
 * POST /api/compliance/analyze
 * 
 * 请求体：
 * {
 *   mode: "quick_assessment" | "full_review" | "deep_analysis",
 *   productName: string,
 *   description: string,
 *   productType?: string,
 *   industry?: string,
 *   collectsPersonalData?: boolean,
 *   personalDataTypes?: string,
 *   involvesSensitiveData?: boolean,
 *   involvesCrossBorderData?: boolean,
 *   usesGenerativeAI?: boolean,
 *   aiModelProvider?: string,
 *   usesRecommendationAlgorithm?: boolean,
 *   involvesDeepSynthesis?: boolean,
 *   hasUserContent?: boolean,
 *   targetsMinors?: boolean,
 *   hasPaymentFeature?: boolean,
 *   deploymentRegion?: string,
 *   workspaceId?: string  // 可选：持久化到数据库
 * }
 *
 * 响应：
 * ComplianceReport（完整合规分析报告）
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateComplianceReport } from "@/lib/compliance-engine";
import { safePersist } from "@/lib/prisma";

// ============================================================
// Zod Schema
// ============================================================

const analyzeRequestSchema = z.object({
  mode: z.enum(["quick_assessment", "full_review", "deep_analysis"]).default("full_review"),
  workspaceId: z.string().optional(),

  // 基础信息
  productName: z.string().min(1, "产品名称不能为空"),
  description: z.string().min(5, "产品描述至少 5 个字符"),
  productType: z.string().optional(),
  industry: z.string().optional(),

  // 数据合规
  collectsPersonalData: z.boolean().optional(),
  personalDataTypes: z.string().optional(),
  involvesSensitiveData: z.boolean().optional(),
  involvesCrossBorderData: z.boolean().optional(),
  usesThirdPartySDK: z.boolean().optional(),

  // AI 合规
  usesGenerativeAI: z.boolean().optional(),
  aiModelProvider: z.string().optional(),
  usesRecommendationAlgorithm: z.boolean().optional(),
  involvesDeepSynthesis: z.boolean().optional(),

  // 产品交互
  hasUserContent: z.boolean().optional(),
  targetsMinors: z.boolean().optional(),
  hasPaymentFeature: z.boolean().optional(),

  // 运营
  deploymentRegion: z.string().optional(),
  teamStage: z.string().optional(),
});

// ============================================================
// POST Handler
// ============================================================

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = analyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "请求参数校验失败", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 运行合规分析引擎
    const report = generateComplianceReport({
      productName: data.productName,
      description: data.description,
      productType: data.productType,
      industry: data.industry,
      aiModelProvider: data.aiModelProvider,
      collectsPersonalData: data.collectsPersonalData,
      personalDataTypes: data.personalDataTypes,
      involvesSensitiveData: data.involvesSensitiveData,
      involvesCrossBorderData: data.involvesCrossBorderData,
      usesRecommendationAlgorithm: data.usesRecommendationAlgorithm,
      involvesDeepSynthesis: data.involvesDeepSynthesis,
      hasUserContent: data.hasUserContent,
      targetsMinors: data.targetsMinors,
      hasPaymentFeature: data.hasPaymentFeature,
      deploymentRegion: data.deploymentRegion,
    });

    // 可选持久化
    let sessionId: string | null = null;
    if (data.workspaceId) {
      const session = await safePersist(async (db) => {
        const s = await db.session.create({
          data: {
            workspaceId: data.workspaceId!,
            inputSnapshot: {
              mode: data.mode,
              productName: data.productName,
              description: data.description,
              productType: data.productType,
              industry: data.industry,
              collectsPersonalData: data.collectsPersonalData,
              involvesSensitiveData: data.involvesSensitiveData,
              involvesCrossBorderData: data.involvesCrossBorderData,
              usesGenerativeAI: data.usesGenerativeAI,
              involvesDeepSynthesis: data.involvesDeepSynthesis,
              targetsMinors: data.targetsMinors,
            },
            outputType: "review_report",
            outputData: report as unknown as object,
            triggeredRules: report.matches.map((m) => ({
              id: m.article.id,
              article: `${m.regulation.shortTitle || m.regulation.title} ${m.article.articleNumber}`,
            })),
          },
        });

        await db.operationLog.create({
          data: {
            userId: "demo-user",
            workspaceId: data.workspaceId!,
            sessionId: s.id,
            actionType: "review",
            ruleIds: report.matches.map((m) => m.article.id),
            legalRefs: report.matches.map(
              (m) => `${m.regulation.shortTitle || m.regulation.title} ${m.article.articleNumber}`
            ),
            metadata: {
              mode: data.mode,
              riskScore: report.riskScore,
              conclusion: report.conclusion,
            },
          },
        });

        return s;
      });
      sessionId = session?.id ?? null;
    }

    return NextResponse.json({
      sessionId,
      ...report,
    });
  } catch (error) {
    console.error("Compliance analysis error:", error);
    return NextResponse.json(
      { error: "合规分析失败", message: (error as Error).message },
      { status: 500 }
    );
  }
}
