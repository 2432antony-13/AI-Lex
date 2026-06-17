/**
 * LLM 增强合规分析 API
 *
 * POST /api/compliance/llm-analyze
 *
 * 请求体：
 * {
 *   productName: string,
 *   description: string,
 *   mode?: "quick" | "full",  // quick: 轻量分析, full: Deep Thinking
 *   productType?: string,
 *   industry?: string,
 *   userScale?: string,
 *   deploymentRegion?: string,
 *   knownFeatures?: string[]
 * }
 *
 * 响应：LLMComplianceAnalysis
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { llmChat, llmChatWithThinking } from "@/lib/llm";
import {
  buildComplianceAnalysisMessages,
  buildFollowUpMessages,
} from "@/lib/llm-prompts";
import type { LLMComplianceAnalysis } from "@/lib/llm-prompts";

// ============================================================
// Zod Schema
// ============================================================

const llmAnalyzeRequestSchema = z.object({
  productName: z.string().min(1, "产品名称不能为空"),
  description: z.string().min(10, "产品描述至少10个字符"),
  mode: z.enum(["quick", "full"]).default("quick"),
  productType: z.string().optional(),
  industry: z.string().optional(),
  userScale: z.string().optional(),
  deploymentRegion: z.string().optional(),
  knownFeatures: z.array(z.string()).optional(),
});

// ============================================================
// POST Handler — 合规分析
// ============================================================

export async function POST(req: Request) {
  // ======== Feature Flag 检查 ========
  if (process.env.FEATURE_LLM === "false") {
    return NextResponse.json(
      {
        error: "LLM功能已关闭",
        message: "请将 FEATURE_LLM 设为 true 以启用 AI 分析。\n\nMac/Linux: FEATURE_LLM=true npm run dev\nWindows: set FEATURE_LLM=true && npm run dev",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const parsed = llmAnalyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "请求参数校验失败", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const useThinking = data.mode === "full";

    // 构建 prompt（quick 模式用轻量模板，降低 token 消耗）
    const messages = buildComplianceAnalysisMessages(
      data.productName,
      data.description,
      {
        productType: data.productType,
        industry: data.industry,
        userScale: data.userScale,
        deploymentRegion: data.deploymentRegion,
        knownFeatures: data.knownFeatures,
      },
      data.mode // 传入 mode 控制 prompt 策略
    );

    // quick 模式用 flash（快+便宜），full 模式用 pro + thinking（准+深度）
    const startTime = Date.now();
    const response = useThinking
      ? await llmChatWithThinking(messages, { maxTokens: 8192, model: "deepseek-v4-pro" })
      : await llmChat(messages, { maxTokens: 4096, model: "deepseek-v4-flash" });
    const latencyMs = Date.now() - startTime;

    // 解析 LLM 输出
    let analysis: LLMComplianceAnalysis;
    try {
      const jsonStr = response.content
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/i, "");
      analysis = JSON.parse(jsonStr) as LLMComplianceAnalysis;
    } catch {
      // JSON 解析失败，返回原始内容用于调试
      return NextResponse.json(
        {
          error: "LLM输出解析失败",
          rawContent: response.content.slice(0, 2000),
          usage: response.usage,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...analysis,
      meta: {
        model: response.model,
        latencyMs,
        thinking: useThinking,
        reasoning: response.reasoning?.slice(0, 1000),
        tokensUsed: response.usage.totalTokens,
      },
    });
  } catch (error) {
    console.error("LLM compliance analysis error:", error);
    const errMsg = (error as Error).message;
    const isKeyError = errMsg.includes("API Key") || errMsg.includes("DEEPSEEK");
    return NextResponse.json(
      {
        error: isKeyError ? "API Key 未配置" : "LLM分析失败",
        message: isKeyError
          ? "请在 .env.local 中设置 DEEPSEEK_API_KEY。生产模式下需在启动时注入：DEEPSEEK_API_KEY=xxx npm run dev"
          : errMsg.slice(0, 500),
      },
      { status: 500 }
    );
  }
}

// ============================================================
// GET Handler — 健康检查
// ============================================================

export async function GET() {
  // Feature Flag 对健康检查也生效
  if (process.env.FEATURE_LLM === "false") {
    return NextResponse.json(
      { status: "disabled", message: "LLM 功能已关闭，设置 FEATURE_LLM=true 以启用" },
      { status: 503 }
    );
  }

  try {
    const messages = buildComplianceAnalysisMessages("Lex 合规引擎", "测试连通性");
    const response = await llmChat(
      [{ role: "user", content: "回复 OK 即可" }],
      { maxTokens: 10, model: "deepseek-v4-flash" }
    );

    return NextResponse.json({
      status: "ok",
      model: response.model,
      latencyMs: 0,
      message: "DeepSeek V4 API 连通正常",
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
