/**
 * Agent 2 — 法规匹配器 (Matcher)
 *
 * 功能：对每条数据处理活动在法规库 + 知识图谱中检索匹配
 * 三级匹配：
 *   Level 1: 关键词精确匹配（触发词包含）
 *   Level 2: 概念匹配（知识图谱概念节点遍历）
 *   Level 3: 图谱增强（引用链 + 上位法链 + 两跳引用）
 *
 * 输入：Decomposer 输出的活动列表
 * 输出：每条活动的法规匹配结果 + 图谱洞察
 */

import { ALL_ARTICLES, REGULATORY_LIBRARY } from "../regulatory-library";
import { legalGraph, graphEnhancedSearch } from "../knowledge-graph";
import type { MatcherInput, MatcherOutput, ActivityRegulationMatch, MatchedRegulation } from "./types";

export function match(input: MatcherInput): MatcherOutput {
  const matches: ActivityRegulationMatch[] = [];
  const allMatchedArticleIds = new Set<string>();

  for (const activity of input.activities) {
    const regulations = matchForActivity(activity, input.productDescription);
    const matchedIds = regulations.map((r) => r.article.id);

    for (const id of matchedIds) {
      allMatchedArticleIds.add(id);
    }

    // 图谱增强检索
    const graphInsights = graphEnhancedSearch(matchedIds);

    matches.push({
      activity,
      regulations,
      graphInsights,
    });
  }

  const graphStats = legalGraph.getStats();

  return {
    matches,
    metadata: {
      totalMatchedArticles: allMatchedArticleIds.size,
      uniqueRegulations: new Set(
        matches.flatMap((m) => m.regulations).map((r) => r.regulation.id)
      ).size,
      graphStats: { nodeCount: graphStats.nodeCount, edgeCount: graphStats.edgeCount },
    },
  };
}

/**
 * 针对单条活动做法规匹配
 */
function matchForActivity(activity: { regulatoryKeywords: string[]; activityName: string }, productDescription: string): MatchedRegulation[] {
  const results: MatchedRegulation[] = [];
  const allText = [...activity.regulatoryKeywords, activity.activityName, productDescription].join(" ").toLowerCase();

  for (const article of ALL_ARTICLES) {
    let bestMatchMethod: MatchedRegulation["matchMethod"] = "keyword";
    let bestScore = 0;
    let bestTrigger = "";

    // Level 1: 关键词精确匹配
    for (const ob of article.obligations) {
      for (const tk of ob.triggerKeywords) {
        if (allText.includes(tk.toLowerCase())) {
          const score = tk.length * 2 + (ob.severity === "critical" ? 20 : ob.severity === "high" ? 10 : 5);
          if (score > bestScore) {
            bestScore = score;
            bestMatchMethod = "keyword";
            bestTrigger = tk;
          }
        }
      }
    }

    // Level 2: 概念匹配（通过 topic 属性）
    if (bestScore === 0) {
      const articleTopic = article.keywords?.join(" ").toLowerCase() || "";
      for (const kw of activity.regulatoryKeywords) {
        if (articleTopic.includes(kw.toLowerCase())) {
          bestScore = kw.length;
          bestMatchMethod = "concept";
          bestTrigger = kw;
          break;
        }
      }
    }

    if (bestScore > 0) {
      const regulation = REGULATORY_LIBRARY.find((r) => r.id === article.regulationId);
      if (regulation) {
        results.push({
          article,
          regulation,
          relevanceScore: bestScore,
          matchMethod: bestMatchMethod,
          triggeredBy: bestTrigger,
        });
      }
    }
  }

  // 去重 + 按分数排序
  const seen = new Set<string>();
  const deduped = results.filter((r) => {
    const key = r.article.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.sort((a, b) => b.relevanceScore - a.relevanceScore);
}
