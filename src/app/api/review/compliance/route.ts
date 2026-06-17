import { NextResponse } from "next/server";
import { z } from "zod";
import { rules } from "@/lib/rules";

const reviewSchema = z.object({
  productName: z.string().min(1),
  productType: z.string(),
  industry: z.string(),
  description: z.string().min(1),

  // 数据合规
  collectsPersonalData: z.boolean(),
  personalDataTypes: z.string().optional(),
  involvesSensitiveData: z.boolean(),
  involvesCrossBorderData: z.boolean(),
  usesThirdPartySDK: z.boolean(),

  // AI 合规
  usesGenerativeAI: z.boolean(),
  aiModelProvider: z.string().optional(),
  usesRecommendationAlgorithm: z.boolean(),
  involvesDeepSynthesis: z.boolean(),

  // 产品交互
  hasUserContent: z.boolean(),
  targetsMinors: z.boolean(),
  hasPaymentFeature: z.boolean(),

  // 技术 & 运营
  deploymentRegion: z.string(),
  teamStage: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // 构建分析文本
    const analysisText = [
      data.description,
      data.collectsPersonalData ? "收集个人信息" : "",
      data.personalDataTypes || "",
      data.involvesSensitiveData ? "敏感个人信息" : "",
      data.involvesCrossBorderData ? "跨境数据" : "",
      data.usesGenerativeAI ? "生成式AI" : "",
      data.aiModelProvider || "",
      data.usesRecommendationAlgorithm ? "推荐算法" : "",
      data.involvesDeepSynthesis ? "深度合成" : "",
      data.hasUserContent ? "UGC" : "",
      data.targetsMinors ? "未成年人" : "",
      data.hasPaymentFeature ? "支付" : "",
    ].join(" ");

    // 规则匹配
    const triggered = rules.filter(
      (rule) =>
        rule.demoEnabled &&
        rule.triggerConditions.some((cond) =>
          analysisText.toLowerCase().includes(cond.toLowerCase())
        )
    );

    // 分类风险条目
    const dataRisks: { title: string; level: string; action: string; article: string }[] = [];
    const aiRisks: { title: string; level: string; action: string; article: string }[] = [];
    const productRisks: { title: string; level: string; action: string; article: string }[] = [];
    const policyRisks: { title: string; level: string; action: string; article: string }[] = [];

    for (const rule of triggered) {
      const item = {
        title: rule.title,
        level: rule.riskLevel,
        action: rule.actionRequired,
        article: `${rule.source} ${rule.article}`,
      };
      switch (rule.riskCategory) {
        case "data":
          dataRisks.push(item);
          break;
        case "policy":
          policyRisks.push(item);
          break;
        case "product":
          productRisks.push(item);
          break;
        case "industry":
          dataRisks.push(item); // 行业风险合并到数据
          break;
      }
    }

    // 评审结论
    const highRiskCount = triggered.filter((r) => r.riskLevel === "high").length;
    let conclusion: "approved" | "conditional" | "blocked";
    let conclusionText: string;

    if (highRiskCount >= 2) {
      conclusion = "blocked";
      conclusionText = `存在 ${highRiskCount} 项高风险项，建议整改后再进入开发`;
    } else if (highRiskCount === 1 || triggered.filter((r) => r.riskLevel === "medium").length >= 3) {
      conclusion = "conditional";
      conclusionText = "有条件放行：部分风险项需在开发中同步整改";
    } else {
      conclusion = "approved";
      conclusionText = "合规风险可控，可以进入开发";
    }

    // 备案判断
    const filingRequired: string[] = [];
    if (data.usesGenerativeAI) filingRequired.push("算法备案");
    if (data.usesGenerativeAI) filingRequired.push("生成式AI服务备案");
    if (data.involvesDeepSynthesis) filingRequired.push("深度合成服务备案");
    if (["App", "小程序"].some((t) => data.productType?.includes(t))) filingRequired.push("ICP备案");

    // 整改建议
    const remediation = triggered
      .filter((r) => r.riskLevel === "high" || r.riskLevel === "medium")
      .slice(0, 6)
      .map((r) => ({
        priority: r.riskLevel === "high" ? "P0" : "P1",
        action: r.actionRequired,
        reference: `${r.source} ${r.article}`,
      }));

    return NextResponse.json({
      conclusion,
      conclusionText,
      summary: {
        total: triggered.length,
        high: triggered.filter((r) => r.riskLevel === "high").length,
        medium: triggered.filter((r) => r.riskLevel === "medium").length,
        low: triggered.filter((r) => r.riskLevel === "low").length,
      },
      categories: {
        data: { risks: dataRisks, level: dataRisks.some((r) => r.level === "high") ? "high" : dataRisks.length > 0 ? "medium" : "low" },
        ai: { risks: aiRisks.length > 0 ? aiRisks : policyRisks, level: policyRisks.some((r) => r.level === "high") ? "high" : policyRisks.length > 0 ? "medium" : "low" },
        product: { risks: productRisks, level: productRisks.some((r) => r.level === "high") ? "high" : productRisks.length > 0 ? "medium" : "low" },
      },
      filingRequired: [...new Set(filingRequired)],
      remediation,
    });
  } catch (error) {
    console.error("Review error:", error);
    return NextResponse.json({ error: "评审失败" }, { status: 500 });
  }
}
