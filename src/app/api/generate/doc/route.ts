import { NextResponse } from "next/server";
import { z } from "zod";
import { docTemplates } from "@/lib/doc-templates";

const requestSchema = z.object({
  productName: z.string().min(1),
  companyName: z.string().optional(),
  types: z.array(z.enum(["user_agreement", "privacy_policy", "ai_disclosure"])).min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { productName, companyName, types } = parsed.data;
    const date = new Date().toLocaleDateString("zh-CN");
    const docs: Record<string, { title: string; content: string }> = {};

    for (const type of types) {
      const tpl = docTemplates[type];
      docs[type] = {
        title: tpl.title,
        content: tpl.generate({ productName, companyName, date }),
      };
    }

    return NextResponse.json({ docs, productName, date });
  } catch (error) {
    console.error("Doc generation error:", error);
    return NextResponse.json({ error: "文档生成失败" }, { status: 500 });
  }
}
