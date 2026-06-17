/**
 * 法规检索 API
 * GET  /api/regulatory/search?q=关键词&category=ai&severity=high
 * GET  /api/regulatory/search?id=reg-gen-ai-2023  (获取单部法规全文)
 * GET  /api/regulatory/search?articleId=gen-ai-art-4  (获取单条条款)
 * GET  /api/regulatory/search?list=true  (列出所有法规)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  REGULATORY_LIBRARY,
  getRegulationById,
  getArticleById,
  fullTextSearch,
  searchArticlesByKeyword,
  getArticlesBySeverity,
} from "@/lib/regulatory-library";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const q = url.searchParams.get("q");
    const category = url.searchParams.get("category");
    const severity = url.searchParams.get("severity");
    const id = url.searchParams.get("id");
    const articleId = url.searchParams.get("articleId");
    const list = url.searchParams.get("list");

    // 列出所有法规（摘要）
    if (list === "true") {
      const regulations = REGULATORY_LIBRARY.map((r) => ({
        id: r.id,
        title: r.title,
        shortTitle: r.shortTitle,
        issuingBody: r.issuingBody,
        lawType: r.lawType,
        legalLevel: r.legalLevel,
        effectiveDate: r.effectiveDate,
        status: r.status,
        category: r.category,
        keywords: r.keywords,
        summary: r.summary,
        articleCount: r.articles.length,
      }));
      return NextResponse.json({ total: regulations.length, regulations });
    }

    // 获取单条条款
    if (articleId) {
      const article = getArticleById(articleId);
      if (!article) {
        return NextResponse.json({ error: "条款不存在" }, { status: 404 });
      }
      const regulation = getRegulationById(article.regulationId);
      return NextResponse.json({ article, regulationTitle: regulation?.title });
    }

    // 获取单部法规全文
    if (id) {
      const regulation = getRegulationById(id);
      if (!regulation) {
        return NextResponse.json({ error: "法规不存在" }, { status: 404 });
      }
      return NextResponse.json({ regulation });
    }

    // 按类别筛选
    if (category) {
      const regulations = REGULATORY_LIBRARY.filter((r) => r.category === category);
      return NextResponse.json({
        total: regulations.length,
        regulations: regulations.map((r) => ({
          id: r.id,
          title: r.title,
          shortTitle: r.shortTitle,
          summary: r.summary,
          articleCount: r.articles.length,
        })),
      });
    }

    // 按严重等级筛选条款
    if (severity) {
      if (!["critical", "high", "medium", "low"].includes(severity)) {
        return NextResponse.json({ error: "无效的严重等级，可选值：critical, high, medium, low" }, { status: 400 });
      }
      const articles = getArticlesBySeverity(severity as "critical" | "high" | "medium" | "low");
      return NextResponse.json({
        total: articles.length,
        articles: articles.map((a) => ({
          id: a.id,
          articleNumber: a.articleNumber,
          title: a.title,
          content: a.content.substring(0, 200) + "...",
        })),
      });
    }

    // 关键词检索
    if (q) {
      const results = fullTextSearch(q);
      return NextResponse.json({
        query: q,
        total: results.length,
        results: results.map((r) => ({
          regulationId: r.regulation.id,
          regulationTitle: r.regulation.shortTitle || r.regulation.title,
          articleId: r.article.id,
          articleNumber: r.article.articleNumber,
          articleTitle: r.article.title,
          content: r.article.content,
          relevanceScore: r.relevanceScore,
          obligations: r.article.obligations,
        })),
      });
    }

    // 无参数：返回使用说明
    return NextResponse.json({
      usage: {
        endpoints: {
          "GET /api/regulatory/search?q=关键词": "关键词检索法律法规条款",
          "GET /api/regulatory/search?list=true": "列出所有法规摘要",
          "GET /api/regulatory/search?id=reg-gen-ai-2023": "获取单部法规全文",
          "GET /api/regulatory/search?articleId=gen-ai-art-4": "获取单条条款详情",
          "GET /api/regulatory/search?category=ai": "按领域筛选法规",
          "GET /api/regulatory/search?severity=critical": "按严重等级筛选条款",
        },
        totalRegulations: REGULATORY_LIBRARY.length,
        categories: [...new Set(REGULATORY_LIBRARY.map((r) => r.category))],
      },
    });
  } catch (error) {
    console.error("Regulatory search error:", error);
    return NextResponse.json({ error: "法规检索失败" }, { status: 500 });
  }
}
