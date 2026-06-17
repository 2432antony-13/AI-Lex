import { NextResponse } from "next/server";
import { z } from "zod";
import { generateMockFiling } from "@/lib/mock-filing";

const requestSchema = z.object({
  productName: z.string().min(1),
  description: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { productName, description } = parsed.data;
    const material = generateMockFiling(productName, description);

    return NextResponse.json({
      productName,
      ...material,
    });
  } catch (error) {
    console.error("Mock filing error:", error);
    return NextResponse.json({ error: "备案材料生成失败" }, { status: 500 });
  }
}
