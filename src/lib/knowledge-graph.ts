/**
 * 法规知识图谱引擎
 *
 * 解决向量库/关系型数据库无法建模的法规关系：
 *   CITES        — 引用关系：A法第X条 → B法第Y条
 *   SUPERIOR_TO  — 上下位法：法律 → 行政法规 → 部门规章
 *   REPLACES     — 新旧替代：旧法 → 新法
 *   IMPLEMENTS   — 实施细则：上位法 → 实施细则/司法解释
 *   CONFLICTS    — 规范冲突：A法规制 vs B法豁免
 *   RELATES_TO   — 主题关联：共同涉及"个人信息"的条款
 *
 * 设计原则：
 *   Demo 阶段：内存邻接表（零依赖，兼容浏览器/Node.js）
 *   V1 阶段：Neo4j / LightRAG，Schema 完全兼容，一行切换
 *
 * 图结构：
 *   节点类型：Regulation（法规）| Article（条款）| Concept（法律概念）
 *   边类型：6 种关系
 */

// ============================================================
// TYPES — 兼容 Neo4j 属性图模型
// ============================================================

export type GraphNodeType = "Regulation" | "Article" | "Concept";
export type GraphEdgeType = "CITES" | "SUPERIOR_TO" | "REPLACES" | "IMPLEMENTS" | "CONFLICTS" | "RELATES_TO";

export interface GraphNode {
  id: string;                    // 全局唯一 ID，如 "reg-pipl-2021"
  type: GraphNodeType;
  label: string;                 // 显示名，如 "个人信息保护法"
  properties: Record<string, unknown>;  // 附加属性
}

export interface GraphEdge {
  id: string;                    // 边 ID，如 "edge-pipl38-csl37"
  type: GraphEdgeType;
  source: string;                // 起始节点 ID
  target: string;                // 目标节点 ID
  properties: Record<string, unknown>;  // 附加属性，如 { articleSource: "第38条", articleTarget: "第37条" }
}

/**
 * 图遍历结果
 */
export interface GraphPath {
  nodes: GraphNode[];
  edges: GraphEdge[];
  pathDescription: string;       // 自然语言描述路径
}

export interface GraphQueryResult {
  node: GraphNode;
  relationships: {
    edge: GraphEdge;
    neighbor: GraphNode;
  }[];
}

// ============================================================
// IN-MEMORY GRAPH ENGINE
// ============================================================

class LegalKnowledgeGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  // 邻接表：source → [{edge, target}]
  private adjacencyList: Map<string, { edge: GraphEdge; targetId: string }[]> = new Map();
  // 逆邻接表：target → [{edge, source}]
  private reverseAdjacency: Map<string, { edge: GraphEdge; sourceId: string }[]> = new Map();

  // ---- 基础操作 ----

  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) this.adjacencyList.set(node.id, []);
    if (!this.reverseAdjacency.has(node.id)) this.reverseAdjacency.set(node.id, []);
  }

  addEdge(edge: GraphEdge): void {
    if (!this.nodes.has(edge.source) || !this.nodes.has(edge.target)) {
      throw new Error(`Edge ${edge.id}: source or target node not found`);
    }
    this.edges.set(edge.id, edge);

    // 正向
    const adj = this.adjacencyList.get(edge.source)!;
    adj.push({ edge, targetId: edge.target });

    // 反向
    const rev = this.reverseAdjacency.get(edge.target)!;
    rev.push({ edge, sourceId: edge.source });
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: string): GraphEdge | undefined {
    return this.edges.get(id);
  }

  // ---- 图遍历 ----

  /**
   * 查询节点的所有直接关联（出边 + 入边）
   */
  getNeighbors(nodeId: string): GraphQueryResult | null {
    const node = this.nodes.get(nodeId);
    if (!node) return null;

    const relationships: GraphQueryResult["relationships"] = [];

    // 出边
    for (const { edge, targetId } of this.adjacencyList.get(nodeId) || []) {
      const neighbor = this.nodes.get(targetId);
      if (neighbor) {
        relationships.push({ edge, neighbor });
      }
    }

    // 入边
    for (const { edge, sourceId } of this.reverseAdjacency.get(nodeId) || []) {
      const neighbor = this.nodes.get(sourceId);
      if (neighbor) {
        relationships.push({ edge, neighbor });
      }
    }

    return { node, relationships };
  }

  /**
   * 向上追溯上位法链
   * 例：深度合成管理规定 → 生成式AI暂行办法 → （无上位法）
   */
  getSuperiorChain(articleId: string): GraphPath[] {
    const paths: GraphPath[] = [];
    const visited = new Set<string>();

    const dfs = (
      currentId: string,
      currentPath: { nodes: GraphNode[]; edges: GraphEdge[] }
    ) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      const node = this.nodes.get(currentId);
      if (!node) return;

      // 找上位法（出边 SUPERIOR_TO）
      const adj = this.adjacencyList.get(currentId) || [];
      const superiors = adj.filter((a) => a.edge.type === "SUPERIOR_TO");

      if (superiors.length === 0) {
        // 到达顶端，保存路径
        paths.push({
          nodes: [...currentPath.nodes, node],
          edges: [...currentPath.edges],
          pathDescription: currentPath.nodes
            .map((n, i) => {
              const next = currentPath.nodes[i + 1];
              return next
                ? `${n.label} ←（上位法）← ${next.label}`
                : n.label;
            })
            .reverse()
            .join(" → "),
        });
        return;
      }

      for (const sup of superiors) {
        dfs(sup.targetId, {
          nodes: [...currentPath.nodes, node],
          edges: [...currentPath.edges, sup.edge],
        });
      }
    };

    dfs(articleId, { nodes: [], edges: [] });
    return paths;
  }

  /**
   * 查找所有引用特定条款的其他条款（反向引用）
   * 实用性：某条款被废止后，找哪些条款引用了它
   */
  getCitingArticles(articleId: string): GraphQueryResult[] {
    const results: GraphQueryResult[] = [];

    // 找所有 CITES 类型的反向边
    for (const { edge, sourceId } of this.reverseAdjacency.get(articleId) || []) {
      if (edge.type === "CITES") {
        const node = this.nodes.get(sourceId);
        const target = this.nodes.get(articleId);
        if (node && target) {
          results.push({
            node,
            relationships: [{ edge, neighbor: target }],
          });
        }
      }
    }

    return results;
  }

  /**
   * 查找新旧替代关系
   */
  getReplacementChain(regulationId: string): GraphPath[] {
    const result: GraphPath[] = [];
    const visited = new Set<string>();

    // 向前追溯（被谁替代）
    const back = this.reverseAdjacency.get(regulationId) || [];
    for (const { edge } of back) {
      if (edge.type === "REPLACES") {
        const oldNode = this.nodes.get(edge.source);
        if (oldNode && !visited.has(edge.source)) {
          visited.add(edge.source);
          result.push({
            nodes: [oldNode],
            edges: [edge],
            pathDescription: `${oldNode.label} → 已被 ${this.nodes.get(regulationId)?.label || "新法"} 替代`,
          });
        }
      }
    }

    // 向后追溯（替代了谁）
    const fwd = this.adjacencyList.get(regulationId) || [];
    for (const { edge } of fwd) {
      if (edge.type === "REPLACES") {
        const newNode = this.nodes.get(edge.target);
        if (newNode && !visited.has(edge.target)) {
          visited.add(edge.target);
          result.push({
            nodes: [newNode],
            edges: [edge],
            pathDescription: `${this.nodes.get(regulationId)?.label || "旧法"} → 已被 ${newNode.label} 替代`,
          });
        }
      }
    }

    return result;
  }

  /**
   * 查找与特定概念相关的所有条款
   * 多跳遍历：Concept 节点 → RELATES_TO 边 → Article 节点
   */
  getArticlesByConcept(conceptNodeId: string): GraphQueryResult[] {
    const results: GraphQueryResult[] = [];

    for (const { edge, targetId } of this.adjacencyList.get(conceptNodeId) || []) {
      if (edge.type === "RELATES_TO") {
        const target = this.nodes.get(targetId);
        if (target) {
          results.push({
            node: target,
            relationships: [{ edge, neighbor: target }],
          });
        }
      }
    }

    for (const { edge, sourceId } of this.reverseAdjacency.get(conceptNodeId) || []) {
      if (edge.type === "RELATES_TO") {
        const source = this.nodes.get(sourceId);
        if (source) {
          results.push({
            node: source,
            relationships: [{ edge, neighbor: source }],
          });
        }
      }
    }

    return results;
  }

  /**
   * 两跳检索：从法规 A 的第 X 条出发，找其引用的法规 B 的第 Y 条
   */
  getTwoHopReferences(articleId: string): GraphPath[] {
    const paths: GraphPath[] = [];
    const startNode = this.nodes.get(articleId);
    if (!startNode) return paths;

    // 第一跳：找到该条款引用的其他条款
    for (const { edge, targetId } of this.adjacencyList.get(articleId) || []) {
      if (edge.type === "CITES") {
        const midNode = this.nodes.get(targetId);
        if (!midNode) continue;

        // 第二跳：找到被引用条款的引用
        for (const { edge: edge2, targetId: targetId2 } of this.adjacencyList.get(targetId) || []) {
          if (edge2.type === "CITES") {
            const endNode = this.nodes.get(targetId2);
            if (endNode) {
              paths.push({
                nodes: [startNode, midNode, endNode],
                edges: [edge, edge2],
                pathDescription: `${startNode.label} → 引用 → ${midNode.label} → 引用 → ${endNode.label}`,
              });
            }
          }
        }
      }
    }

    return paths;
  }

  // ---- 统计与导出 ----

  getStats(): { nodeCount: number; edgeCount: number; byNodeType: Record<string, number>; byEdgeType: Record<string, number> } {
    const byNodeType: Record<string, number> = {};
    const byEdgeType: Record<string, number> = {};

    for (const node of this.nodes.values()) {
      byNodeType[node.type] = (byNodeType[node.type] || 0) + 1;
    }
    for (const edge of this.edges.values()) {
      byEdgeType[edge.type] = (byEdgeType[edge.type] || 0) + 1;
    }

    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      byNodeType,
      byEdgeType,
    };
  }

  /**
   * 导出为 Neo4j Cypher 语句（V1 迁移用）
   */
  toCypherStatements(): string[] {
    const statements: string[] = [];

    // CREATE nodes
    for (const node of this.nodes.values()) {
      const props = Object.entries(node.properties)
        .map(([k, v]) => `${k}: "${String(v).replace(/"/g, '\\"')}"`)
        .join(", ");
      statements.push(
        `CREATE (n:${node.type} {id: "${node.id}", label: "${node.label}"${props ? ", " + props : ""}})`
      );
    }

    // CREATE relationships
    for (const edge of this.edges.values()) {
      const props = edge.properties
        ? ", " + Object.entries(edge.properties)
            .map(([k, v]) => `${k}: "${String(v).replace(/"/g, '\\"')}"`)
            .join(", ")
        : "";
      statements.push(
        `MATCH (a {id: "${edge.source}"}), (b {id: "${edge.target}"}) ` +
          `CREATE (a)-[:${edge.type} {id: "${edge.id}"${props}}]->(b)`
      );
    }

    return statements;
  }
}

// ============================================================
// 预置知识图谱数据：中国 AI 法规关系
// ============================================================

const graph = new LegalKnowledgeGraph();

// ---- 节点：法规层 ----
const regulationNodes: GraphNode[] = [
  // 法律级（上位法）
  { id: "reg-pipl-2021", type: "Regulation", label: "《个人信息保护法》", properties: { legalLevel: "law", effectiveDate: "2021-11-01", category: "data_privacy" } },
  { id: "reg-dsl-2021", type: "Regulation", label: "《数据安全法》", properties: { legalLevel: "law", effectiveDate: "2021-09-01", category: "data_privacy" } },
  { id: "reg-csl-2017", type: "Regulation", label: "《网络安全法》", properties: { legalLevel: "law", effectiveDate: "2017-06-01", category: "cybersecurity" } },
  { id: "reg-cpl-2013", type: "Regulation", label: "《消费者权益保护法》", properties: { legalLevel: "law", effectiveDate: "2014-03-15", category: "consumer" } },
  { id: "reg-ad-law-2021", type: "Regulation", label: "《广告法》", properties: { legalLevel: "law", effectiveDate: "2021-04-29", category: "advertising" } },
  { id: "reg-minor-law-2020", type: "Regulation", label: "《未成年人保护法》", properties: { legalLevel: "law", effectiveDate: "2021-06-01", category: "consumer" } },

  // 部门规章级（下位法）
  { id: "reg-gen-ai-2023", type: "Regulation", label: "《生成式AI暂行办法》", properties: { legalLevel: "rule", effectiveDate: "2023-08-15", category: "ai" } },
  { id: "reg-algorithm-2021", type: "Regulation", label: "《算法推荐管理规定》", properties: { legalLevel: "rule", effectiveDate: "2022-03-01", category: "ai" } },
  { id: "reg-deep-synthesis-2022", type: "Regulation", label: "《深度合成管理规定》", properties: { legalLevel: "rule", effectiveDate: "2023-01-10", category: "ai" } },
];

// ---- 节点：条款层 ----
const articleNodes: GraphNode[] = [
  // 个人信息保护法
  { id: "art-pipl-13", type: "Article", label: "个保法第13条（合法性基础）", properties: { regulationId: "reg-pipl-2021", articleNumber: "第13条", topic: "个人信息处理" } },
  { id: "art-pipl-17", type: "Article", label: "个保法第17条（告知义务）", properties: { regulationId: "reg-pipl-2021", articleNumber: "第17条", topic: "隐私政策" } },
  { id: "art-pipl-28", type: "Article", label: "个保法第28条（敏感信息处理）", properties: { regulationId: "reg-pipl-2021", articleNumber: "第28条", topic: "敏感个人信息" } },
  { id: "art-pipl-38", type: "Article", label: "个保法第38条（跨境传输）", properties: { regulationId: "reg-pipl-2021", articleNumber: "第38条", topic: "数据跨境" } },
  { id: "art-pipl-44", type: "Article", label: "个保法第44条（数据主体权利）", properties: { regulationId: "reg-pipl-2021", articleNumber: "第44条", topic: "用户权利" } },

  // 数据安全法
  { id: "art-dsl-21", type: "Article", label: "数据安全法第21条（分类分级）", properties: { regulationId: "reg-dsl-2021", articleNumber: "第21条", topic: "数据分类分级" } },
  { id: "art-dsl-27", type: "Article", label: "数据安全法第27条（安全管理制度）", properties: { regulationId: "reg-dsl-2021", articleNumber: "第27条", topic: "数据安全" } },

  // 网络安全法
  { id: "art-csl-21", type: "Article", label: "网络安全法第21条（等级保护）", properties: { regulationId: "reg-csl-2017", articleNumber: "第21条", topic: "等级保护" } },
  { id: "art-csl-37", type: "Article", label: "网络安全法第37条（数据本地化）", properties: { regulationId: "reg-csl-2017", articleNumber: "第37条", topic: "数据跨境" } },

  // 生成式AI
  { id: "art-genai-4", type: "Article", label: "生成式AI第4条（备案义务）", properties: { regulationId: "reg-gen-ai-2023", articleNumber: "第4条", topic: "算法备案" } },
  { id: "art-genai-7", type: "Article", label: "生成式AI第7条（训练数据合规）", properties: { regulationId: "reg-gen-ai-2023", articleNumber: "第7条", topic: "训练数据" } },
  { id: "art-genai-9", type: "Article", label: "生成式AI第9条（网络信息安全）", properties: { regulationId: "reg-gen-ai-2023", articleNumber: "第9条", topic: "内容安全" } },
  { id: "art-genai-12", type: "Article", label: "生成式AI第12条（内容标识）", properties: { regulationId: "reg-gen-ai-2023", articleNumber: "第12条", topic: "内容标识" } },

  // 算法推荐
  { id: "art-algo-24", type: "Article", label: "算法推荐第24条（备案义务）", properties: { regulationId: "reg-algorithm-2021", articleNumber: "第24条", topic: "算法备案" } },
  { id: "art-algo-10", type: "Article", label: "算法推荐第10条（透明度告知）", properties: { regulationId: "reg-algorithm-2021", articleNumber: "第10条", topic: "算法透明度" } },

  // 深度合成
  { id: "art-deep-16", type: "Article", label: "深度合成第16条（内容标识）", properties: { regulationId: "reg-deep-synthesis-2022", articleNumber: "第16条", topic: "深度合成标识" } },
  { id: "art-deep-19", type: "Article", label: "深度合成第19条（辟谣机制）", properties: { regulationId: "reg-deep-synthesis-2022", articleNumber: "第19条", topic: "内容安全" } },

  // 消费者权益保护法
  { id: "art-cpl-20", type: "Article", label: "消保法第20条（禁止虚假宣传）", properties: { regulationId: "reg-cpl-2013", articleNumber: "第20条", topic: "营销合规" } },

  // 广告法
  { id: "art-ad-4", type: "Article", label: "广告法第4条（广告真实性）", properties: { regulationId: "reg-ad-law-2021", articleNumber: "第4条", topic: "营销合规" } },

  // 未成年人保护法
  { id: "art-minor-75", type: "Article", label: "未保法第75条（未成年人网络保护）", properties: { regulationId: "reg-minor-law-2020", articleNumber: "第75条", topic: "未成年人保护" } },
];

// ---- 节点：法律概念层 ----
const conceptNodes: GraphNode[] = [
  { id: "concept-personal-info", type: "Concept", label: "个人信息", properties: { definition: "以电子或者其他方式记录的与已识别或者可识别的自然人有关的各种信息" } },
  { id: "concept-sensitive-info", type: "Concept", label: "敏感个人信息", properties: { definition: "一旦泄露或者非法使用，容易导致自然人的人格尊严受到侵害或者人身、财产安全受到危害的个人信息" } },
  { id: "concept-cross-border", type: "Concept", label: "数据跨境传输", properties: { definition: "向中华人民共和国境外提供个人信息或重要数据" } },
  { id: "concept-algo-filing", type: "Concept", label: "算法备案", properties: { definition: "具有舆论属性或社会动员能力的算法推荐服务提供者的备案义务" } },
  { id: "concept-content-labeling", type: "Concept", label: "AI内容标识", properties: { definition: "对AI生成内容进行显著标识，防止公众误认为是人类创作" } },
  { id: "concept-ad-compliance", type: "Concept", label: "营销合规", properties: { definition: "广告/营销内容不得含有虚假或引人误解的内容" } },
];

// ---- 注册所有节点 ----
for (const node of [...regulationNodes, ...articleNodes, ...conceptNodes]) {
  graph.addNode(node);
}

// ---- 边：上下位法关系 (SUPERIOR_TO) ----
const superiorEdges: GraphEdge[] = [
  // 部门规章 → 法律
  { id: "edge-sup-genai-pipl", type: "SUPERIOR_TO", source: "reg-gen-ai-2023", target: "reg-pipl-2021", properties: { reason: "生成式AI暂行办法第7条/第9条引用了个人信息保护法" } },
  { id: "edge-sup-genai-dsl", type: "SUPERIOR_TO", source: "reg-gen-ai-2023", target: "reg-dsl-2021", properties: { reason: "AI训练数据处理涉及数据安全法" } },
  { id: "edge-sup-genai-csl", type: "SUPERIOR_TO", source: "reg-gen-ai-2023", target: "reg-csl-2017", properties: { reason: "生成式AI服务涉及网络安全法" } },
  { id: "edge-sup-algo-csl", type: "SUPERIOR_TO", source: "reg-algorithm-2021", target: "reg-csl-2017", properties: { reason: "算法推荐服务属于互联网信息服务" } },
  { id: "edge-sup-deep-csl", type: "SUPERIOR_TO", source: "reg-deep-synthesis-2022", target: "reg-csl-2017", properties: { reason: "深度合成属于互联网信息服务" } },
  { id: "edge-sup-deep-pipl", type: "SUPERIOR_TO", source: "reg-deep-synthesis-2022", target: "reg-pipl-2021", properties: { reason: "涉及生物识别信息的深度合成" } },
];

// ---- 边：条款引用关系 (CITES) ----
const citationEdges: GraphEdge[] = [
  // 生成式AI第4条 → 算法推荐第24条（备案要求）
  { id: "edge-cite-genai4-algo24", type: "CITES", source: "art-genai-4", target: "art-algo-24", properties: { context: "生成式AI备案按算法推荐规定执行" } },

  // 生成式AI第12条 → 深度合成第16条（内容标识）
  { id: "edge-cite-genai12-deep16", type: "CITES", source: "art-genai-12", target: "art-deep-16", properties: { context: "生成式AI内容标识按深度合成规定执行" } },

  // 个保法第38条 → 网安法第37条（数据跨境安全评估）
  { id: "edge-cite-pipl38-csl37", type: "CITES", source: "art-pipl-38", target: "art-csl-37", properties: { context: "数据出境安全评估须按网安法执行" } },

  // 生成式AI第7条 → 个保法第13条（训练数据中个人信息）
  { id: "edge-cite-genai7-pipl13", type: "CITES", source: "art-genai-7", target: "art-pipl-13", properties: { context: "训练数据中的个人信息处理需满足合法性基础" } },

  // 算法推荐第24条 → 生成式AI第4条（算法备案）
  { id: "edge-cite-algo24-genai4", type: "CITES", source: "art-algo-24", target: "art-genai-4", properties: { context: "生成式AI服务需同时满足算法推荐备案要求" } },

  // 深度合成第16条 → 个保法第28条（生物识别信息处理）
  { id: "edge-cite-deep16-pipl28", type: "CITES", source: "art-deep-16", target: "art-pipl-28", properties: { context: "深度合成涉及的人脸/人声编辑需满足敏感信息规定" } },

  // 生成式AI第4条 → 生成式AI第12条（备案→标识联动）
  { id: "edge-cite-genai4-genai12", type: "CITES", source: "art-genai-4", target: "art-genai-12", properties: { context: "完成备案的服务须同时履行内容标识义务" } },
];

// ---- 边：概念关联 (RELATES_TO) ----
const conceptEdges: GraphEdge[] = [
  { id: "edge-rel-personal-pipl13", type: "RELATES_TO", source: "concept-personal-info", target: "art-pipl-13", properties: {} },
  { id: "edge-rel-personal-pipl17", type: "RELATES_TO", source: "concept-personal-info", target: "art-pipl-17", properties: {} },
  { id: "edge-rel-personal-pipl44", type: "RELATES_TO", source: "concept-personal-info", target: "art-pipl-44", properties: {} },

  { id: "edge-rel-sensitive-pipl28", type: "RELATES_TO", source: "concept-sensitive-info", target: "art-pipl-28", properties: {} },
  { id: "edge-rel-sensitive-deep16", type: "RELATES_TO", source: "concept-sensitive-info", target: "art-deep-16", properties: {} },

  { id: "edge-rel-cross-pipl38", type: "RELATES_TO", source: "concept-cross-border", target: "art-pipl-38", properties: {} },
  { id: "edge-rel-cross-csl37", type: "RELATES_TO", source: "concept-cross-border", target: "art-csl-37", properties: {} },

  { id: "edge-rel-filing-genai4", type: "RELATES_TO", source: "concept-algo-filing", target: "art-genai-4", properties: {} },
  { id: "edge-rel-filing-algo24", type: "RELATES_TO", source: "concept-algo-filing", target: "art-algo-24", properties: {} },

  { id: "edge-rel-label-genai12", type: "RELATES_TO", source: "concept-content-labeling", target: "art-genai-12", properties: {} },
  { id: "edge-rel-label-deep16", type: "RELATES_TO", source: "concept-content-labeling", target: "art-deep-16", properties: {} },

  { id: "edge-rel-ad-cpl20", type: "RELATES_TO", source: "concept-ad-compliance", target: "art-cpl-20", properties: {} },
  { id: "edge-rel-ad-ad4", type: "RELATES_TO", source: "concept-ad-compliance", target: "art-ad-4", properties: {} },
];

// ---- 注册所有边 ----
for (const edge of [...superiorEdges, ...citationEdges, ...conceptEdges]) {
  graph.addEdge(edge);
}

// ============================================================
// 导出单例
// ============================================================

export const legalGraph = graph;

/**
 * 基于产品特征进行图谱增强检索
 * 
 * 第一步：关键词匹配找到初始条款集合
 * 第二步：对每条初始条款，遍历图谱找关联条款（引用/上下位法/概念关联）
 * 第三步：去重、排序、返回
 */
export function graphEnhancedSearch(initialArticleIds: string[]): {
  directHits: GraphQueryResult[];
  citedBy: GraphQueryResult[];
  superiorLaws: GraphPath[];
  relatedConcepts: GraphQueryResult[];
} {
  const directHits: GraphQueryResult[] = [];
  const citedByMap = new Map<string, GraphQueryResult>();
  const superiorLawsMap = new Map<string, GraphPath>();
  const relatedConcepts: GraphQueryResult[] = [];

  for (const id of initialArticleIds) {
    // 直接命中
    const hit = graph.getNeighbors(id);
    if (hit) directHits.push(hit);

    // 被引用关系
    const citers = graph.getCitingArticles(id);
    for (const c of citers) {
      citedByMap.set(c.node.id, c);
    }

    // 上位法链
    const superiors = graph.getSuperiorChain(id);
    for (const s of superiors) {
      const key = s.nodes.map((n) => n.id).join("→");
      superiorLawsMap.set(key, s);
    }

    // 两跳引用
    const twoHop = graph.getTwoHopReferences(id);
    for (const t of twoHop) {
      const key = t.nodes.map((n) => n.id).join("→");
      superiorLawsMap.set(key, t);
    }
  }

  // 概念关联：从节点中提取 topic，查找相关概念
  const topics = new Set<string>();
  for (const id of initialArticleIds) {
    const node = graph.getNode(id);
    const topic = node?.properties?.topic as string;
    if (topic) topics.add(topic);
  }

  for (const topic of topics) {
    const conceptId = `concept-${topic.replace(/\s+/g, "-").toLowerCase()}`;
    const conceptArticles = graph.getArticlesByConcept(conceptId);
    relatedConcepts.push(...conceptArticles);
  }

  return {
    directHits,
    citedBy: Array.from(citedByMap.values()),
    superiorLaws: Array.from(superiorLawsMap.values()),
    relatedConcepts,
  };
}
