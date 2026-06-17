import { NextResponse } from "next/server";
import { z } from "zod";
import { safePersist } from "@/lib/prisma";
import { rules } from "@/lib/rules";

const requestSchema = z.object({
  workspaceId: z.string().optional(),
  mode: z.enum(["followup", "report"]).default("report"),
  productName: z.string().min(1),
  description: z.string().min(1),
  answers: z.array(
    z.object({
      questionId: z.number(),
      question: z.string(),
      answer: z.string(),
    })
  ),
});

// ---- 追问规则引擎 ----
function generateFollowUps(answers: { question: string; answer: string }[], description: string) {
  const allText = answers.map((a) => a.answer).join(" ") + " " + description;
  const followUps: { id: number; question: string; hint: string; type: string; options?: string[] }[] = [];

  const hasGenAI = /生成式|AI|LLM|GPT|大模型|大语言/.test(allText);
  const hasPersonalData = /个人信息|手机号|邮箱|位置/.test(allText);
  const hasRecommend = /推荐|个性化|推送/.test(allText);
  const hasUGC = /UGC|用户.*生成|社区|评论|投稿/.test(allText);
  const hasPayment = /支付|金融|交易|订阅/.test(allText);
  const hasCrossBorder = /跨境|境外|海外|国外/.test(allText);
  const hasDeepSynthesis = /深度合成|换脸|语音合成|数字人|视频生成/.test(allText);
  const hasMinors = /未成年|青少年|儿童|学生/.test(allText);

  if (hasGenAI) {
    followUps.push({
      id: 101,
      question: "是否对大语言模型进行过微调（Fine-tuning）或使用 RAG 技术？",
      hint: "微调和 RAG 涉及训练数据合规和知识产权风险",
      type: "boolean",
    });
  }

  if (hasPersonalData) {
    followUps.push({
      id: 102,
      question: "收集的个人信息中是否包含敏感证件号（身份证、护照、社保号等）？",
      hint: "敏感个人信息需获取单独同意并做影响评估",
      type: "boolean",
    });
  }

  if (hasRecommend) {
    followUps.push({
      id: 103,
      question: "推荐算法是否对用户进行画像分析（用户标签、行为预测）？",
      hint: "用户画像涉及自动化决策透明度和用户知情权",
      type: "boolean",
    });
  }

  if (hasUGC) {
    followUps.push({
      id: 104,
      question: "UGC 内容是否有实时审核机制（机审+人审）？",
      hint: "UGC 平台需有内容安全审核能力",
      type: "boolean",
    });
  }

  if (hasCrossBorder) {
    followUps.push({
      id: 105,
      question: "跨境传输的个人数据量级和频率如何？",
      hint: "大量频繁的数据出境可能需要安全评估",
      type: "select",
      options: ["少量偶发（<100人/月）", "中等规模（100-10000人/月）", "大规模（>10000人/月）"],
    });
  }

  if (hasDeepSynthesis) {
    followUps.push({
      id: 106,
      question: "深度合成内容是否部署了显式标识（水印、标签）和隐式标识（数字签名）？",
      hint: "双重标识是深度合成服务的法定义务",
      type: "boolean",
    });
  }

  if (hasPayment) {
    followUps.push({
      id: 107,
      question: "支付功能是否接入持牌第三方支付机构？",
      hint: "无牌经营支付业务存在法律风险",
      type: "boolean",
    });
  }

  if (hasMinors) {
    followUps.push({
      id: 108,
      question: "是否已建立未成年人身份验证和监护人同意机制？",
      hint: "根据未成年人保护法第75条要求",
      type: "boolean",
    });
  }

  // Limit to 3
  return followUps.slice(0, 3);
}

function runRiskAnalysis(productName: string, description: string, answers: { question: string; answer: string }[]) {
  const allText = answers.map((a) => a.answer).join(" ") + " " + description;

  const triggered = rules.filter((rule) =>
    rule.demoEnabled &&
    rule.triggerConditions.some((cond) => allText.toLowerCase().includes(cond.toLowerCase()))
  );

  const dimensions: Record<string, { level: string; items: typeof triggered; count: number }> = {
    policy: { level: "low", items: [], count: 0 },
    industry: { level: "low", items: [], count: 0 },
    product: { level: "low", items: [], count: 0 },
    data: { level: "low", items: [], count: 0 },
  };

  for (const rule of triggered) {
    const cat = rule.riskCategory as keyof typeof dimensions;
    if (dimensions[cat]) {
      dimensions[cat].items.push(rule);
      dimensions[cat].count++;
      const levels = ["low", "medium", "high", "prohibited"];
      const currIdx = levels.indexOf(dimensions[cat].level);
      const newIdx = levels.indexOf(rule.riskLevel);
      if (newIdx > currIdx) dimensions[cat].level = rule.riskLevel;
    }
  }

  const riskLevels = ["low", "medium", "high", "prohibited"];
  let overallLevel = "low";
  for (const dim of Object.values(dimensions)) {
    if (riskLevels.indexOf(dim.level) > riskLevels.indexOf(overallLevel)) overallLevel = dim.level;
  }

  const summary = triggered.slice(0, 5).map((r) => r.title);

  const materialsRequired: string[] = [];
  if (answers.some((a) => /个人信息|手机号/.test(a.answer))) {
    materialsRequired.push("用户协议", "隐私政策");
  }
  if (answers.some((a) => /生成|AI/.test(a.answer))) {
    materialsRequired.push("AI服务特别说明");
  }

  const filingRequired: string[] = [];
  const hasAI = /AI|生成|LLM|大模型/.test(allText);
  if (hasAI) filingRequired.push("算法备案", "生成式AI服务备案");
  if (/深度合成|视频生成/.test(allText)) filingRequired.push("深度合成备案");
  if (/App|小程序/.test(allText)) filingRequired.push("ICP备案");

  return {
    riskLevel: overallLevel,
    summary,
    dimensions: {
      policy: { level: dimensions.policy.level, detail: dimensions.policy.items.slice(0, 3).map((r) => r.title) },
      industry: { level: dimensions.industry.level, detail: dimensions.industry.items.slice(0, 3).map((r) => r.title) },
      product: { level: dimensions.product.level, detail: dimensions.product.items.slice(0, 3).map((r) => r.title) },
      data: { level: dimensions.data.level, detail: dimensions.data.items.slice(0, 3).map((r) => r.title) },
    },
    triggeredRules: triggered.map((r) => ({
      id: r.id, article: `${r.source} ${r.article}`, title: r.title, riskLevel: r.riskLevel, action: r.actionRequired,
    })),
    materialsRequired: [...new Set(materialsRequired)],
    filingRequired: [...new Set(filingRequired)],
  };
}

// ---- API Handler ----
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { workspaceId, mode, productName, description, answers } = parsed.data;

    // ---- Follow-up Mode ----
    if (mode === "followup") {
      const followUps = generateFollowUps(answers, description);
      return NextResponse.json({ followUps });
    }

    // ---- Report Mode ----
    const result = runRiskAnalysis(productName, description, answers);

    let session = null;
    if (workspaceId) {
      session = await safePersist(async (db) => {
        const s = await db.session.create({
          data: { workspaceId, inputSnapshot: { productName, description, answers },
            outputType: "risk_brief", outputData: result as unknown as object,
            triggeredRules: result.triggeredRules.map((r: any) => ({ id: r.id, article: r.article })),
          },
        });
        await db.operationLog.create({
          data: { userId: "demo-user", workspaceId, sessionId: s.id, actionType: "assess",
            ruleIds: result.triggeredRules.map((r: any) => r.id),
            legalRefs: result.triggeredRules.map((r: any) => r.article),
          },
        });
        return s;
      });
    }

    return NextResponse.json({ sessionId: session?.id ?? null, ...result });
  } catch (error) {
    console.error("Risk assessment error:", error);
    return NextResponse.json({ error: "评估失败" }, { status: 500 });
  }
}
