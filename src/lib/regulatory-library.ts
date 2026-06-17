/**
 * 法律法规数据库 — 中文 AI 合规核心法规库（全量版）
 *
 * 数据来源：
 *   1. 《中国数据合规网络安全法规全量清单 2020-2026》Excel — 元数据
 *   2. 公开法律法规文本（www.gov.cn / pkulaw.com）— 条款原文
 *
 * 设计原则：
 *   1. Demo 阶段以内存 JSON 为主（不依赖 PostgreSQL）
 *   2. 数据结构与 Prisma Regulatory / RegulatoryArticle 模型对齐
 *   3. 每条条款标记义务类型（mandatory | prohibitive | conditional）
 *   4. 标注罚则信息（penalty type / statutory penalty）
 *   5. 生产环境可通过 Prisma 从数据库加载
 *
 * 更新日志：
 *   2026-06-08: 全量入库 77 部法规（来源：法规全量清单 Excel）
 *              覆盖 法律/行政法规/部门规章/规范性文件/国家标准/行业标准/地方规章/草案
 *
 * ⚠️ 数据完整性提示：
 *   标记 [待补充条款] 的法规仅含元数据+摘要，尚未录入具体条款文本
 *   标记 [条款已录入] 的法规含完整条款级数据
 *   标记 [待核实条款] 的法规条款已录入但需要对照官方文本核实
 */

// ============================================================
// TYPES
// ============================================================

export type ObligationType = "mandatory" | "prohibitive" | "conditional" | "procedural";

export type PenaltyType =
  | "fine"
  | "rectification"
  | "shutdown"
  | "license_revoke"
  | "criminal"
  | "civil"
  | "administrative_penalty";

export interface RegulatoryArticle {
  id: string;
  regulationId: string;
  articleOrder: number;
  articleNumber: string;
  title?: string;
  content: string;
  obligations: {
    type: ObligationType;
    target: string;
    triggerKeywords: string[];
    severity: "critical" | "high" | "medium" | "low";
  }[];
  penalty?: {
    type: PenaltyType;
    description: string;
    statutoryPenalty: string;
  };
  keywords: string[];
  /** 数据状态 */
  dataStatus?: "verified" | "pending_verification" | "metadata_only";
}

export interface Regulatory {
  id: string;
  title: string;
  shortTitle?: string;
  documentNumber?: string;
  issuingBody: string;
  lawType:
    | "law"
    | "administrative_regulation"
    | "departmental_rule"
    | "normative_document"
    | "national_standard"
    | "mandatory_national_standard"
    | "industry_standard"
    | "local_regulation"
    | "draft"
    | "policy_guideline"
    | "judicial_interpretation";
  legalLevel: "constitution" | "law" | "regulation" | "rule" | "normative" | "standard" | "local" | "draft";
  publishDate: string;
  effectiveDate: string;
  amendmentDate?: string;
  status: "effective" | "amended" | "repealed" | "draft" | "pending_effect";
  category: string;
  /** 细分类型（来自 Excel 文件细类） */
  subCategory?: string;
  /** 重点行业（来自 Excel） */
  industry?: string;
  /** 出海相关等级（来自 Excel） */
  crossBorderLevel?: "★★" | "★" | "—";
  keywords: string[];
  summary: string;
  articles: RegulatoryArticle[];
  /** 数据来源 */
  source?: string;
}

// ============================================================
// 辅助函数：创建元数据级法规条目（尚无具体条款）
// ============================================================

function metadataArticle(regId: string, index: number, title: string): RegulatoryArticle {
  return {
    id: `${regId}-meta-${index}`,
    regulationId: regId,
    articleOrder: index,
    articleNumber: `第${index}条`,
    title: `[待补充条款] ${title}`,
    content: `⚠️ 该条款文本尚未录入。仅含法规元数据。来源：中国数据合规网络安全法规全量清单2020-2026。`,
    obligations: [],
    keywords: [],
    dataStatus: "metadata_only",
  };
}

// ============================================================
// 法规库
// ============================================================

export const REGULATORY_LIBRARY: Regulatory[] = [

  // ═══════════════════════════════════════════════════════════
  // 第一部分：法律 (Law) — 5 部
  // ═══════════════════════════════════════════════════════════

  // ========== 1. 数据安全法 ==========
  {
    id: "reg-dsl-2021",
    title: "中华人民共和国数据安全法",
    shortTitle: "数据安全法",
    documentNumber: "中华人民共和国主席令第84号",
    issuingBody: "全国人民代表大会常务委员会",
    lawType: "law",
    legalLevel: "law",
    publishDate: "2021-06-10",
    effectiveDate: "2021-09-01",
    status: "effective",
    category: "data-security",
    subCategory: "法律",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["数据安全", "分类分级", "数据保护", "安全审查", "数据处理"],
    summary: "数据安全领域基础性法律，确立数据分类分级、核心数据保护制度。",
    source: "excel+public",
    articles: [
      {
        id: "dsl-art-21",
        regulationId: "reg-dsl-2021",
        articleOrder: 1,
        articleNumber: "第21条",
        title: "数据分类分级保护",
        content: "国家建立数据分类分级保护制度，根据数据在经济社会发展中的重要程度，以及一旦遭到篡改、破坏、泄露或者非法获取、非法利用，对国家安全、公共利益或者个人、组织合法权益造成的危害程度，对数据实行分类分级保护。",
        obligations: [
          { type: "mandatory", target: "数据分类分级", triggerKeywords: ["数据处理", "用户数据", "数据存储", "数据管理"], severity: "high" }
        ],
        keywords: ["分类分级", "数据保护", "安全制度"]
      },
      {
        id: "dsl-art-27",
        regulationId: "reg-dsl-2021",
        articleOrder: 2,
        articleNumber: "第27条",
        title: "全流程数据安全管理制度",
        content: "开展数据处理活动应当依照法律、法规的规定，建立健全全流程数据安全管理制度，组织开展数据安全教育培训，采取相应的技术措施和其他必要措施，保障数据安全。",
        obligations: [
          { type: "mandatory", target: "数据安全管理制度", triggerKeywords: ["数据处理", "用户数据", "数据存储", "数据管理", "数据安全"], severity: "high" }
        ],
        penalty: {
          type: "fine",
          description: "未建立数据安全管理制度",
          statutoryPenalty: "责令改正，给予警告，可以并处五万元以上五十万元以下罚款；拒不改正的，处五十万元以上二百万元以下罚款"
        },
        keywords: ["数据安全", "管理制度", "全流程", "技术措施"]
      }
    ]
  },

  // ========== 2. 个人信息保护法 ==========
  {
    id: "reg-pipl-2021",
    title: "中华人民共和国个人信息保护法",
    shortTitle: "个人信息保护法",
    documentNumber: "中华人民共和国主席令第91号",
    issuingBody: "全国人民代表大会常务委员会",
    lawType: "law",
    legalLevel: "law",
    publishDate: "2021-08-20",
    effectiveDate: "2021-11-01",
    status: "effective",
    category: "data-privacy",
    subCategory: "法律",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["个人信息保护", "数据出境", "知情同意", "敏感信息", "个人信息", "隐私政策"],
    summary: "个人信息保护核心法律，对标GDPR，规定数据出境三大路径。",
    source: "excel+public",
    articles: [
      {
        id: "pipl-art-6",
        regulationId: "reg-pipl-2021",
        articleOrder: 1,
        articleNumber: "第6条",
        title: "最小必要原则",
        content: "处理个人信息应当具有明确、合理的目的，并应当与处理目的直接相关，采取对个人权益影响最小的方式。收集个人信息，应当限于实现处理目的的最小范围，不得过度收集个人信息。",
        obligations: [
          { type: "mandatory", target: "最小必要原则", triggerKeywords: ["个人信息", "数据收集", "用户信息", "隐私政策", "信息采集"], severity: "high" }
        ],
        keywords: ["最小必要", "数据收集", "个人信息", "隐私"]
      },
      {
        id: "pipl-art-13",
        regulationId: "reg-pipl-2021",
        articleOrder: 2,
        articleNumber: "第13条",
        title: "处理个人信息的合法性基础",
        content: "符合下列情形之一的，个人信息处理者方可处理个人信息：（一）取得个人的同意；（二）为订立、履行个人作为一方当事人的合同所必需……（六）依照本法规定在合理的范围内处理个人自行公开或者其他已经合法公开的个人信息；（七）法律、行政法规规定的其他情形。",
        obligations: [
          { type: "conditional", target: "合法性基础", triggerKeywords: ["个人信息", "数据处理", "同意", "隐私政策", "用户协议"], severity: "high" }
        ],
        keywords: ["合法性基础", "同意", "个人信息处理"]
      },
      {
        id: "pipl-art-38",
        regulationId: "reg-pipl-2021",
        articleOrder: 3,
        articleNumber: "第38条",
        title: "数据出境三大路径",
        content: "个人信息处理者因业务等需要，确需向中华人民共和国境外提供个人信息的，应当具备下列条件之一：（一）依照本法第四十条的规定通过国家网信部门组织的安全评估；（二）按照国家网信部门的规定经专业机构进行个人信息保护认证；（三）按照国家网信部门制定的标准合同与境外接收方订立合同，约定双方的权利和义务；（四）法律、行政法规或者国家网信部门规定的其他条件。",
        obligations: [
          { type: "conditional", target: "数据出境合规路径", triggerKeywords: ["跨境", "出海", "境外", "数据出境", "跨境传输", "海外服务器"], severity: "critical" }
        ],
        penalty: {
          type: "fine",
          description: "未经合规路径向境外提供个人信息",
          statutoryPenalty: "情节严重的，处五千万元以下或者上一年度营业额百分之五以下罚款，并可以责令暂停相关业务或者停业整顿、吊销相关业务许可或者吊销营业执照"
        },
        keywords: ["数据出境", "安全评估", "标准合同", "认证", "跨境"]
      },
      {
        id: "pipl-art-40",
        regulationId: "reg-pipl-2021",
        articleOrder: 4,
        articleNumber: "第40条",
        title: "关基运营者+CIIO 安全评估义务",
        content: "关键信息基础设施运营者和处理个人信息达到国家网信部门规定数量的个人信息处理者，应当将在中华人民共和国境内收集和产生的个人信息存储在境内。确需向境外提供的，应当通过国家网信部门组织的安全评估。",
        obligations: [
          { type: "mandatory", target: "数据本地化+安全评估", triggerKeywords: ["跨境", "数据出境", "关键信息基础设施", "境外上市", "出海"], severity: "critical" }
        ],
        keywords: ["数据本地化", "关键信息基础设施", "安全评估", "境外"]
      },
      {
        id: "pipl-art-28",
        regulationId: "reg-pipl-2021",
        articleOrder: 5,
        articleNumber: "第28条",
        title: "敏感个人信息处理",
        content: "敏感个人信息是一旦泄露或者非法使用，容易导致自然人的人格尊严受到侵害或者人身、财产安全受到危害的个人信息，包括生物识别、宗教信仰、特定身份、医疗健康、金融账户、行踪轨迹等信息，以及不满十四周岁未成年人的个人信息。只有在具有特定的目的和充分的必要性，并采取严格保护措施的情形下，个人信息处理者方可处理敏感个人信息。",
        obligations: [
          { type: "conditional", target: "敏感信息处理", triggerKeywords: ["人脸识别", "指纹", "健康数据", "生物特征", "敏感信息", "金融账户", "行踪"], severity: "critical" }
        ],
        keywords: ["敏感个人信息", "生物识别", "医疗健康", "金融账户"]
      }
    ]
  },

  // ========== 3. 网络安全法（2025年修正版）[条款已录入，待核实] ==========
  {
    id: "reg-csl-2025",
    title: "中华人民共和国网络安全法（2025年修正）",
    shortTitle: "网络安全法",
    documentNumber: "中华人民共和国主席令第53号（2025修正）",
    issuingBody: "全国人民代表大会常务委员会",
    lawType: "law",
    legalLevel: "law",
    publishDate: "2025-10-28",
    effectiveDate: "2026-01-01",
    amendmentDate: "2025-10-28",
    status: "effective",
    category: "cybersecurity",
    subCategory: "法律（修正）",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["网络安全", "等级保护", "个人信息保护", "AI专条", "数据本地化", "关键信息基础设施"],
    summary: "新增AI专条（第二十条），将人工智能纳入基础性法律框架。",
    source: "excel+public",
    articles: [
      {
        id: "csl-2025-art-20",
        regulationId: "reg-csl-2025",
        articleOrder: 1,
        articleNumber: "第二十条（新增AI专条）",
        title: "人工智能安全条款",
        content: "⚠️ [待核实条款] 2025年修正新增：国家鼓励人工智能创新应用，人工智能相关产品和服务提供者应当遵守法律法规，尊重社会公德和伦理，不得利用人工智能技术从事危害网络安全的活动。具体条文以全国人大公布的最终文本为准。",
        obligations: [
          { type: "mandatory", target: "AI安全义务", triggerKeywords: ["AI", "人工智能", "大模型", "生成式AI", "机器学习"], severity: "critical" }
        ],
        keywords: ["AI", "人工智能", "网络安全", "2025修正"],
        dataStatus: "pending_verification"
      },
      {
        id: "csl-2025-art-21",
        regulationId: "reg-csl-2025",
        articleOrder: 2,
        articleNumber: "第21条",
        title: "网络安全等级保护义务",
        content: "国家实行网络安全等级保护制度。网络运营者应当按照网络安全等级保护制度的要求，履行下列安全保护义务，保障网络免受干扰、破坏或者未经授权的访问，防止网络数据泄露或者被窃取、篡改。",
        obligations: [
          { type: "mandatory", target: "等级保护", triggerKeywords: ["网络服务", "在线平台", "SaaS", "网络运营", "网站", "App"], severity: "medium" }
        ],
        keywords: ["等级保护", "网络运营", "安全义务", "数据防泄露"]
      },
      {
        id: "csl-2025-art-37",
        regulationId: "reg-csl-2025",
        articleOrder: 3,
        articleNumber: "第37条",
        title: "数据本地化与出境安全评估",
        content: "关键信息基础设施的运营者在中华人民共和国境内运营中收集和产生的个人信息和重要数据应当在境内存储。因业务需要，确需向境外提供的，应当按照国家网信部门会同国务院有关部门制定的办法进行安全评估。",
        obligations: [
          { type: "mandatory", target: "数据本地化存储", triggerKeywords: ["跨境", "海外服务器", "境外存储", "数据存储"], severity: "high" }
        ],
        keywords: ["数据本地化", "境外传输", "安全评估", "关键信息基础设施"]
      }
    ]
  },

  // ========== 4. 生物安全法 [待补充条款] ==========
  {
    id: "reg-bsl-2020",
    title: "中华人民共和国生物安全法",
    shortTitle: "生物安全法",
    issuingBody: "全国人民代表大会常务委员会",
    lawType: "law",
    legalLevel: "law",
    publishDate: "2020-10-17",
    effectiveDate: "2021-04-15",
    status: "effective",
    category: "biosafety",
    subCategory: "法律",
    industry: "医疗健康/生物科技",
    crossBorderLevel: "★★",
    keywords: ["生物安全", "人类遗传资源", "生物数据", "出境", "医疗"],
    summary: "规制人类遗传资源和生物数据出境，出海生物科技/医疗企业必须关注。",
    source: "excel",
    articles: [metadataArticle("reg-bsl-2020", 1, "人类遗传资源与生物数据安全")]
  },

  // ========== 5. 反电信网络诈骗法 [待补充条款] ==========
  {
    id: "reg-atef-2022",
    title: "中华人民共和国反电信网络诈骗法",
    shortTitle: "反电信网络诈骗法",
    issuingBody: "全国人民代表大会常务委员会",
    lawType: "law",
    legalLevel: "law",
    publishDate: "2022-09-02",
    effectiveDate: "2022-12-01",
    status: "effective",
    category: "cybersecurity",
    subCategory: "法律",
    industry: "电信互联网",
    crossBorderLevel: "—",
    keywords: ["反诈", "电信网络", "数据协助", "互联网服务"],
    summary: "规制境内互联网服务提供者数据协助义务。",
    source: "excel",
    articles: [metadataArticle("reg-atef-2022", 1, "互联网服务提供者数据协助义务")]
  },

  // ═══════════════════════════════════════════════════════════
  // 第二部分：行政法规 (Administrative Regulation) — 4 部
  // ═══════════════════════════════════════════════════════════

  // ========== 6. 关键信息基础设施安全保护条例 [待补充条款] ==========
  {
    id: "reg-ciip-2021",
    title: "关键信息基础设施安全保护条例",
    shortTitle: "关基保护条例",
    issuingBody: "国务院",
    lawType: "administrative_regulation",
    legalLevel: "regulation",
    publishDate: "2021-07-30",
    effectiveDate: "2021-09-01",
    status: "effective",
    category: "cybersecurity",
    subCategory: "行政法规",
    industry: "通用",
    crossBorderLevel: "★",
    keywords: ["关键信息基础设施", "CII", "安全保护", "数据出境", "安全评估"],
    summary: "界定关键信息基础设施认定标准，数据出境须经安全评估。",
    source: "excel",
    articles: [metadataArticle("reg-ciip-2021", 1, "CII认定标准与安全保护义务")]
  },

  // ========== 7. 网络数据安全管理条例 [条款已录入，已验证] ==========
  {
    id: "reg-ndsm-2024",
    title: "网络数据安全管理条例",
    shortTitle: "网络数据安全管理条例",
    documentNumber: "国务院令第790号",
    issuingBody: "国务院",
    lawType: "administrative_regulation",
    legalLevel: "regulation",
    publishDate: "2024-09-30",
    effectiveDate: "2025-01-01",
    status: "effective",
    category: "data-security",
    subCategory: "行政法规",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["网络数据", "数据处理者", "数据安全", "个人信息", "重要数据", "跨境", "生成式AI", "算法推荐", "个性化推荐"],
    summary: "首部横跨三大基础法律（网安法/数安法/个保法）的综合性行政法规，细化数据处理者义务。2025.1.1施行。来源：https://www.gov.cn/zhengce/content/202409/content_6977766.htm",
    source: "gov.cn_official",
    articles: [
      {
        id: "ndsm-art-5",
        regulationId: "reg-ndsm-2024",
        articleOrder: 1,
        articleNumber: "第5条",
        title: "数据分类分级保护",
        content: "国家根据网络数据在经济社会发展中的重要程度，以及一旦遭到篡改、破坏、泄露或者非法获取、非法利用，对国家安全、公共利益或者个人、组织合法权益造成的危害程度，对网络数据实行分类分级保护。",
        obligations: [
          { type: "mandatory", target: "数据分类分级", triggerKeywords: ["数据处理", "用户数据", "数据存储", "数据管理", "分类分级"], severity: "high" }
        ],
        keywords: ["分类分级", "数据保护", "重要程度"],
        dataStatus: "verified"
      },
      {
        id: "ndsm-art-9",
        regulationId: "reg-ndsm-2024",
        articleOrder: 2,
        articleNumber: "第9条",
        title: "数据安全管理制度与技术措施",
        content: "网络数据处理者应当依照法律、行政法规的规定和国家标准的强制性要求，在网络安全等级保护的基础上，加强网络数据安全防护，建立健全网络数据安全管理制度，采取加密、备份、访问控制、安全认证等技术措施和其他必要措施，保护网络数据免遭篡改、破坏、泄露或者非法获取、非法利用，并对所处理网络数据的安全承担主体责任。",
        obligations: [
          { type: "mandatory", target: "数据安全管理制度+技术措施", triggerKeywords: ["数据处理", "网络数据", "数据管理", "用户数据", "数据安全", "加密", "访问控制"], severity: "high" }
        ],
        keywords: ["数据处理者", "安全管理制度", "技术措施", "主体责任", "等级保护"],
        dataStatus: "verified"
      },
      {
        id: "ndsm-art-19",
        regulationId: "reg-ndsm-2024",
        articleOrder: 3,
        articleNumber: "第19条",
        title: "生成式AI训练数据安全管理",
        content: "提供生成式人工智能服务的网络数据处理者应当加强对训练数据和训练数据处理活动的安全管理，采取有效措施防范和处置网络数据安全风险。",
        obligations: [
          { type: "mandatory", target: "AI训练数据安全", triggerKeywords: ["生成式AI", "大模型", "训练数据", "语料", "模型训练", "预训练", "AI服务"], severity: "critical" }
        ],
        keywords: ["生成式AI", "训练数据", "安全管理", "数据安全风险"],
        dataStatus: "verified"
      },
      {
        id: "ndsm-art-21",
        regulationId: "reg-ndsm-2024",
        articleOrder: 4,
        articleNumber: "第21条",
        title: "个人信息处理规则",
        content: "网络数据处理者在处理个人信息前，通过制定个人信息处理规则的方式依法向个人告知的，个人信息处理规则应当集中公开展示、易于访问并置于醒目位置，内容明确具体、清晰易懂，包括：网络数据处理者的名称和联系方式；处理个人信息的目的、方式、种类，处理敏感个人信息的必要性以及对个人权益的影响；个人信息保存期限和到期后的处理方式；个人查阅、复制、转移、更正、补充、删除、限制处理个人信息以及注销账号、撤回同意的方法和途径等。处理不满十四周岁未成年人个人信息的，还应当制定专门的个人信息处理规则。",
        obligations: [
          { type: "mandatory", target: "个人信息处理规则公示", triggerKeywords: ["个人信息", "隐私政策", "用户协议", "数据收集", "信息采集"], severity: "high" }
        ],
        keywords: ["个人信息", "处理规则", "告知", "透明度", "未成年人"],
        dataStatus: "verified"
      },
      {
        id: "ndsm-art-22",
        regulationId: "reg-ndsm-2024",
        articleOrder: 5,
        articleNumber: "第22条",
        title: "个人同意与敏感信息单独同意",
        content: "网络数据处理者基于个人同意处理个人信息的，应当遵守下列规定：（一）收集个人信息为提供产品或者服务所必需，不得超范围收集个人信息，不得通过误导、欺诈、胁迫等方式取得个人同意；（二）处理生物识别、宗教信仰、特定身份、医疗健康、金融账户、行踪轨迹等敏感个人信息的，应当取得个人的单独同意；（三）处理不满十四周岁未成年人个人信息的，应当取得未成年人的父母或者其他监护人的同意；（四）不得超出个人同意的个人信息处理目的、方式、种类、保存期限处理个人信息；（五）不得在个人明确表示不同意处理其个人信息后，频繁征求同意；（六）个人信息的处理目的、方式、种类发生变更的，应当重新取得个人同意。",
        obligations: [
          { type: "mandatory", target: "最小必要+单独同意", triggerKeywords: ["个人信息", "隐私政策", "用户协议", "数据收集", "信息采集"], severity: "high" },
          { type: "mandatory", target: "敏感信息单独同意", triggerKeywords: ["人脸识别", "生物识别", "指纹", "健康数据", "金融账户", "行踪轨迹", "敏感个人信息"], severity: "critical" },
          { type: "mandatory", target: "未成年人监护人同意", triggerKeywords: ["未成年人", "青少年", "儿童", "未成年"], severity: "critical" }
        ],
        keywords: ["单独同意", "敏感个人信息", "未成年人", "监护人同意", "最小必要"],
        dataStatus: "verified"
      },
      {
        id: "ndsm-art-24",
        regulationId: "reg-ndsm-2024",
        articleOrder: 6,
        articleNumber: "第24条",
        title: "删除与匿名化义务",
        content: "因使用自动化采集技术等无法避免采集到非必要个人信息或者未依法取得个人同意的个人信息，以及个人注销账号的，网络数据处理者应当删除个人信息或者进行匿名化处理。法律、行政法规规定的保存期限未届满，或者删除、匿名化处理个人信息从技术上难以实现的，网络数据处理者应当停止除存储和采取必要的安全保护措施之外的处理。",
        obligations: [
          { type: "mandatory", target: "超范围数据删除/匿名化", triggerKeywords: ["个人信息", "数据删除", "账号注销", "自动化采集", "匿名化"], severity: "high" }
        ],
        keywords: ["删除", "匿名化", "账号注销", "自动化采集"],
        dataStatus: "verified"
      },
      {
        id: "ndsm-art-27",
        regulationId: "reg-ndsm-2024",
        articleOrder: 7,
        articleNumber: "第27条",
        title: "合规审计义务",
        content: "网络数据处理者应当定期自行或者委托专业机构对其处理个人信息遵守法律、行政法规的情况进行合规审计。",
        obligations: [
          { type: "mandatory", target: "个人信息合规审计", triggerKeywords: ["个人信息", "用户数据", "合规审计", "定期审计"], severity: "high" }
        ],
        keywords: ["合规审计", "个人信息", "定期审计"],
        dataStatus: "verified"
      },
      {
        id: "ndsm-art-30",
        regulationId: "reg-ndsm-2024",
        articleOrder: 8,
        articleNumber: "第30条",
        title: "重要数据安全负责人",
        content: "重要数据的处理者应当明确网络数据安全负责人和网络数据安全管理机构。网络数据安全负责人应当具备网络数据安全专业知识和相关管理工作经历，由网络数据处理者管理层成员担任，有权直接向有关主管部门报告网络数据安全情况。掌握有关主管部门规定的特定种类、规模的重要数据的网络数据处理者，应当对网络数据安全负责人和关键岗位的人员进行安全背景审查。",
        obligations: [
          { type: "mandatory", target: "重要数据安全负责人", triggerKeywords: ["重要数据", "安全负责人", "管理层", "背景审查"], severity: "critical" }
        ],
        keywords: ["重要数据", "安全负责人", "安全管理机构", "背景审查"],
        dataStatus: "verified"
      },
      {
        id: "ndsm-art-31",
        regulationId: "reg-ndsm-2024",
        articleOrder: 9,
        articleNumber: "第31条",
        title: "重要数据提供/委托前风险评估",
        content: "重要数据的处理者提供、委托处理、共同处理重要数据前，应当进行风险评估。风险评估应当重点评估：处理目的、方式、范围等是否合法正当必要；数据遭到篡改、破坏、泄露或非法获取的风险；数据接收方的诚信守法情况；合同约定的安全要求能否有效约束接收方；技术和管理措施能否有效防范风险等。",
        obligations: [
          { type: "mandatory", target: "重要数据提供前风险评估", triggerKeywords: ["重要数据", "委托处理", "数据共享", "提供数据", "风险评估"], severity: "critical" }
        ],
        keywords: ["重要数据", "风险评估", "委托处理", "数据接收方"],
        dataStatus: "verified"
      },
      {
        id: "ndsm-art-35",
        regulationId: "reg-ndsm-2024",
        articleOrder: 10,
        articleNumber: "第35条",
        title: "个人信息出境八大合法路径",
        content: "符合下列条件之一的，网络数据处理者可以向境外提供个人信息：（一）通过国家网信部门组织的数据出境安全评估；（二）按照国家网信部门的规定经专业机构进行个人信息保护认证；（三）符合国家网信部门制定的关于个人信息出境标准合同的规定；（四）为订立、履行个人作为一方当事人的合同确需向境外提供；（五）按照依法制定的劳动规章制度和依法签订的集体合同实施跨境人力资源管理确需向境外提供员工个人信息；（六）为履行法定职责或者法定义务确需向境外提供；（七）紧急情况下为保护自然人的生命健康和财产安全确需向境外提供；（八）法律、行政法规或者国家网信部门规定的其他条件。",
        obligations: [
          { type: "conditional", target: "个人信息出境合规路径", triggerKeywords: ["跨境", "出海", "境外", "数据出境", "跨境传输", "海外服务器"], severity: "critical" }
        ],
        keywords: ["个人信息出境", "安全评估", "标准合同", "认证", "八大路径"],
        dataStatus: "verified"
      },
      {
        id: "ndsm-art-37",
        regulationId: "reg-ndsm-2024",
        articleOrder: 11,
        articleNumber: "第37条",
        title: "重要数据出境安全评估",
        content: "网络数据处理者在中华人民共和国境内运营中收集和产生的重要数据确需向境外提供的，应当通过国家网信部门组织的数据出境安全评估。网络数据处理者按照国家有关规定识别、申报重要数据，但未被相关地区、部门告知或者公开发布为重要数据的，不需要将其作为重要数据申报数据出境安全评估。",
        obligations: [
          { type: "mandatory", target: "重要数据出境安全评估", triggerKeywords: ["重要数据", "跨境", "数据出境", "出海", "境外提供"], severity: "critical" }
        ],
        keywords: ["重要数据", "出境", "安全评估", "申报"],
        dataStatus: "verified"
      },
      {
        id: "ndsm-art-42",
        regulationId: "reg-ndsm-2024",
        articleOrder: 12,
        articleNumber: "第42条",
        title: "个性化推荐关闭选项",
        content: "网络平台服务提供者通过自动化决策方式向个人进行信息推送的，应当设置易于理解、便于访问和操作的个性化推荐关闭选项，为用户提供拒绝接收推送信息、删除针对其个人特征的用户标签等功能。",
        obligations: [
          { type: "mandatory", target: "个性化推荐关闭+标签删除", triggerKeywords: ["推荐算法", "个性化推荐", "信息推送", "自动化决策", "推荐系统", "信息流", "用户标签"], severity: "critical" }
        ],
        keywords: ["个性化推荐", "关闭选项", "自动化决策", "用户标签", "推送"],
        dataStatus: "verified"
      },
      {
        id: "ndsm-art-55",
        regulationId: "reg-ndsm-2024",
        articleOrder: 13,
        articleNumber: "第55条",
        title: "法律责任",
        content: "违反本条例第十二条、第十六条至第二十条、第二十二条、第四十条第一款和第二款、第四十一条、第四十二条规定的，由网信、电信、公安等主管部门依据各自职责责令改正，给予警告，没收违法所得；拒不改正或者情节严重的，处100万元以下罚款，并可以责令暂停相关业务、停业整顿、吊销相关业务许可证或者吊销营业执照，对直接负责的主管人员和其他直接责任人员可以处1万元以上10万元以下罚款。",
        obligations: [
          { type: "mandatory", target: "合规义务", triggerKeywords: ["数据处理", "个人信息", "AI服务", "推荐算法", "个性化推荐"], severity: "high" }
        ],
        penalty: {
          type: "fine",
          description: "违反核心义务条款",
          statutoryPenalty: "责令改正，给予警告，没收违法所得；拒不改正或情节严重的，处100万元以下罚款，可责令暂停相关业务、停业整顿、吊销相关业务许可证或营业执照；对直接责任人处1-10万元罚款"
        },
        keywords: ["法律责任", "罚款", "停业整顿", "吊销许可"],
        dataStatus: "verified"
      },
      {
        id: "ndsm-art-62",
        regulationId: "reg-ndsm-2024",
        articleOrder: 14,
        articleNumber: "第62条",
        title: "术语定义",
        content: "重要数据，是指特定领域、特定群体、特定区域或者达到一定精度和规模，一旦遭到篡改、破坏、泄露或者非法获取、非法利用，可能直接危害国家安全、经济运行、社会稳定、公共健康和安全的数据。大型网络平台，是指注册用户5000万以上或者月活跃用户1000万以上，业务类型复杂，网络数据处理活动对国家安全、经济运行、国计民生等具有重要影响的网络平台。",
        obligations: [],
        keywords: ["重要数据", "大型网络平台", "5000万", "定义"],
        dataStatus: "verified"
      }
    ]
  },

  // ========== 8. 未成年人网络保护条例 [待补充条款] ==========
  {
    id: "reg-minor-net-2023",
    title: "未成年人网络保护条例",
    shortTitle: "未成年人网络保护条例",
    issuingBody: "国务院",
    lawType: "administrative_regulation",
    legalLevel: "regulation",
    publishDate: "2023-09-20",
    effectiveDate: "2024-01-01",
    status: "effective",
    category: "consumer",
    subCategory: "行政法规",
    industry: "未成年人保护",
    crossBorderLevel: "★",
    keywords: ["未成年人", "儿童", "个人信息", "算法推荐", "网络保护", "防沉迷"],
    summary: "14岁以下儿童个人信息强化保护，平台算法推荐限制，涉及未成年用户的出海产品须注意。",
    source: "excel",
    articles: [metadataArticle("reg-minor-net-2023", 1, "未成年人个人信息强化保护与算法推荐限制")]
  },

  // ========== 9. 人类遗传资源管理条例 [待补充条款] ==========
  {
    id: "reg-hgr-2019",
    title: "人类遗传资源管理条例",
    shortTitle: "人类遗传资源管理条例",
    issuingBody: "国务院",
    lawType: "administrative_regulation",
    legalLevel: "regulation",
    publishDate: "2019-07-01",
    effectiveDate: "2019-07-01",
    status: "effective",
    category: "biosafety",
    subCategory: "行政法规",
    industry: "医疗健康/生物科技",
    crossBorderLevel: "★★",
    keywords: ["人类遗传资源", "出境审批", "科技部", "生物医药", "对外合作"],
    summary: "出境须科技部审批，对外合作须备案，出海生物医药企业核心合规要求（2019年颁布，本期延续适用）。",
    source: "excel",
    articles: [metadataArticle("reg-hgr-2019", 1, "人类遗传资源出境审批与对外合作备案")]
  },

  // ═══════════════════════════════════════════════════════════
  // 第三部分：部门规章 (Departmental Rule) — 21 部
  // ═══════════════════════════════════════════════════════════

  // ========== 10. 网络安全审查办法 [条款已录入，已验证] ==========
  {
    id: "reg-csr-2022",
    title: "网络安全审查办法（2022年修订版）",
    shortTitle: "网络安全审查办法",
    documentNumber: "国家互联网信息办公室等13部门令第8号",
    issuingBody: "国家网信办等13部门联合",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2021-12-28",
    effectiveDate: "2022-02-15",
    status: "effective",
    category: "cybersecurity",
    subCategory: "部门规章",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["网络安全审查", "境外上市", "IPO", "100万用户", "VIE", "数据安全", "关键信息基础设施"],
    summary: "掌握100万以上用户数据赴国外上市须强制申报审查，VIE结构出海核心红线。来源：https://www.gov.cn/zhengce/zhengceku/2022-01/04/content_5666430.htm",
    source: "gov.cn_official",
    articles: [
      {
        id: "csr-art-2",
        regulationId: "reg-csr-2022",
        articleOrder: 1,
        articleNumber: "第2条",
        title: "适用范围",
        content: "关键信息基础设施运营者采购网络产品和服务，网络平台运营者开展数据处理活动，影响或者可能影响国家安全的，应当按照本办法进行网络安全审查。",
        obligations: [
          { type: "mandatory", target: "网络安全审查适用范围", triggerKeywords: ["关键信息基础设施", "CII", "网络平台", "数据处理"], severity: "high" }
        ],
        keywords: ["适用范围", "CII", "网络平台", "国家安全"],
        dataStatus: "verified"
      },
      {
        id: "csr-art-7",
        regulationId: "reg-csr-2022",
        articleOrder: 2,
        articleNumber: "第7条",
        title: "境外上市强制申报",
        content: "掌握超过100万用户个人信息的网络平台运营者赴国外上市，必须向网络安全审查办公室申报网络安全审查。",
        obligations: [
          { type: "mandatory", target: "境外上市前安全审查", triggerKeywords: ["境外上市", "IPO", "赴美上市", "赴港上市", "融资", "VIE", "100万用户"], severity: "critical" }
        ],
        penalty: {
          type: "administrative_penalty",
          description: "未申报网络安全审查赴境外上市",
          statutoryPenalty: "依照《中华人民共和国网络安全法》、《中华人民共和国数据安全法》的规定处理"
        },
        keywords: ["境外上市", "100万用户", "强制申报", "IPO"],
        dataStatus: "verified"
      },
      {
        id: "csr-art-10",
        regulationId: "reg-csr-2022",
        articleOrder: 3,
        articleNumber: "第10条",
        title: "审查重点",
        content: "网络安全审查重点评估以下国家安全风险因素：产品和服务使用后带来的关键信息基础设施被非法控制、干扰或破坏的风险；供应中断对业务连续性的危害；产品和服务安全性、开放性、透明性及供应链可靠性；遵守中国法律法规情况；核心数据、重要数据或大量个人信息被窃取、泄露、非法出境的风险；上市存在关键信息基础设施、核心数据、重要数据或大量个人信息被外国政府影响、控制、恶意利用的风险等。",
        obligations: [
          { type: "procedural", target: "安全审查评估因素", triggerKeywords: ["网络安全审查", "海外上市", "数据出境", "外国政府"], severity: "high" }
        ],
        keywords: ["审查重点", "供应链", "外国政府", "国家安全"],
        dataStatus: "verified"
      },
      {
        id: "csr-art-11-14",
        regulationId: "reg-csr-2022",
        articleOrder: 4,
        articleNumber: "第11-14条",
        title: "审查程序与期限",
        content: "初步审查应当在30个工作日内完成（可延长15个工作日）；工作机制成员单位和相关部门应当在15个工作日内书面回复意见；特别审查程序一般应当在90个工作日内完成（情况复杂可延长）。",
        obligations: [
          { type: "procedural", target: "审查期限", triggerKeywords: ["网络安全审查", "审查期限"], severity: "medium" }
        ],
        keywords: ["审查程序", "30个工作日", "90个工作日", "特别审查"],
        dataStatus: "verified"
      }
    ]
  },

  // ========== 11. 互联网信息服务算法推荐管理规定 [条款已录入] ==========
  {
    id: "reg-algo-2022",
    title: "互联网信息服务算法推荐管理规定",
    shortTitle: "算法推荐管理规定",
    documentNumber: "国家互联网信息办公室令第9号",
    issuingBody: "国家网信办、工信部、公安部、市场监管总局",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2022-01-04",
    effectiveDate: "2022-03-01",
    status: "effective",
    category: "ai",
    subCategory: "部门规章",
    industry: "互联网/AI",
    crossBorderLevel: "★",
    keywords: ["算法推荐", "算法备案", "透明度", "用户选择权", "推荐系统"],
    summary: "规制算法推荐系统，要求透明度和用户选择权，出海算法产品须关注。",
    source: "excel+public",
    articles: [
      {
        id: "algo-art-4",
        regulationId: "reg-algo-2022",
        articleOrder: 1,
        articleNumber: "第4条",
        title: "算法推荐基本原则",
        content: "提供算法推荐服务，应当遵守法律法规，尊重社会公德和伦理，遵守商业道德和职业道德，遵循公正公平、公开透明、科学合理和诚实信用的原则。",
        obligations: [
          { type: "mandatory", target: "算法透明与公正", triggerKeywords: ["推荐算法", "内容推荐", "个性化推荐", "推荐系统", "信息流"], severity: "high" }
        ],
        keywords: ["算法推荐", "公正公平", "透明度", "原则"]
      },
      {
        id: "algo-art-7",
        regulationId: "reg-algo-2022",
        articleOrder: 2,
        articleNumber: "第7条",
        title: "用户标签管理义务",
        content: "算法推荐服务提供者应当以显著方式告知用户其提供算法推荐服务的情况，并以适当方式公示算法推荐服务的基本原理、目的意图和主要运行机制等。",
        obligations: [
          { type: "mandatory", target: "算法公示与知情权", triggerKeywords: ["推荐算法", "个性化推荐", "算法推送", "内容分发", "智能推荐"], severity: "high" }
        ],
        penalty: {
          type: "fine",
          description: "未履行公示义务",
          statutoryPenalty: "给予警告，通报批评，责令限期改正；拒不改正或者情节严重的，责令暂停信息更新，处一万元以上十万元以下罚款"
        },
        keywords: ["算法公示", "知情权", "用户告知", "透明"]
      },
      {
        id: "algo-art-8",
        regulationId: "reg-algo-2022",
        articleOrder: 3,
        articleNumber: "第8条",
        title: "用户选择权与退出机制",
        content: "算法推荐服务提供者应当向用户提供不针对其个人特征的选项，或者向用户提供便捷的关闭算法推荐服务的选项。",
        obligations: [
          { type: "mandatory", target: "用户选择退出权", triggerKeywords: ["推荐算法", "个性化推荐", "算法推送", "推荐系统", "信息流"], severity: "critical" }
        ],
        penalty: {
          type: "fine",
          description: "未提供关闭选项",
          statutoryPenalty: "给予警告，通报批评，责令限期改正；拒不改正或者情节严重的，责令暂停信息更新，处一万元以上十万元以下罚款"
        },
        keywords: ["选择退出", "用户选择权", "关闭推荐", "个人信息"]
      }
    ]
  },

  // ========== 12. 数据出境安全评估办法 [条款已录入，已验证] ==========
  {
    id: "reg-dces-2022",
    title: "数据出境安全评估办法",
    shortTitle: "数据出境安全评估办法",
    documentNumber: "国家互联网信息办公室令第11号",
    issuingBody: "国家网信办",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2022-07-07",
    effectiveDate: "2022-09-01",
    status: "effective",
    category: "cross-border",
    subCategory: "部门规章",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["数据出境", "安全评估", "申报审批", "百万级", "重要数据", "2年有效期"],
    summary: "三大出境路径之一（申报审批），适用百万级个人信息/重要数据出境场景。来源：https://www.gov.cn/zhengce/zhengceku/2022-07/08/content_5699851.htm",
    source: "gov.cn_official",
    articles: [
      {
        id: "dces-art-4",
        regulationId: "reg-dces-2022",
        articleOrder: 1,
        articleNumber: "第4条",
        title: "安全评估强制适用情形",
        content: "数据处理者向境外提供数据，有下列情形之一的，应当通过所在地省级网信部门向国家网信部门申报数据出境安全评估：（一）数据处理者向境外提供重要数据；（二）关键信息基础设施运营者和处理100万人以上个人信息的数据处理者向境外提供个人信息；（三）自上年1月1日起累计向境外提供10万人个人信息或者1万人敏感个人信息的数据处理者向境外提供个人信息；（四）国家网信部门规定的其他需要申报数据出境安全评估的情形。",
        obligations: [
          { type: "mandatory", target: "数据出境安全评估申报", triggerKeywords: ["数据出境", "跨境", "境外传输", "海外存储", "出海", "重要数据", "100万个人信息"], severity: "critical" }
        ],
        keywords: ["数据出境", "安全评估", "100万", "10万人", "1万敏感", "CII"],
        dataStatus: "verified"
      },
      {
        id: "dces-art-5",
        regulationId: "reg-dces-2022",
        articleOrder: 2,
        articleNumber: "第5条",
        title: "数据出境风险自评估",
        content: "数据处理者在申报数据出境安全评估前，应当开展数据出境风险自评估，重点评估：数据出境和境外接收方处理数据的合法性、正当性、必要性；出境数据的规模、范围、种类、敏感程度及可能带来的风险；境外接收方承担的责任义务和管理技术措施能否保障出境数据安全；数据出境后遭到篡改、破坏、泄露等风险；与境外接收方订立的法律文件是否充分约定了安全保护责任义务等。",
        obligations: [
          { type: "mandatory", target: "数据出境风险自评估", triggerKeywords: ["数据出境", "跨境", "海外存储", "境外接收方"], severity: "high" }
        ],
        keywords: ["自评估", "风险", "境外接收方", "法律文件"],
        dataStatus: "verified"
      },
      {
        id: "dces-art-14",
        regulationId: "reg-dces-2022",
        articleOrder: 3,
        articleNumber: "第14条",
        title: "评估结果有效期与重新申报",
        content: "通过数据出境安全评估的结果有效期为2年，自评估结果出具之日起计算。在有效期内出现以下情形之一的，数据处理者应当重新申报评估：（一）向境外提供数据的目的、方式、范围、种类和境外接收方处理数据的用途、方式发生变化影响出境数据安全的，或者延长个人信息和重要数据境外保存期限的；（二）境外接收方所在国家或者地区数据安全保护政策法规和网络安全环境发生变化等影响出境数据安全的；（三）出现影响出境数据安全的其他情形。有效期届满，需要继续开展数据出境活动的，应当在有效期届满60个工作日前重新申报评估。",
        obligations: [
          { type: "conditional", target: "2年有效期+变更重评", triggerKeywords: ["数据出境", "安全评估", "变更", "有效期"], severity: "high" }
        ],
        keywords: ["有效期", "2年", "重新评估", "变更", "60个工作日"],
        dataStatus: "verified"
      }
    ]
  },

  // ========== 13. 互联网信息服务深度合成管理规定 [条款已录入] ==========
  {
    id: "reg-deep-syn-2023",
    title: "互联网信息服务深度合成管理规定",
    shortTitle: "深度合成管理规定",
    documentNumber: "国家互联网信息办公室令第12号",
    issuingBody: "国家网信办、工信部、公安部",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2022-11-25",
    effectiveDate: "2023-01-10",
    status: "effective",
    category: "ai",
    subCategory: "部门规章",
    industry: "互联网/AI",
    crossBorderLevel: "★",
    keywords: ["深度合成", "Deepfake", "AIGC", "标识", "合成内容", "内容管理"],
    summary: "Deepfake/AIGC内容标识义务，出海AI内容平台须遵守。",
    source: "excel+public",
    articles: [
      {
        id: "deep-syn-art-13",
        regulationId: "reg-deep-syn-2023",
        articleOrder: 1,
        articleNumber: "第13条",
        title: "算法备案义务",
        content: "深度合成服务提供者应当按照国家有关规定开展安全评估，并按照《互联网信息服务算法推荐管理规定》履行算法备案手续。",
        obligations: [
          { type: "mandatory", target: "安全评估+算法备案", triggerKeywords: ["深度合成", "AI合成", "换脸", "语音合成", "AI生成内容", "AIGC", "深度伪造"], severity: "critical" }
        ],
        keywords: ["安全评估", "算法备案", "深度合成", "AI"]
      },
      {
        id: "deep-syn-art-14",
        regulationId: "reg-deep-syn-2023",
        articleOrder: 2,
        articleNumber: "第14条",
        title: "内容标识义务",
        content: "深度合成服务提供者和使用者应当按照国家有关规定和标准，对深度合成信息内容进行标识，告知公众该信息为深度合成。",
        obligations: [
          { type: "mandatory", target: "AI内容标识", triggerKeywords: ["深度合成", "AI生成", "AIGC", "合成内容", "内容标识", "水印", "AI创作"], severity: "high" },
          { type: "mandatory", target: "AI内容标识", triggerKeywords: ["生成式AI", "大模型生成", "AI绘画", "AI写作", "数字人"], severity: "high" }
        ],
        penalty: {
          type: "fine",
          description: "未进行内容标识",
          statutoryPenalty: "给予警告，通报批评，责令限期改正；拒不改正或者情节严重的，责令暂停信息更新，处一万元以上十万元以下罚款"
        },
        keywords: ["内容标识", "深度合成", "AIGC", "标签", "告知"]
      },
      {
        id: "deep-syn-art-15",
        regulationId: "reg-deep-syn-2023",
        articleOrder: 3,
        articleNumber: "第15条",
        title: "内容审核义务",
        content: "深度合成服务提供者应当加强深度合成技术管理，定期审核、评估、验证生成合成类算法机制机理。深度合成服务提供者发现违法和不良信息的，应当依法采取处置措施，保存有关记录，并向网信部门和有关主管部门报告。",
        obligations: [
          { type: "mandatory", target: "内容审核", triggerKeywords: ["AI生成", "AIGC", "深度合成", "内容审核", "违法信息"], severity: "critical" }
        ],
        keywords: ["内容审核", "算法审核", "违法信息", "处置"]
      }
    ]
  },

  // ========== 14. 移动互联网应用程序信息服务管理规定 [待补充条款] ==========
  {
    id: "reg-app-2022",
    title: "移动互联网应用程序信息服务管理规定（修订）",
    shortTitle: "App信息服务管理规定",
    issuingBody: "国家网信办",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2022-06-14",
    effectiveDate: "2022-08-01",
    status: "effective",
    category: "consumer",
    subCategory: "部门规章",
    industry: "互联网",
    crossBorderLevel: "★",
    keywords: ["App", "个人信息收集", "分发平台", "应用程序"],
    summary: "App收集个人信息规范，分发平台责任强化。",
    source: "excel",
    articles: [metadataArticle("reg-app-2022", 1, "App个人信息收集规范与分发平台责任")]
  },

  // ========== 15. 互联网用户账号信息管理规定 [待补充条款] ==========
  {
    id: "reg-account-2022",
    title: "互联网用户账号信息管理规定",
    shortTitle: "用户账号信息规定",
    issuingBody: "国家网信办",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2022-06-27",
    effectiveDate: "2022-08-01",
    status: "effective",
    category: "consumer",
    subCategory: "部门规章",
    industry: "互联网",
    crossBorderLevel: "—",
    keywords: ["账号", "实名", "信息管理", "平台"],
    summary: "账号信息真实性管理，平台内容治理要求。",
    source: "excel",
    articles: [metadataArticle("reg-account-2022", 1, "账号信息真实性管理与平台治理")]
  },

  // ========== 16. 互联网弹窗信息推送服务管理规定 [待补充条款] ==========
  {
    id: "reg-popup-2022",
    title: "互联网弹窗信息推送服务管理规定",
    shortTitle: "弹窗推送规定",
    issuingBody: "国家网信办、工信部、国家广播电视总局",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2022-09-09",
    effectiveDate: "2022-09-30",
    status: "effective",
    category: "consumer",
    subCategory: "部门规章",
    industry: "互联网",
    crossBorderLevel: "—",
    keywords: ["弹窗", "推送", "广告", "内容管理"],
    summary: "弹窗广告/内容推送合规义务。",
    source: "excel",
    articles: [metadataArticle("reg-popup-2022", 1, "弹窗广告与内容推送合规义务")]
  },

  // ========== 17. 个人信息出境标准合同办法 [条款已录入，已验证] ==========
  {
    id: "reg-pe-sc-2023",
    title: "个人信息出境标准合同办法",
    shortTitle: "个人信息出境标准合同办法",
    documentNumber: "国家互联网信息办公室令第13号",
    issuingBody: "国家网信办",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2023-02-24",
    effectiveDate: "2023-06-01",
    status: "effective",
    category: "cross-border",
    subCategory: "部门规章",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["个人信息出境", "标准合同", "备案", "中小企业", "跨境传输", "影响评估"],
    summary: "三大出境路径之二（标准合同），10个工作日内备案，适用中小规模跨境传输。注意：已被2024年数据跨境流动规定调整了适用阈值。来源：https://www.gov.cn/zhengce/202311/content_6917770.htm",
    source: "gov.cn_official",
    articles: [
      {
        id: "pe-sc-art-4",
        regulationId: "reg-pe-sc-2023",
        articleOrder: 1,
        articleNumber: "第4条",
        title: "适用条件（四条件同时满足）",
        content: "个人信息处理者通过订立标准合同的方式向境外提供个人信息的，应当同时符合下列情形：（一）非关键信息基础设施运营者；（二）处理个人信息不满100万人；（三）自上年1月1日起累计向境外提供个人信息不满10万人；（四）自上年1月1日起累计向境外提供敏感个人信息不满1万人。个人信息处理者不得采取数量拆分等手段，将依法应当通过出境安全评估的个人信息通过订立标准合同的方式向境外提供。",
        obligations: [
          { type: "conditional", target: "标准合同路径适用", triggerKeywords: ["个人信息出境", "标准合同", "中小企业", "不满100万", "不满10万"], severity: "high" }
        ],
        keywords: ["标准合同", "适用条件", "非CII", "不满100万", "不满10万", "不满1万敏感"],
        dataStatus: "verified"
      },
      {
        id: "pe-sc-art-5",
        regulationId: "reg-pe-sc-2023",
        articleOrder: 2,
        articleNumber: "第5条",
        title: "个人信息保护影响评估",
        content: "个人信息处理者向境外提供个人信息前，应当开展个人信息保护影响评估，重点评估：处理个人信息的目的、范围、方式等的合法性、正当性、必要性；出境个人信息的规模、范围、种类、敏感程度及可能对个人信息权益带来的风险；境外接收方承诺承担的义务及管理和技术措施能否保障出境个人信息安全；个人信息出境后遭到篡改、破坏、泄露等风险；境外接收方所在国家或地区的个人信息保护政策和法规对标准合同履行的影响等。",
        obligations: [
          { type: "mandatory", target: "个人信息保护影响评估", triggerKeywords: ["个人信息出境", "标准合同", "影响评估", "跨境"], severity: "high" }
        ],
        keywords: ["影响评估", "个人信息", "风险", "境外接收方"],
        dataStatus: "verified"
      },
      {
        id: "pe-sc-art-7",
        regulationId: "reg-pe-sc-2023",
        articleOrder: 3,
        articleNumber: "第7条",
        title: "备案要求",
        content: "个人信息处理者应当在标准合同生效之日起10个工作日内向所在地省级网信部门备案。备案应当提交以下材料：（一）标准合同；（二）个人信息保护影响评估报告。个人信息处理者应当对所备案材料的真实性负责。",
        obligations: [
          { type: "mandatory", target: "标准合同备案", triggerKeywords: ["个人信息出境", "标准合同", "备案", "10个工作日"], severity: "high" }
        ],
        keywords: ["备案", "10个工作日", "省级网信", "真实性"],
        dataStatus: "verified"
      },
      {
        id: "pe-sc-art-8",
        regulationId: "reg-pe-sc-2023",
        articleOrder: 4,
        articleNumber: "第8条",
        title: "变更复评与重新备案",
        content: "在标准合同有效期内出现下列情形之一的，个人信息处理者应当重新开展个人信息保护影响评估，补充或者重新订立标准合同，并履行相应备案手续：（一）向境外提供个人信息的目的、范围、种类、敏感程度、方式、保存地点或者境外接收方处理个人信息的用途、方式发生变化，或者延长个人信息境外保存期限的；（二）境外接收方所在国家或者地区的个人信息保护政策和法规发生变化等可能影响个人信息权益的；（三）可能影响个人信息权益的其他情形。",
        obligations: [
          { type: "conditional", target: "变更复评", triggerKeywords: ["个人信息出境", "标准合同", "变更", "重新备案"], severity: "high" }
        ],
        keywords: ["变更", "重新评估", "重新备案", "境外政策变化"],
        dataStatus: "verified"
      }
    ]
  },

  // ========== 18. 生成式人工智能服务管理暂行办法 [条款已录入] ==========
  {
    id: "reg-gen-ai-2023",
    title: "生成式人工智能服务管理暂行办法",
    shortTitle: "生成式AI暂行办法",
    documentNumber: "国家互联网信息办公室令第15号",
    issuingBody: "国家网信办等7部门",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2023-07-13",
    effectiveDate: "2023-08-15",
    status: "effective",
    category: "ai",
    subCategory: "部门规章",
    industry: "AI",
    crossBorderLevel: "★★",
    keywords: ["生成式AI", "大模型", "备案", "安全评估", "训练数据", "内容标识"],
    summary: "全球首部生成式AI专项监管规章，安全评估+算法备案，向中国境内用户提供AIGC服务须遵守。",
    source: "excel+public",
    articles: [
      {
        id: "gen-ai-art-3",
        regulationId: "reg-gen-ai-2023",
        articleOrder: 1,
        articleNumber: "第3条",
        title: "基本原则",
        content: "国家坚持发展和安全并重、促进创新和依法治理相结合的原则，采取有效措施鼓励生成式人工智能创新发展，对生成式人工智能服务实行包容审慎和分类分级监管。",
        obligations: [
          { type: "conditional", target: "分类分级监管要求", triggerKeywords: ["生成式AI", "AI服务", "人工智能"], severity: "medium" }
        ],
        keywords: ["基本原则", "分类分级", "包容审慎"]
      },
      {
        id: "gen-ai-art-4",
        regulationId: "reg-gen-ai-2023",
        articleOrder: 2,
        articleNumber: "第4条",
        title: "安全评估与算法备案义务",
        content: "提供具有舆论属性或者社会动员能力的生成式人工智能服务的，应当按照国家有关规定开展安全评估，并按照《互联网信息服务算法推荐管理规定》履行算法备案手续。",
        obligations: [
          { type: "mandatory", target: "安全评估", triggerKeywords: ["生成式AI", "舆论属性", "社会动员", "LLM", "大语言模型", "GPT", "大模型", "AI服务"], severity: "critical" },
          { type: "mandatory", target: "算法备案", triggerKeywords: ["生成式AI", "推荐算法", "算法服务", "AI服务"], severity: "critical" }
        ],
        penalty: {
          type: "fine",
          description: "未开展安全评估或算法备案",
          statutoryPenalty: "给予警告，通报批评，责令限期改正；拒不改正或者情节严重的，责令暂停信息更新，处一万元以上十万元以下罚款"
        },
        keywords: ["安全评估", "算法备案", "生成式AI", "备案"]
      },
      {
        id: "gen-ai-art-7",
        regulationId: "reg-gen-ai-2023",
        articleOrder: 3,
        articleNumber: "第7条",
        title: "训练数据合规要求",
        content: "生成式人工智能服务提供者应当依法开展预训练、优化训练等训练数据处理活动。使用具有合法来源的数据和基础模型；涉及知识产权的，不得侵害他人依法享有的知识产权；涉及个人信息的，应当取得个人同意或者符合法律、行政法规规定的其他情形。",
        obligations: [
          { type: "mandatory", target: "训练数据合规", triggerKeywords: ["训练数据", "数据采集", "模型训练", "预训练", "数据集", "语料"], severity: "critical" },
          { type: "prohibitive", target: "禁止侵权数据", triggerKeywords: ["知识产权", "版权", "著作权", "专利", "爬虫"], severity: "critical" }
        ],
        keywords: ["训练数据", "合法来源", "知识产权", "个人信息", "数据合规"]
      },
      {
        id: "gen-ai-art-8",
        regulationId: "reg-gen-ai-2023",
        articleOrder: 4,
        articleNumber: "第8条",
        title: "生成内容标注义务",
        content: "生成式人工智能服务提供者和使用者应当按照国家有关规定和标准，对人工智能生成内容进行标注。",
        obligations: [
          { type: "mandatory", target: "AIGC内容标注", triggerKeywords: ["AI生成", "AIGC", "AI写作", "AI绘画", "ChatGPT", "AI输出", "生成内容"], severity: "critical" }
        ],
        penalty: {
          type: "fine",
          description: "未标注AI生成内容",
          statutoryPenalty: "给予警告，通报批评，责令限期改正；拒不改正或者情节严重的，责令暂停信息更新，处一万元以上十万元以下罚款"
        },
        keywords: ["内容标注", "AIGC", "生成内容", "标识"]
      },
      {
        id: "gen-ai-art-9",
        regulationId: "reg-gen-ai-2023",
        articleOrder: 5,
        articleNumber: "第9条",
        title: "内容安全与合规义务",
        content: "生成式人工智能服务提供者应当依法承担网络信息内容生产者责任，履行网络信息安全义务。涉及个人信息的，依法承担个人信息处理者责任。提供者应当按照有关规定与使用者签订服务协议，明确双方权利义务。",
        obligations: [
          { type: "mandatory", target: "内容安全责任", triggerKeywords: ["AI内容", "生成内容", "内容审核", "违法信息"], severity: "critical" }
        ],
        keywords: ["内容安全", "生产者责任", "服务协议", "个人信息处理者"]
      },
      {
        id: "gen-ai-art-11",
        regulationId: "reg-gen-ai-2023",
        articleOrder: 6,
        articleNumber: "第11条",
        title: "透明度与投诉机制",
        content: "生成式人工智能服务提供者应当及时受理和处理个人关于个人信息查阅、复制、更正、删除等的请求；发现、知悉生成的文本、图片、声音、视频等侵害他人肖像权、名誉权、个人隐私或者个人信息权益的，应当及时采取停止生成、停止传输、消除等处置措施，保存有关记录，并向有关部门报告。",
        obligations: [
          { type: "mandatory", target: "透明度与投诉机制", triggerKeywords: ["AI生成", "用户投诉", "个人信息", "侵权"], severity: "high" }
        ],
        penalty: {
          type: "fine",
          description: "未及时处理用户权利请求或侵权投诉",
          statutoryPenalty: "给予警告，通报批评，责令限期改正；拒不改正或者情节严重的，责令暂停信息更新，处一万元以上十万元以下罚款"
        },
        keywords: ["投诉机制", "用户权利", "侵权", "透明度"]
      }
    ]
  },

  // ========== 19. 促进和规范数据跨境流动规定 [条款已录入，已验证] ==========
  {
    id: "reg-cbdf-2024",
    title: "促进和规范数据跨境流动规定",
    shortTitle: "数据跨境流动规定",
    documentNumber: "国家互联网信息办公室令第16号",
    issuingBody: "国家网信办",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2024-03-22",
    effectiveDate: "2024-03-22",
    status: "effective",
    category: "cross-border",
    subCategory: "部门规章",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["数据跨境", "豁免", "自贸区", "负面清单", "10万人", "松绑", "3年有效期"],
    summary: "重大松绑：非敏感个人信息不足10万人免报，引入自贸区负面清单豁免机制，安全评估有效期延长至3年。出海核心依据。来源：https://www.gov.cn/zhengce/202501/content_6997438.htm",
    source: "gov.cn_official",
    articles: [
      {
        id: "cbdf-art-2",
        regulationId: "reg-cbdf-2024",
        articleOrder: 1,
        articleNumber: "第2条",
        title: "重要数据识别规则",
        content: "数据处理者应当按照相关规定识别、申报重要数据。未被相关部门、地区告知或者公开发布为重要数据的，数据处理者不需要作为重要数据申报数据出境安全评估。",
        obligations: [
          { type: "conditional", target: "重要数据出境豁免条件", triggerKeywords: ["重要数据", "数据出境", "跨境", "安全评估"], severity: "high" }
        ],
        keywords: ["重要数据", "识别", "告知", "公开发布"],
        dataStatus: "verified"
      },
      {
        id: "cbdf-art-3",
        regulationId: "reg-cbdf-2024",
        articleOrder: 2,
        articleNumber: "第3条",
        title: "常规商业活动数据出境豁免",
        content: "国际贸易、跨境运输、学术合作、跨国生产制造和市场营销等活动中收集和产生的数据向境外提供，不包含个人信息或者重要数据的，免予申报数据出境安全评估、订立个人信息出境标准合同、通过个人信息保护认证。",
        obligations: [
          { type: "conditional", target: "商业数据出境豁免", triggerKeywords: ["国际贸易", "学术合作", "市场营销", "数据出境", "跨境"], severity: "medium" }
        ],
        keywords: ["豁免", "商业活动", "不含个人信息", "不含重要数据"],
        dataStatus: "verified"
      },
      {
        id: "cbdf-art-5",
        regulationId: "reg-cbdf-2024",
        articleOrder: 3,
        articleNumber: "第5条",
        title: "个人信息出境豁免情形",
        content: "数据处理者向境外提供个人信息，符合下列条件之一的，免予申报数据出境安全评估、订立个人信息出境标准合同、通过个人信息保护认证：（一）为订立、履行个人作为一方当事人的合同（跨境购物、寄递、汇款、支付、开户、机票酒店预订、签证办理、考试服务等）确需向境外提供个人信息的；（二）按照依法制定的劳动规章制度和依法签订的集体合同实施跨境人力资源管理确需向境外提供员工个人信息的；（三）紧急情况下为保护自然人的生命健康和财产安全确需向境外提供个人信息的；（四）关键信息基础设施运营者以外的数据处理者自当年1月1日起累计向境外提供不满10万人个人信息（不含敏感个人信息）的。",
        obligations: [
          { type: "conditional", target: "个人信息出境豁免", triggerKeywords: ["个人信息出境", "跨境合同", "跨境购物", "跨境支付", "人力资源管理", "不满10万人", "非敏感"], severity: "high" }
        ],
        keywords: ["豁免", "个人信息", "合同必需", "HR", "紧急", "不满10万"],
        dataStatus: "verified"
      },
      {
        id: "cbdf-art-6",
        regulationId: "reg-cbdf-2024",
        articleOrder: 4,
        articleNumber: "第6条",
        title: "自贸区负面清单豁免机制",
        content: "自由贸易试验区在国家数据分类分级保护制度框架下，可以自行制定区内需要纳入数据出境安全评估、个人信息出境标准合同、个人信息保护认证管理范围的数据清单（负面清单），经省级网络安全和信息化委员会批准后，报国家网信部门、国家数据管理部门备案。自贸区内数据处理者向境外提供负面清单外的数据，可以免予申报数据出境安全评估、订立个人信息出境标准合同、通过个人信息保护认证。",
        obligations: [
          { type: "conditional", target: "自贸区负面清单豁免", triggerKeywords: ["自贸区", "负面清单", "数据出境", "豁免", "上海", "天津", "北京", "临港"], severity: "high" }
        ],
        keywords: ["自贸区", "负面清单", "豁免", "备案"],
        dataStatus: "verified"
      },
      {
        id: "cbdf-art-7",
        regulationId: "reg-cbdf-2024",
        articleOrder: 5,
        articleNumber: "第7条",
        title: "安全评估触发条件（新阈值）",
        content: "数据处理者向境外提供数据，符合下列条件之一的，应当申报数据出境安全评估：（一）关键信息基础设施运营者向境外提供个人信息或者重要数据；（二）关键信息基础设施运营者以外的数据处理者向境外提供重要数据，或者自当年1月1日起累计向境外提供100万人以上个人信息（不含敏感个人信息）或者1万人以上敏感个人信息。",
        obligations: [
          { type: "mandatory", target: "安全评估强制申报", triggerKeywords: ["CII", "关键信息基础设施", "100万个人信息", "1万敏感", "重要数据", "数据出境"], severity: "critical" }
        ],
        keywords: ["安全评估", "100万", "1万敏感", "CII", "重要数据"],
        dataStatus: "verified"
      },
      {
        id: "cbdf-art-8",
        regulationId: "reg-cbdf-2024",
        articleOrder: 6,
        articleNumber: "第8条",
        title: "标准合同/认证路径触发条件",
        content: "关键信息基础设施运营者以外的数据处理者自当年1月1日起累计向境外提供10万人以上、不满100万人个人信息（不含敏感个人信息）或者不满1万人敏感个人信息的，应当依法与境外接收方订立个人信息出境标准合同或者通过个人信息保护认证。",
        obligations: [
          { type: "conditional", target: "标准合同/认证路径", triggerKeywords: ["个人信息出境", "标准合同", "认证", "10万-100万", "跨境"], severity: "high" }
        ],
        keywords: ["标准合同", "认证", "10万", "100万"],
        dataStatus: "verified"
      },
      {
        id: "cbdf-art-9",
        regulationId: "reg-cbdf-2024",
        articleOrder: 7,
        articleNumber: "第9条",
        title: "评估有效期延长至3年",
        content: "通过数据出境安全评估的结果有效期为3年，自评估结果出具之日起计算。有效期届满且未发生需要重新申报情形的，可以在有效期届满前60个工作日内申请延长3年。",
        obligations: [
          { type: "conditional", target: "3年有效期", triggerKeywords: ["数据出境", "安全评估", "有效期", "续期"], severity: "medium" }
        ],
        keywords: ["有效期", "3年", "延长", "60个工作日"],
        dataStatus: "verified"
      },
      {
        id: "cbdf-art-13",
        regulationId: "reg-cbdf-2024",
        articleOrder: 8,
        articleNumber: "第13条",
        title: "规则优先适用",
        content: "2022年7月7日公布的《数据出境安全评估办法》（国家互联网信息办公室令第11号）、2023年2月22日公布的《个人信息出境标准合同办法》（国家互联网信息办公室令第13号）等相关规定与本规定不一致的，适用本规定。",
        obligations: [
          { type: "procedural", target: "新规优先适用", triggerKeywords: ["数据出境", "安全评估", "标准合同"], severity: "high" }
        ],
        keywords: ["优先适用", "不一致", "新规"],
        dataStatus: "verified"
      }
    ]
  },

  // ========== 20. 汽车数据安全管理若干规定 [待补充条款] ==========
  {
    id: "reg-car-data-2021",
    title: "汽车数据安全管理若干规定（试行）",
    shortTitle: "汽车数据安全规定",
    issuingBody: "国家网信办、国家发改委、工信部、公安部、交通运输部",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2021-08-20",
    effectiveDate: "2021-10-01",
    status: "effective",
    category: "industry",
    subCategory: "部门规章",
    industry: "汽车",
    crossBorderLevel: "★★",
    keywords: ["汽车数据", "自动驾驶", "人脸", "位置", "境内存储", "车联网"],
    summary: "车辆采集的人脸/位置/驾驶行为等数据须境内存储，向境外提供须安全评估。",
    source: "excel",
    articles: [metadataArticle("reg-car-data-2021", 1, "汽车数据境内存储与出境安全评估")]
  },

  // ========== 21. 工业和信息化领域数据安全管理办法 [待补充条款] ==========
  {
    id: "reg-miit-data-2022",
    title: "工业和信息化领域数据安全管理办法（试行）",
    shortTitle: "工信数据安全管理办法",
    issuingBody: "工业和信息化部",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2022-11-18",
    effectiveDate: "2023-01-01",
    status: "effective",
    category: "industry",
    subCategory: "部门规章",
    industry: "工业/制造业",
    crossBorderLevel: "★",
    keywords: ["工业数据", "分类分级", "工业互联网", "智能制造", "数据安全"],
    summary: "工业数据分类分级，工业互联网、智能制造领域数据安全合规框架。",
    source: "excel",
    articles: [metadataArticle("reg-miit-data-2022", 1, "工业数据分类分级与安全管理")]
  },

  // ========== 22. 人类遗传资源管理条例实施细则 [待补充条款] ==========
  {
    id: "reg-hgr-detail-2023",
    title: "人类遗传资源管理条例实施细则",
    shortTitle: "人类遗传资源实施细则",
    issuingBody: "科学技术部",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2023-06-01",
    effectiveDate: "2023-07-01",
    status: "effective",
    category: "biosafety",
    subCategory: "部门规章",
    industry: "医疗健康/生物科技",
    crossBorderLevel: "★★",
    keywords: ["人类遗传资源", "对外提供", "审批", "备案", "生物医药"],
    summary: "细化遗传资源对外提供/合作审批/备案流程，生物医药出海核心操作规范。",
    source: "excel",
    articles: [metadataArticle("reg-hgr-detail-2023", 1, "遗传资源对外提供审批备案流程")]
  },

  // ========== 23. 证券期货业网络和信息安全管理办法 [待补充条款] ==========
  {
    id: "reg-csrc-sec-2023",
    title: "证券期货业网络和信息安全管理办法",
    shortTitle: "证券期货信息安全办法",
    issuingBody: "中国证监会",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2023-02-27",
    effectiveDate: "2023-05-01",
    status: "effective",
    category: "industry",
    subCategory: "部门规章",
    industry: "金融-证券期货",
    crossBorderLevel: "★",
    keywords: ["证券", "期货", "信息安全", "数据分级", "境外上市"],
    summary: "证券期货业数据安全分级保护，境外上市/跨境数据须评估。",
    source: "excel",
    articles: [metadataArticle("reg-csrc-sec-2023", 1, "证券期货数据安全分级与跨境评估")]
  },

  // ========== 24. 银行保险机构数据安全管理办法 [待补充条款] ==========
  {
    id: "reg-nfra-bank-2024",
    title: "银行保险机构数据安全管理办法",
    shortTitle: "银行保险数据安全办法",
    issuingBody: "国家金融监督管理总局",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2024-12-27",
    effectiveDate: "2024-12-27",
    status: "effective",
    category: "industry",
    subCategory: "部门规章",
    industry: "金融-银行保险",
    crossBorderLevel: "★★",
    keywords: ["银行", "保险", "数据安全", "全生命周期", "跨境", "金融数据"],
    summary: "银行保险机构数据全生命周期安全管理，含跨境数据专章，外资金融机构须重点关注。",
    source: "excel",
    articles: [metadataArticle("reg-nfra-bank-2024", 1, "银行保险数据全生命周期安全与跨境专章")]
  },

  // ========== 25. 中国人民银行业务领域数据安全管理办法 [待补充条款] ==========
  {
    id: "reg-pboc-data-2025",
    title: "中国人民银行业务领域数据安全管理办法",
    shortTitle: "人民银行数据安全办法",
    issuingBody: "中国人民银行",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2025-05-07",
    effectiveDate: "2025-06-30",
    status: "effective",
    category: "industry",
    subCategory: "部门规章",
    industry: "金融-银行",
    crossBorderLevel: "★★",
    keywords: ["人民银行", "支付", "金融科技", "数据安全", "跨境"],
    summary: "人民银行业务数据安全管理，含跨境数据要求，支付/金融科技出海必须关注。",
    source: "excel",
    articles: [metadataArticle("reg-pboc-data-2025", 1, "人民银行业务数据安全与跨境要求")]
  },

  // ========== 26. 自然资源领域数据安全管理办法 [待补充条款] ==========
  {
    id: "reg-nr-data-2024",
    title: "自然资源领域数据安全管理办法",
    shortTitle: "自然资源数据安全办法",
    issuingBody: "自然资源部",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2024-03-22",
    effectiveDate: "2024-03-22",
    status: "effective",
    category: "industry",
    subCategory: "部门规章",
    industry: "地图/测绘",
    crossBorderLevel: "★★",
    keywords: ["自然资源", "测绘", "地理信息", "数据安全", "出境审批"],
    summary: "测绘地理信息、自然资源数据安全，涉及地图数据出境须审批。",
    source: "excel",
    articles: [metadataArticle("reg-nr-data-2024", 1, "测绘地理信息数据出境审批")]
  },

  // ========== 27. 对外提供涉密测绘成果管理办法 [待补充条款] ==========
  {
    id: "reg-secret-mapping-2024",
    title: "对外提供涉密测绘成果管理办法",
    shortTitle: "涉密测绘管理办法",
    issuingBody: "自然资源部",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2024-07-26",
    effectiveDate: "2024-07-26",
    status: "effective",
    category: "industry",
    subCategory: "部门规章",
    industry: "地图/测绘",
    crossBorderLevel: "★★",
    keywords: ["涉密测绘", "地图", "对外提供", "审批", "自动驾驶"],
    summary: "涉密地图/测绘数据对外提供审批，影响出海地图类/自动驾驶企业。",
    source: "excel",
    articles: [metadataArticle("reg-secret-mapping-2024", 1, "涉密测绘数据对外提供审批")]
  },

  // ========== 28. 铁路关键信息基础设施安全保护管理办法 [待补充条款] ==========
  {
    id: "reg-railway-cii-2024",
    title: "铁路关键信息基础设施安全保护管理办法",
    shortTitle: "铁路关基管理办法",
    issuingBody: "交通运输部",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2024-01-03",
    effectiveDate: "2024-02-01",
    status: "effective",
    category: "industry",
    subCategory: "部门规章",
    industry: "交通运输",
    crossBorderLevel: "—",
    keywords: ["铁路", "关键信息基础设施", "安全保护"],
    summary: "铁路行业关键信息基础设施安全保护专项规定。",
    source: "excel",
    articles: [metadataArticle("reg-railway-cii-2024", 1, "铁路行业CII安全保护")]
  },

  // ========== 29. 个人信息保护合规审计管理办法 [条款已录入，已验证] ==========
  {
    id: "reg-pip-audit-2025",
    title: "个人信息保护合规审计管理办法",
    shortTitle: "个保合规审计办法",
    documentNumber: "国家互联网信息办公室令第18号",
    issuingBody: "国家网信办",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2025-02-14",
    effectiveDate: "2025-05-01",
    status: "effective",
    category: "data-privacy",
    subCategory: "部门规章",
    industry: "通用",
    crossBorderLevel: "★",
    keywords: ["合规审计", "个人信息", "1000万", "强制审计", "审计机构", "个人信息保护负责人"],
    summary: "处理超过1000万人个人信息须每两年至少一次合规审计；处理100万以上须指定个人信息保护负责人。来源：https://www.cac.gov.cn/2025-02/14/c_1741233507681519.htm",
    source: "cac.gov.cn_official",
    articles: [
      {
        id: "pip-audit-art-4",
        regulationId: "reg-pip-audit-2025",
        articleOrder: 1,
        articleNumber: "第4条",
        title: "强制审计频次",
        content: "处理超过1000万人个人信息的信息处理者，应当每两年至少开展一次个人信息保护合规审计。",
        obligations: [
          { type: "mandatory", target: "强制合规审计（1000万+）", triggerKeywords: ["个人信息", "用户数据", "1000万用户", "合规审计", "大规模"], severity: "high" }
        ],
        keywords: ["合规审计", "1000万", "每两年", "强制"],
        dataStatus: "verified"
      },
      {
        id: "pip-audit-art-5",
        regulationId: "reg-pip-audit-2025",
        articleOrder: 2,
        articleNumber: "第5条",
        title: "监管部门强制审计触发条件",
        content: "个人信息处理者有以下情形之一的，保护部门可以要求委托专业机构进行合规审计：（一）发现个人信息处理活动存在严重影响个人权益或严重缺乏安全措施等较大风险的；（二）个人信息处理活动可能侵害众多个人的权益的；（三）发生个人信息安全事件，导致100万人以上个人信息或者10万人以上敏感个人信息泄露、篡改、丢失、毁损的。",
        obligations: [
          { type: "conditional", target: "监管部门强制审计", triggerKeywords: ["个人信息", "数据泄露", "安全事件", "敏感个人信息", "100万泄露"], severity: "critical" }
        ],
        keywords: ["强制审计", "安全事件", "100万泄露", "10万敏感泄露"],
        dataStatus: "verified"
      },
      {
        id: "pip-audit-art-12",
        regulationId: "reg-pip-audit-2025",
        articleOrder: 3,
        articleNumber: "第12条",
        title: "个人信息保护负责人",
        content: "处理100万人以上个人信息的个人信息处理者应当指定个人信息保护负责人，负责个人信息处理者的个人信息保护合规审计工作。提供重要互联网平台服务、用户数量巨大、业务类型复杂的个人信息处理者，应当成立主要由外部成员组成的独立机构对个人信息保护合规审计情况进行监督。",
        obligations: [
          { type: "mandatory", target: "个人信息保护负责人（100万+）", triggerKeywords: ["个人信息", "用户数据", "100万用户", "个人信息保护负责人"], severity: "high" }
        ],
        keywords: ["个人信息保护负责人", "100万", "独立监督机构"],
        dataStatus: "verified"
      },
      {
        id: "pip-audit-art-14",
        regulationId: "reg-pip-audit-2025",
        articleOrder: 4,
        articleNumber: "第14条",
        title: "禁止转委托",
        content: "专业机构不得转委托其他机构开展个人信息保护合规审计。",
        obligations: [
          { type: "prohibitive", target: "禁止转委托", triggerKeywords: ["合规审计", "转委托", "委托"], severity: "medium" }
        ],
        keywords: ["禁止转委托", "独立性"],
        dataStatus: "verified"
      },
      {
        id: "pip-audit-art-15",
        regulationId: "reg-pip-audit-2025",
        articleOrder: 5,
        articleNumber: "第15条",
        title: "审计独立性保障",
        content: "同一专业机构及其关联机构、同一合规审计负责人不得连续三次以上对同一审计对象开展个人信息保护合规审计。",
        obligations: [
          { type: "prohibitive", target: "审计轮换要求", triggerKeywords: ["合规审计", "审计机构", "独立性"], severity: "medium" }
        ],
        keywords: ["轮换", "独立性", "三次", "关联机构"],
        dataStatus: "verified"
      }
    ]
  },

  // ========== 30. 人工智能生成合成内容标识办法 [条款已录入，已验证] ==========
  {
    id: "reg-aigc-label-2025",
    title: "人工智能生成合成内容标识办法",
    shortTitle: "AIGC标识办法",
    documentNumber: "国信办通字〔2025〕2号",
    issuingBody: "国家网信办、工信部、公安部、国家广播电视总局",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2025-03-07",
    effectiveDate: "2025-09-01",
    status: "effective",
    category: "ai",
    subCategory: "部门规章",
    industry: "AI/媒体",
    crossBorderLevel: "★",
    keywords: ["AIGC", "标识", "水印", "标签", "合成内容", "显式标识", "隐式标识", "元数据"],
    summary: "AIGC内容的显式标识（文字/声音/图形）和隐式标识（元数据/数字水印）双重要求，2025.9.1施行。来源：https://www.gov.cn/zhengce/zhengceku/202503/content_7014286.htm",
    source: "gov.cn_official",
    articles: [
      {
        id: "aigc-label-art-4",
        regulationId: "reg-aigc-label-2025",
        articleOrder: 1,
        articleNumber: "第4条",
        title: "显式标识要求",
        content: "服务提供者应当按照下列要求对生成合成内容添加显式标识：（一）在文本的起始、末尾或中间适当位置添加文字提示或通用符号提示等标识，或在交互场景界面、文字周边添加显著的提示标识；（二）在音频的起始、末尾或中间适当位置添加语音提示或音频节奏提示等标识；（三）在图片的适当位置添加显著的提示标识；（四）在视频起始画面和视频播放周边的适当位置添加显著的提示标识；（五）呈现虚拟场景时，在起始画面的适当位置添加显著的提示标识。提供生成合成内容下载、复制、导出等功能时，应当确保文件中含有满足要求的显式标识。",
        obligations: [
          { type: "mandatory", target: "AIGC显式标识", triggerKeywords: ["AIGC", "AI生成", "AI写作", "AI绘画", "AI视频", "AI音频", "数字人", "虚拟场景", "合成内容", "生成内容"], severity: "critical" }
        ],
        keywords: ["显式标识", "文字提示", "语音提示", "图片标识", "视频标识", "导出"],
        dataStatus: "verified"
      },
      {
        id: "aigc-label-art-5",
        regulationId: "reg-aigc-label-2025",
        articleOrder: 2,
        articleNumber: "第5条",
        title: "隐式标识要求（元数据）",
        content: "服务提供者应当在生成合成内容的文件元数据中添加隐式标识，隐式标识包含生成合成内容属性信息、服务提供者名称或者编码、内容编号等制作要素信息。鼓励服务提供者在生成合成内容中添加数字水印等形式的隐式标识。",
        obligations: [
          { type: "mandatory", target: "AIGC隐式标识（元数据）", triggerKeywords: ["AIGC", "AI生成", "元数据", "数字水印", "隐式标识"], severity: "critical" }
        ],
        keywords: ["隐式标识", "元数据", "数字水印", "文件头"],
        dataStatus: "verified"
      },
      {
        id: "aigc-label-art-6",
        regulationId: "reg-aigc-label-2025",
        articleOrder: 3,
        articleNumber: "第6条",
        title: "传播平台核验义务",
        content: "提供网络信息内容传播服务的服务提供者应当：核验文件元数据中是否含有隐式标识，有标识的需添加提示标识；未核验到但用户声明为生成合成内容的，添加可能提示；检测到显式标识或其他合成痕迹的，添加疑似提示。以上情形均需在文件元数据中添加传播要素信息。",
        obligations: [
          { type: "mandatory", target: "传播平台标识核验", triggerKeywords: ["内容分发", "信息平台", "社交媒体", "AIGC传播", "UGC平台"], severity: "high" }
        ],
        keywords: ["传播平台", "核验", "元数据", "提示标识"],
        dataStatus: "verified"
      },
      {
        id: "aigc-label-art-9",
        regulationId: "reg-aigc-label-2025",
        articleOrder: 4,
        articleNumber: "第9条",
        title: "无显式标识内容的特殊处理",
        content: "用户申请服务提供者提供没有添加显式标识的生成合成内容的，服务提供者可以在通过用户协议明确用户的标识义务和使用责任后，提供不含显式标识的生成合成内容，并依法留存提供对象信息等相关日志不少于六个月。",
        obligations: [
          { type: "conditional", target: "无标识内容留痕", triggerKeywords: ["AIGC", "无标识", "日志留存", "六个月"], severity: "high" }
        ],
        keywords: ["无标识", "用户协议", "日志留存", "六个月"],
        dataStatus: "verified"
      },
      {
        id: "aigc-label-art-10",
        regulationId: "reg-aigc-label-2025",
        articleOrder: 5,
        articleNumber: "第10条",
        title: "禁止破坏标识",
        content: "任何组织和个人不得恶意删除、篡改、伪造、隐匿本办法规定的生成合成内容标识；不得为他人实施上述恶意行为提供工具或者服务；不得通过不正当标识手段损害他人合法权益。",
        obligations: [
          { type: "prohibitive", target: "禁止破坏AIGC标识", triggerKeywords: ["AIGC", "删除标识", "篡改标识", "伪造标识", "隐匿标识"], severity: "critical" }
        ],
        keywords: ["禁止破坏", "删除", "篡改", "伪造", "隐匿"],
        dataStatus: "verified"
      }
    ]
  },

  // ========== 31. 医疗卫生机构网络安全管理办法 [待补充条款] ==========
  {
    id: "reg-medical-net-2022",
    title: "医疗卫生机构网络安全管理办法",
    shortTitle: "医疗机构网安办法",
    issuingBody: "国家卫生健康委员会等",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2022-08",
    effectiveDate: "2022-08",
    status: "effective",
    category: "industry",
    subCategory: "规范性文件",
    industry: "医疗健康",
    crossBorderLevel: "—",
    keywords: ["医疗", "网络安全", "等级保护", "数据保护"],
    summary: "医疗机构网络安全等级保护、数据保护专项要求。",
    source: "excel",
    articles: [metadataArticle("reg-medical-net-2022", 1, "医疗机构网络安全与数据保护")]
  },

  // ========== 32. 药物临床试验质量管理规范 [待补充条款] ==========
  {
    id: "reg-gcp-2020",
    title: "药物临床试验质量管理规范（2020版）",
    shortTitle: "GCP规范",
    issuingBody: "国家药品监督管理局、国家卫生健康委员会",
    lawType: "departmental_rule",
    legalLevel: "rule",
    publishDate: "2020-04-23",
    effectiveDate: "2020-07-01",
    status: "effective",
    category: "industry",
    subCategory: "部门规章",
    industry: "医疗健康-药品",
    crossBorderLevel: "★",
    keywords: ["临床试验", "数据保护", "跨境共享", "GCP", "跨国药企"],
    summary: "临床试验数据保护和跨境共享规范，跨国药企在华研发必须遵守。",
    source: "excel",
    articles: [metadataArticle("reg-gcp-2020", 1, "临床试验数据保护与跨境共享")]
  },

  // ═══════════════════════════════════════════════════════════
  // 第四部分：规范性文件 (Normative Documents) — 18 部
  // ═══════════════════════════════════════════════════════════

  // ========== 33. 工业数据分类分级指南 [待补充条款] ==========
  {
    id: "reg-industry-data-grade-2020",
    title: "工业数据分类分级指南（试行）",
    shortTitle: "工业数据分类分级指南",
    issuingBody: "工业和信息化部",
    lawType: "normative_document",
    legalLevel: "normative",
    publishDate: "2020-02",
    effectiveDate: "2020-02",
    status: "effective",
    category: "industry",
    subCategory: "部门规范性文件",
    industry: "工业/制造业",
    crossBorderLevel: "—",
    keywords: ["工业数据", "三级分类", "一般数据", "重要数据", "核心数据"],
    summary: "工业数据三级（一般/重要/核心）分类分级框架。",
    source: "excel",
    articles: [metadataArticle("reg-industry-data-grade-2020", 1, "工业数据三级分类框架")]
  },

  // ========== 34. 车联网网络安全和数据安全标准体系建设指南 [待补充条款] ==========
  {
    id: "reg-car-net-std-2022",
    title: "车联网网络安全和数据安全标准体系建设指南",
    shortTitle: "车联网标准建设指南",
    issuingBody: "工业和信息化部",
    lawType: "normative_document",
    legalLevel: "normative",
    publishDate: "2022-02",
    effectiveDate: "2022-02",
    status: "effective",
    category: "industry",
    subCategory: "部门规范性文件",
    industry: "汽车/车联网",
    crossBorderLevel: "★",
    keywords: ["车联网", "数据安全", "标准体系", "行业标准"],
    summary: "车联网数据安全标准体系路线图，指导行业标准制定方向。",
    source: "excel",
    articles: [metadataArticle("reg-car-net-std-2022", 1, "车联网数据安全标准体系路线图")]
  },

  // ========== 35. 关于开展个人信息保护认证工作的公告 [待补充条款] ==========
  {
    id: "reg-pip-cert-2022",
    title: "关于开展个人信息保护认证工作的公告",
    shortTitle: "个保认证公告",
    issuingBody: "国家市场监督管理总局、国家网信办",
    lawType: "normative_document",
    legalLevel: "normative",
    publishDate: "2022-11-04",
    effectiveDate: "2022-11-04",
    status: "effective",
    category: "cross-border",
    subCategory: "部门公告",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["个人信息保护认证", "数据出境", "认证机构", "三大路径"],
    summary: "三大出境路径之三（认证），授权认证机构颁发认证证书。",
    source: "excel",
    articles: [metadataArticle("reg-pip-cert-2022", 1, "个人信息保护认证（出境路径三）")]
  },

  // ========== 36. 个人信息跨境处理活动安全认证规范 [待补充条款] ==========
  {
    id: "reg-tc260-cross-cert-2022",
    title: "网络安全标准实践指南——个人信息跨境处理活动安全认证规范（TC260-PG-20222A）",
    shortTitle: "跨境安全认证规范",
    issuingBody: "全国信息安全标准化技术委员会（TC260）",
    lawType: "normative_document",
    legalLevel: "normative",
    publishDate: "2022-12",
    effectiveDate: "2022-12",
    status: "effective",
    category: "cross-border",
    subCategory: "标准实践指南",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["TC260", "跨境", "认证", "标准合同", "个人信息"],
    summary: "个人信息保护认证（出境路径三）的技术依据，V2.0版本。",
    source: "excel",
    articles: [metadataArticle("reg-tc260-cross-cert-2022", 1, "跨境认证技术依据（V2.0）")]
  },

  // ========== 37. 数据出境安全评估申报指南（第一版） [已更新] ==========
  {
    id: "reg-dces-guide-v1-2022",
    title: "数据出境安全评估申报指南（第一版）",
    shortTitle: "安全评估申报指南V1",
    issuingBody: "国家网信办",
    lawType: "normative_document",
    legalLevel: "normative",
    publishDate: "2022-08",
    effectiveDate: "2022-08",
    status: "amended",
    category: "cross-border",
    subCategory: "操作指引",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["数据出境", "安全评估", "申报", "操作指引", "V1"],
    summary: "已更新（第二版替代），2022年9月安全评估办法生效时配套操作指引。",
    source: "excel",
    articles: [metadataArticle("reg-dces-guide-v1-2022", 1, "第一版（已被第二版替代）")]
  },

  // ========== 38. 数据出境安全评估申报指南（第二版） [待补充条款] ==========
  {
    id: "reg-dces-guide-v2-2024",
    title: "数据出境安全评估申报指南（第二版）",
    shortTitle: "安全评估申报指南V2",
    issuingBody: "国家网信办",
    lawType: "normative_document",
    legalLevel: "normative",
    publishDate: "2024-03-22",
    effectiveDate: "2024-03-22",
    status: "effective",
    category: "cross-border",
    subCategory: "操作指引",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["数据出境", "安全评估", "申报", "操作指引", "V2", "豁免"],
    summary: "随《促进和规范数据跨境流动规定》同步更新，豁免门槛调整后的操作规范。",
    source: "excel",
    articles: [metadataArticle("reg-dces-guide-v2-2024", 1, "第二版安全评估申报操作规范")]
  },

  // ========== 39. 个人信息出境标准合同备案指南（第二版） [待补充条款] ==========
  {
    id: "reg-pe-sc-guide-v2-2024",
    title: "个人信息出境标准合同备案指南（第二版）",
    shortTitle: "标准合同备案指南V2",
    issuingBody: "国家网信办",
    lawType: "normative_document",
    legalLevel: "normative",
    publishDate: "2024-03-22",
    effectiveDate: "2024-03-22",
    status: "effective",
    category: "cross-border",
    subCategory: "操作指引",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["个人信息出境", "标准合同", "备案", "操作指引", "V2"],
    summary: "标准合同路径备案操作规范（第二版），明确豁免情形。",
    source: "excel",
    articles: [metadataArticle("reg-pe-sc-guide-v2-2024", 1, "标准合同备案操作规范（第二版）")]
  },

  // ========== 40. 大湾区（内地、香港）个人信息跨境流动标准合同实施指引 [待补充条款] ==========
  {
    id: "reg-gba-hk-sc-2023",
    title: "粤港澳大湾区（内地、香港）个人信息跨境流动标准合同实施指引",
    shortTitle: "大湾区内地→香港跨境指引",
    issuingBody: "国家网信办、香港个人资料私隐专员公署",
    lawType: "normative_document",
    legalLevel: "normative",
    publishDate: "2023-12-10",
    effectiveDate: "2023-12-10",
    status: "effective",
    category: "cross-border",
    subCategory: "双边合作文件",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["大湾区", "香港", "个人信息", "跨境", "标准合同", "简化"],
    summary: "大湾区内地→香港个人信息流动专项机制，签署专项合同可简化出境合规。",
    source: "excel",
    articles: [metadataArticle("reg-gba-hk-sc-2023", 1, "大湾区香港个人信息跨境专项机制")]
  },

  // ========== 41. 大湾区（内地、澳门）个人信息跨境流动标准合同实施指引 [待补充条款] ==========
  {
    id: "reg-gba-mo-sc-2024",
    title: "粤港澳大湾区（内地、澳门）个人信息跨境流动标准合同实施指引",
    shortTitle: "大湾区内地→澳门跨境指引",
    issuingBody: "国家网信办、澳门个人资料保护办公室",
    lawType: "normative_document",
    legalLevel: "normative",
    publishDate: "2024-09-10",
    effectiveDate: "2024-09-10",
    status: "effective",
    category: "cross-border",
    subCategory: "双边合作文件",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["大湾区", "澳门", "个人信息", "跨境", "标准合同"],
    summary: "大湾区内地→澳门个人信息流动专项机制。",
    source: "excel",
    articles: [metadataArticle("reg-gba-mo-sc-2024", 1, "大湾区澳门个人信息跨境专项机制")]
  },

  // ========== 42. 促进和规范金融业数据跨境流动合规指南 [待补充条款] ==========
  {
    id: "reg-fin-cb-guide-2024",
    title: "促进和规范金融业数据跨境流动合规指南",
    shortTitle: "金融业数据跨境指引",
    issuingBody: "人民银行、金管总局、证监会、外汇局、网信办、国家数据局",
    lawType: "normative_document",
    legalLevel: "normative",
    publishDate: "2024",
    effectiveDate: "2024",
    status: "effective",
    category: "cross-border",
    subCategory: "合规指引",
    industry: "金融",
    crossBorderLevel: "★★",
    keywords: ["金融", "数据跨境", "豁免", "47类场景", "安全评估"],
    summary: "47类高频金融场景数据跨境可免安全评估，跨境金融机构重要参考。",
    source: "excel",
    articles: [metadataArticle("reg-fin-cb-guide-2024", 1, "47类高频金融场景跨境豁免")]
  },

  // ========== 43. 智能网联汽车测绘地理信息安全通知 [待补充条款] ==========
  {
    id: "reg-car-mapping-2022",
    title: "自然资源部关于促进智能网联汽车发展维护测绘地理信息安全的通知",
    shortTitle: "智能网联汽车测绘安全通知",
    issuingBody: "自然资源部",
    lawType: "normative_document",
    legalLevel: "normative",
    publishDate: "2022-08-30",
    effectiveDate: "2022-08-30",
    status: "effective",
    category: "industry",
    subCategory: "部门通知",
    industry: "汽车/地图",
    crossBorderLevel: "★★",
    keywords: ["智能网联汽车", "测绘", "地理信息", "数据出境"],
    summary: "智能网联汽车地理信息采集、处理、出境专项要求。",
    source: "excel",
    articles: [metadataArticle("reg-car-mapping-2022", 1, "智能驾驶地理信息合规要求")]
  },

  // ========== 44. 加强智能网联汽车测绘地理信息安全管理的通知（2024）[待补充条款] ==========
  {
    id: "reg-car-mapping-2024",
    title: "关于加强智能网联汽车有关测绘地理信息安全管理的通知（自然资发〔2024〕139号）",
    shortTitle: "智能驾驶测绘安全通知2024",
    issuingBody: "自然资源部",
    lawType: "normative_document",
    legalLevel: "normative",
    publishDate: "2024-07-26",
    effectiveDate: "2024-07-26",
    status: "effective",
    category: "industry",
    subCategory: "部门通知",
    industry: "汽车/地图",
    crossBorderLevel: "★★",
    keywords: ["智能网联汽车", "测绘", "地理信息", "数据安全", "2024更新"],
    summary: "2024年更新版，进一步细化智能驾驶地理数据合规要求。",
    source: "excel",
    articles: [metadataArticle("reg-car-mapping-2024", 1, "2024更新版智能驾驶地理数据合规")]
  },

  // ========== 45. 数据出境安全管理政策问答（2025年4月）[待补充条款] ==========
  {
    id: "reg-cb-faq-2025",
    title: "数据出境安全管理政策问答（2025年4月）",
    shortTitle: "数据出境政策问答2025",
    issuingBody: "国家网信办",
    lawType: "normative_document",
    legalLevel: "normative",
    publishDate: "2025-04",
    effectiveDate: "2025-04",
    status: "effective",
    category: "cross-border",
    subCategory: "政策问答",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["数据出境", "政策问答", "执行口径", "权威解读"],
    summary: "权威解读《促进和规范数据跨境流动规定》执行口径，具有参考效力。",
    source: "excel",
    articles: [metadataArticle("reg-cb-faq-2025", 1, "数据出境政策执行口径解读")]
  },

  // ========== 46. 卫生健康行业人工智能应用场景参考指引 [待补充条款] ==========
  {
    id: "reg-health-ai-guide-2024",
    title: "卫生健康行业人工智能应用场景参考指引",
    shortTitle: "医疗AI应用指引",
    issuingBody: "国家卫生健康委员会、国家中医药管理局等",
    lawType: "normative_document",
    legalLevel: "normative",
    publishDate: "2024-11-06",
    effectiveDate: "2024-11-06",
    status: "effective",
    category: "industry",
    subCategory: "部门规范性文件",
    industry: "医疗健康/AI",
    crossBorderLevel: "★",
    keywords: ["医疗AI", "卫生健康", "应用场景", "合规指引"],
    summary: "医疗AI应用场景合规指引，影响医疗AI产品开发和出海。",
    source: "excel",
    articles: [metadataArticle("reg-health-ai-guide-2024", 1, "医疗AI应用场景合规指引")]
  },

  // ========== 47. 国家人工智能产业综合标准化体系建设指南 [待补充条款] ==========
  {
    id: "reg-ai-std-system-2024",
    title: "国家人工智能产业综合标准化体系建设指南（2024版）",
    shortTitle: "AI标准体系指南",
    issuingBody: "工信部、科技部、国家发改委、国家标准委",
    lawType: "normative_document",
    legalLevel: "normative",
    publishDate: "2024-07",
    effectiveDate: "2024-07",
    status: "effective",
    category: "ai",
    subCategory: "政策指南",
    industry: "AI",
    crossBorderLevel: "★",
    keywords: ["AI标准", "标准体系", "路线图", "国家标准"],
    summary: "AI标准体系路线图，指引未来3-5年AI国家标准制定方向。",
    source: "excel",
    articles: [metadataArticle("reg-ai-std-system-2024", 1, "AI标准体系路线图")]
  },

  // ========== 48. 2025年个人信息保护系列专项行动公告 [待补充条款] ==========
  {
    id: "reg-pip-action-2025",
    title: "关于开展2025年个人信息保护系列专项行动的公告",
    shortTitle: "2025个保专项行动",
    issuingBody: "中央网信办、工信部、公安部、市场监管总局",
    lawType: "normative_document",
    legalLevel: "normative",
    publishDate: "2025-03-28",
    effectiveDate: "2025",
    status: "effective",
    category: "data-privacy",
    subCategory: "部门公告",
    industry: "通用",
    crossBorderLevel: "—",
    keywords: ["个人信息保护", "专项行动", "执法", "人脸识别", "App"],
    summary: "2025年执法重点：人脸识别、敏感个人信息、App违规。",
    source: "excel",
    articles: [metadataArticle("reg-pip-action-2025", 1, "2025年个保执法重点")]
  },

  // ========== 49. 上海自贸区临港数据跨境分类分级管理办法 [待补充条款] ==========
  {
    id: "reg-sh-ftz-cb-2024",
    title: "中国（上海）自贸区临港新片区数据跨境流动分类分级管理办法（试行）",
    shortTitle: "上海临港数据跨境办法",
    issuingBody: "上海市临港新片区管理委员会等",
    lawType: "local_regulation",
    legalLevel: "local",
    publishDate: "2024-02-08",
    effectiveDate: "2024-02-08",
    status: "effective",
    category: "cross-border",
    subCategory: "地方规章",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["上海", "自贸区", "临港", "数据出境", "负面清单"],
    summary: "上海临港自贸区数据出境负面清单机制，清单外数据可简化出境流程。",
    source: "excel",
    articles: [metadataArticle("reg-sh-ftz-cb-2024", 1, "上海临港负面清单机制")]
  },

  // ========== 50. 天津自贸区数据出境管理负面清单 [待补充条款] ==========
  {
    id: "reg-tj-ftz-cb-2024",
    title: "中国（天津）自贸区数据出境管理负面清单（2024版）",
    shortTitle: "天津数据出境负面清单",
    issuingBody: "天津自贸区管委会、天津市商务局等",
    lawType: "local_regulation",
    legalLevel: "local",
    publishDate: "2024-05",
    effectiveDate: "2024-05",
    status: "effective",
    category: "cross-border",
    subCategory: "地方规范性文件",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["天津", "自贸区", "负面清单", "数据出境", "豁免"],
    summary: "全国首个数据出境负面清单，清单外数据出境豁免审批评估。",
    source: "excel",
    articles: [metadataArticle("reg-tj-ftz-cb-2024", 1, "全国首个数据出境负面清单")]
  },

  // ========== 51. 北京自贸区数据出境负面清单管理办法 [待补充条款] ==========
  {
    id: "reg-bj-ftz-cb-2024",
    title: "中国（北京）自贸区数据出境负面清单管理办法（试行）及负面清单（2024版）",
    shortTitle: "北京数据出境负面清单",
    issuingBody: "北京市网信办、北京市商务局、北京市政务数据局",
    lawType: "local_regulation",
    legalLevel: "local",
    publishDate: "2024-08-26",
    effectiveDate: "2024-08-26",
    status: "effective",
    category: "cross-border",
    subCategory: "地方规章",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["北京", "自贸区", "负面清单", "数据出境"],
    summary: "北京自贸区数据出境负面清单机制。",
    source: "excel",
    articles: [metadataArticle("reg-bj-ftz-cb-2024", 1, "北京自贸区负面清单机制")]
  },

  // ═══════════════════════════════════════════════════════════
  // 第五部分：国家标准 — 推荐性 (GB/T) — 16 部
  // ═══════════════════════════════════════════════════════════

  // ========== 52. GB/T 35273-2020 个人信息安全规范 ==========
  {
    id: "gbt-35273-2020",
    title: "GB/T 35273-2020 信息安全技术 个人信息安全规范",
    shortTitle: "个人信息安全规范",
    issuingBody: "国家市场监管总局/国家标准委（TC260归口）",
    lawType: "national_standard",
    legalLevel: "standard",
    publishDate: "2020-03-06",
    effectiveDate: "2020-10-01",
    status: "effective",
    category: "data-privacy",
    subCategory: "推荐性国家标准（GB/T）",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["GB/T35273", "个人信息", "安全规范", "App合规", "个保认证"],
    summary: "个人信息保护实践最核心参考标准，App合规、个保认证的技术依据。",
    source: "excel",
    articles: [metadataArticle("gbt-35273-2020", 1, "个人信息保护最核心参考标准")]
  },

  // ========== 53. GB/T 39335-2020 个人信息安全影响评估指南 ==========
  {
    id: "gbt-39335-2020",
    title: "GB/T 39335-2020 信息安全技术 个人信息安全影响评估指南",
    shortTitle: "个人信息安全影响评估指南",
    issuingBody: "TC260 / 国家市场监管总局",
    lawType: "national_standard",
    legalLevel: "standard",
    publishDate: "2020-11-19",
    effectiveDate: "2021-06-01",
    status: "effective",
    category: "data-privacy",
    subCategory: "推荐性国家标准（GB/T）",
    industry: "通用",
    crossBorderLevel: "★",
    keywords: ["GB/T39335", "PIA", "安全影响评估", "尽职调查", "个人信息"],
    summary: "个人信息安全影响评估（PIA）操作规范，出海合规尽职调查参考。",
    source: "excel",
    articles: [metadataArticle("gbt-39335-2020", 1, "PIA操作规范")]
  },

  // ========== 54. GB/T 39725-2020 健康医疗数据安全指南 ==========
  {
    id: "gbt-39725-2020",
    title: "GB/T 39725-2020 信息安全技术 健康医疗数据安全指南",
    shortTitle: "健康医疗数据安全指南",
    issuingBody: "TC260 / 国家市场监管总局",
    lawType: "national_standard",
    legalLevel: "standard",
    publishDate: "2020-12-14",
    effectiveDate: "2021-07-01",
    status: "effective",
    category: "industry",
    subCategory: "推荐性国家标准（GB/T）",
    industry: "医疗健康",
    crossBorderLevel: "★",
    keywords: ["GB/T39725", "医疗", "健康", "数据安全", "分类分级"],
    summary: "健康医疗数据分类分级、安全保护技术要求。",
    source: "excel",
    articles: [metadataArticle("gbt-39725-2020", 1, "健康医疗数据安全技术要求")]
  },

  // ========== 55. GB/T 39204-2022 关键信息基础设施安全保护要求 ==========
  {
    id: "gbt-39204-2022",
    title: "GB/T 39204-2022 信息安全技术 关键信息基础设施安全保护要求",
    shortTitle: "CII安全保护要求",
    issuingBody: "TC260 / 国家市场监管总局",
    lawType: "national_standard",
    legalLevel: "standard",
    publishDate: "2022-11-07",
    effectiveDate: "2023-05-01",
    status: "effective",
    category: "cybersecurity",
    subCategory: "推荐性国家标准（GB/T）",
    industry: "通用",
    crossBorderLevel: "—",
    keywords: ["GB/T39204", "CII", "关键信息基础设施", "安全保护", "技术框架"],
    summary: "关键信息基础设施安全保护技术框架，配合《关键信息基础设施安全保护条例》。",
    source: "excel",
    articles: [metadataArticle("gbt-39204-2022", 1, "CII安全保护技术框架")]
  },

  // ========== 56. GB/T 41391-2022 App收集个人信息基本要求 ==========
  {
    id: "gbt-41391-2022",
    title: "GB/T 41391-2022 信息安全技术 移动互联网应用程序（App）收集个人信息基本要求",
    shortTitle: "App收集个人信息要求",
    issuingBody: "TC260 / 国家市场监管总局",
    lawType: "national_standard",
    legalLevel: "standard",
    publishDate: "2022-04-15",
    effectiveDate: "2022-11-01",
    status: "effective",
    category: "data-privacy",
    subCategory: "推荐性国家标准（GB/T）",
    industry: "互联网/App",
    crossBorderLevel: "—",
    keywords: ["GB/T41391", "App", "个人信息", "最小必要", "合规依据"],
    summary: "App收集个人信息最小必要性判断标准，执法合规核心依据。",
    source: "excel",
    articles: [metadataArticle("gbt-41391-2022", 1, "App个人信息最小必要判断标准")]
  },

  // ========== 57. GB/T 41817-2022 个人信息保护合规审计要求 ==========
  {
    id: "gbt-41817-2022",
    title: "GB/T 41817-2022 数据安全技术 个人信息保护合规审计要求",
    shortTitle: "个保合规审计标准",
    issuingBody: "TC260 / 国家市场监管总局",
    lawType: "national_standard",
    legalLevel: "standard",
    publishDate: "2022-10-12",
    effectiveDate: "2023-05-01",
    status: "effective",
    category: "data-privacy",
    subCategory: "推荐性国家标准（GB/T）",
    industry: "通用",
    crossBorderLevel: "★",
    keywords: ["GB/T41817", "合规审计", "个人信息", "审计技术规范"],
    summary: "个人信息保护合规审计技术规范，配合《个人信息保护合规审计管理办法》。",
    source: "excel",
    articles: [metadataArticle("gbt-41817-2022", 1, "合规审计技术规范")]
  },

  // ========== 58. GB/T 41819-2022 人脸识别数据安全要求 ==========
  {
    id: "gbt-41819-2022",
    title: "GB/T 41819-2022 信息安全技术 人脸识别数据安全要求",
    shortTitle: "人脸识别数据安全要求",
    issuingBody: "TC260 / 国家市场监管总局",
    lawType: "national_standard",
    legalLevel: "standard",
    publishDate: "2022-10-12",
    effectiveDate: "2023-05-01",
    status: "effective",
    category: "ai",
    subCategory: "推荐性国家标准（GB/T）",
    industry: "通用/AI",
    crossBorderLevel: "★",
    keywords: ["GB/T41819", "人脸识别", "生物特征", "数据安全", "敏感信息"],
    summary: "人脸识别数据采集、存储、传输安全技术要求。",
    source: "excel",
    articles: [metadataArticle("gbt-41819-2022", 1, "人脸识别数据安全技术要求")]
  },

  // ========== 59. GB/T 41871-2022 汽车数据处理安全要求 ==========
  {
    id: "gbt-41871-2022",
    title: "GB/T 41871-2022 信息安全技术 汽车数据处理安全要求",
    shortTitle: "汽车数据处理安全要求",
    issuingBody: "TC260 / 国家市场监管总局",
    lawType: "national_standard",
    legalLevel: "standard",
    publishDate: "2022-10-12",
    effectiveDate: "2023-05-01",
    status: "effective",
    category: "industry",
    subCategory: "推荐性国家标准（GB/T）",
    industry: "汽车",
    crossBorderLevel: "★★",
    keywords: ["GB/T41871", "汽车", "数据安全", "自动驾驶", "车联网"],
    summary: "汽车数据安全技术标准，配合《汽车数据安全管理若干规定》。",
    source: "excel",
    articles: [metadataArticle("gbt-41871-2022", 1, "汽车数据安全技术标准")]
  },

  // ========== 60. GB/T 41867-2022 人工智能 术语 ==========
  {
    id: "gbt-41867-2022",
    title: "GB/T 41867-2022 信息技术 人工智能 术语",
    shortTitle: "AI术语标准",
    issuingBody: "全国信息技术标准化技术委员会 / 国家市场监管总局",
    lawType: "national_standard",
    legalLevel: "standard",
    publishDate: "2022-10-12",
    effectiveDate: "2023-05-01",
    status: "effective",
    category: "ai",
    subCategory: "推荐性国家标准（GB/T）",
    industry: "AI",
    crossBorderLevel: "—",
    keywords: ["GB/T41867", "AI", "术语", "标准", "基础"],
    summary: "AI领域基础术语规范，为后续AI标准和立法提供语言基础。",
    source: "excel",
    articles: [metadataArticle("gbt-41867-2022", 1, "AI领域基础术语规范")]
  },

  // ========== 61. GB/T 42574-2023 告知同意的实施指南 ==========
  {
    id: "gbt-42574-2023",
    title: "GB/T 42574-2023 信息安全技术 个人信息处理中告知和同意的实施指南",
    shortTitle: "告知同意实施指南",
    issuingBody: "TC260 / 国家市场监管总局",
    lawType: "national_standard",
    legalLevel: "standard",
    publishDate: "2023-05-23",
    effectiveDate: "2023-12-01",
    status: "effective",
    category: "data-privacy",
    subCategory: "推荐性国家标准（GB/T）",
    industry: "通用",
    crossBorderLevel: "★",
    keywords: ["GB/T42574", "告知", "同意", "PIPL", "实施指南", "隐私政策"],
    summary: "告知同意机制实施规范，解决PIPL落地实操问题。",
    source: "excel",
    articles: [metadataArticle("gbt-42574-2023", 1, "告知同意实施规范")]
  },

  // ========== 62. GB/T 42582-2023 App个人信息安全测评规范 ==========
  {
    id: "gbt-42582-2023",
    title: "GB/T 42582-2023 信息安全技术 移动互联网应用程序（App）个人信息安全测评规范",
    shortTitle: "App安全测评规范",
    issuingBody: "TC260 / 国家市场监管总局",
    lawType: "national_standard",
    legalLevel: "standard",
    publishDate: "2023-05-23",
    effectiveDate: "2023-12-01",
    status: "effective",
    category: "data-privacy",
    subCategory: "推荐性国家标准（GB/T）",
    industry: "互联网/App",
    crossBorderLevel: "—",
    keywords: ["GB/T42582", "App", "个人信息", "测评", "执法依据"],
    summary: "App个人信息安全合规测评方法，App专项治理执法依据。",
    source: "excel",
    articles: [metadataArticle("gbt-42582-2023", 1, "App个人信息安全测评方法")]
  },

  // ========== 63. GB/T 42888-2023 机器学习算法安全评估规范 ==========
  {
    id: "gbt-42888-2023",
    title: "GB/T 42888-2023 信息安全技术 机器学习算法安全评估规范",
    shortTitle: "ML算法安全评估规范",
    issuingBody: "TC260 / 国家市场监管总局",
    lawType: "national_standard",
    legalLevel: "standard",
    publishDate: "2023-08-06",
    effectiveDate: "2024-03-01",
    status: "effective",
    category: "ai",
    subCategory: "推荐性国家标准（GB/T）",
    industry: "AI",
    crossBorderLevel: "★",
    keywords: ["GB/T42888", "机器学习", "算法安全", "安全评估", "AI"],
    summary: "机器学习算法安全评估方法，生成式AI安全评估参考。",
    source: "excel",
    articles: [metadataArticle("gbt-42888-2023", 1, "机器学习算法安全评估方法")]
  },

  // ========== 64. GB/T 43697-2024 数据分类分级规则 ==========
  {
    id: "gbt-43697-2024",
    title: "GB/T 43697-2024 数据安全技术 数据分类分级规则",
    shortTitle: "数据分类分级规则",
    issuingBody: "TC260 / 国家市场监管总局",
    lawType: "national_standard",
    legalLevel: "standard",
    publishDate: "2024-03-15",
    effectiveDate: "2024-10-01",
    status: "effective",
    category: "data-security",
    subCategory: "推荐性国家标准（GB/T）",
    industry: "通用",
    crossBorderLevel: "★★",
    keywords: ["GB/T43697", "数据分类", "数据分级", "重要数据", "出境评估"],
    summary: "数据分类分级通用规则，各行业数据分级的基础依据，影响出境评估判断。",
    source: "excel",
    articles: [metadataArticle("gbt-43697-2024", 1, "数据分类分级通用规则")]
  },

  // ========== 65. GB/T 42775-2023 证券期货业数据分类分级指引 ==========
  {
    id: "gbt-42775-2023",
    title: "GB/T 42775-2023 证券期货业数据安全风险防控 数据分类分级指引",
    shortTitle: "证券期货数据分级指引",
    issuingBody: "中国证监会/TC260",
    lawType: "national_standard",
    legalLevel: "standard",
    publishDate: "2023",
    effectiveDate: "2023",
    status: "effective",
    category: "industry",
    subCategory: "推荐性国家标准（GB/T）",
    industry: "金融-证券期货",
    crossBorderLevel: "★",
    keywords: ["GB/T42775", "证券", "期货", "数据分类", "数据分级"],
    summary: "证券期货行业数据分级指引。",
    source: "excel",
    articles: [metadataArticle("gbt-42775-2023", 1, "证券期货行业数据分级")]
  },

  // ========== 66. GB/T 45654-2025 生成式AI服务安全基本要求 ==========
  {
    id: "gbt-45654-2025",
    title: "GB/T 45654-2025 网络安全技术 生成式人工智能服务安全基本要求",
    shortTitle: "GenAI安全基本要求",
    issuingBody: "TC260 / 国家市场监管总局",
    lawType: "national_standard",
    legalLevel: "standard",
    publishDate: "2025",
    effectiveDate: "2025",
    status: "effective",
    category: "ai",
    subCategory: "推荐性国家标准（GB/T）",
    industry: "AI",
    crossBorderLevel: "★★",
    keywords: ["GB/T45654", "生成式AI", "安全要求", "备案", "安全评估", "技术基准"],
    summary: "生成式AI服务安全技术基准，监管备案/安全评估的技术评判依据。",
    source: "excel",
    articles: [metadataArticle("gbt-45654-2025", 1, "GenAI安全技术基准")]
  },

  // ========== 67. GB 45438-2025 AIGC内容标识方法（强制性） ==========
  {
    id: "gb-45438-2025",
    title: "GB 45438-2025 网络安全技术 人工智能生成合成内容标识方法",
    shortTitle: "AIGC内容标识国标",
    issuingBody: "国家标准委（中央网信办主管，TC260归口）",
    lawType: "mandatory_national_standard",
    legalLevel: "standard",
    publishDate: "2025-02-28",
    effectiveDate: "2025-09-01",
    status: "effective",
    category: "ai",
    subCategory: "强制性国家标准（GB）",
    industry: "AI/媒体",
    crossBorderLevel: "★★",
    keywords: ["GB45438", "AIGC", "标识", "水印", "标签", "强制标准", "合成内容"],
    summary: "⚠️ 强制性标准！AIGC内容水印/标签技术要求，向中国用户提供AIGC服务须强制执行。",
    source: "excel",
    articles: [metadataArticle("gb-45438-2025", 1, "AIGC强制标识技术标准")]
  },

  // ========== 68. GB 44495-2024 汽车整车信息安全技术要求（强制性） ==========
  {
    id: "gb-44495-2024",
    title: "GB 44495-2024 汽车整车信息安全技术要求",
    shortTitle: "汽车信息安全强制标准",
    issuingBody: "工业和信息化部",
    lawType: "mandatory_national_standard",
    legalLevel: "standard",
    publishDate: "2024-08-23",
    effectiveDate: "2026-01-01",
    status: "pending_effect",
    category: "industry",
    subCategory: "强制性国家标准（GB）",
    industry: "汽车",
    crossBorderLevel: "★★",
    keywords: ["GB44495", "汽车", "信息安全", "强制性标准", "整车"],
    summary: "⚠️ 强制性标准！汽车整车信息安全技术要求，在华销售汽车须符合，影响外资车企。2026年起强制执行。",
    source: "excel",
    articles: [metadataArticle("gb-44495-2024", 1, "汽车信息安全强制技术要求")]
  },

  // ═══════════════════════════════════════════════════════════
  // 第六部分：行业标准 (Industry Standards) — 5 部
  // ═══════════════════════════════════════════════════════════

  // ========== 69. JR/T 0171-2020 个人金融信息保护技术规范 ==========
  {
    id: "jrt-0171-2020",
    title: "JR/T 0171-2020 个人金融信息保护技术规范",
    shortTitle: "个人金融信息保护规范",
    issuingBody: "中国人民银行（TC180归口）",
    lawType: "industry_standard",
    legalLevel: "standard",
    publishDate: "2020-02",
    effectiveDate: "2020-02",
    status: "effective",
    category: "industry",
    subCategory: "金融行业标准（JR/T）",
    industry: "金融",
    crossBorderLevel: "★",
    keywords: ["JR/T0171", "金融", "个人信息", "C3/C2/C1", "分级保护"],
    summary: "个人金融信息分级保护技术规范（C3/C2/C1三级），银行系统合规基础标准。",
    source: "excel",
    articles: [metadataArticle("jrt-0171-2020", 1, "个人金融信息三级保护规范")]
  },

  // ========== 70. JR/T 0197-2020 金融数据安全分级指南 ==========
  {
    id: "jrt-0197-2020",
    title: "JR/T 0197-2020 金融数据安全 数据安全分级指南",
    shortTitle: "金融数据分级指南",
    issuingBody: "中国人民银行（TC180归口）",
    lawType: "industry_standard",
    legalLevel: "standard",
    publishDate: "2020-09-23",
    effectiveDate: "2020-09-23",
    status: "effective",
    category: "industry",
    subCategory: "金融行业标准（JR/T）",
    industry: "金融",
    crossBorderLevel: "★",
    keywords: ["JR/T0197", "金融数据", "五级分类", "安全管理"],
    summary: "金融数据五级分类分级框架，金融机构数据安全管理基础依据。",
    source: "excel",
    articles: [metadataArticle("jrt-0197-2020", 1, "金融数据五级分类框架")]
  },

  // ========== 71. JR/T 0223-2021 金融数据生命周期安全规范 ==========
  {
    id: "jrt-0223-2021",
    title: "JR/T 0223-2021 金融数据安全 数据生命周期安全规范",
    shortTitle: "金融数据生命周期规范",
    issuingBody: "中国人民银行（TC180归口）",
    lawType: "industry_standard",
    legalLevel: "standard",
    publishDate: "2021-04-08",
    effectiveDate: "2021-04-08",
    status: "effective",
    category: "industry",
    subCategory: "金融行业标准（JR/T）",
    industry: "金融",
    crossBorderLevel: "★",
    keywords: ["JR/T0223", "金融数据", "生命周期", "全流程", "安全规范"],
    summary: "金融数据采集→存储→使用→共享→删除全生命周期安全要求。",
    source: "excel",
    articles: [metadataArticle("jrt-0223-2021", 1, "金融数据全生命周期安全")]
  },

  // ========== 72. JR/T 0250-2022 证券期货业数据安全管理与保护指引 ==========
  {
    id: "jrt-0250-2022",
    title: "JR/T 0250-2022 证券期货业数据安全管理与保护指引",
    shortTitle: "证券期货数据安全指引",
    issuingBody: "中国证监会（TC180归口）",
    lawType: "industry_standard",
    legalLevel: "standard",
    publishDate: "2022",
    effectiveDate: "2022",
    status: "effective",
    category: "industry",
    subCategory: "金融行业标准（JR/T）",
    industry: "金融-证券期货",
    crossBorderLevel: "★",
    keywords: ["JR/T0250", "证券", "期货", "数据安全", "管理规范"],
    summary: "证券期货行业数据安全管理规范。",
    source: "excel",
    articles: [metadataArticle("jrt-0250-2022", 1, "证券期货数据安全管理规范")]
  },

  // ========== 73. YD/T 3813-2020 基础电信企业数据分类分级方法 ==========
  {
    id: "ydt-3813-2020",
    title: "YD/T 3813-2020 基础电信企业数据分类分级方法",
    shortTitle: "电信数据分类分级",
    issuingBody: "工业和信息化部",
    lawType: "industry_standard",
    legalLevel: "standard",
    publishDate: "2020-12",
    effectiveDate: "2020-12",
    status: "effective",
    category: "industry",
    subCategory: "电信行业标准（YD/T）",
    industry: "电信",
    crossBorderLevel: "—",
    keywords: ["YD/T3813", "电信", "数据分类", "数据分级"],
    summary: "电信企业数据分类分级具体方法。",
    source: "excel",
    articles: [metadataArticle("ydt-3813-2020", 1, "电信企业数据分类分级方法")]
  },

  // ═══════════════════════════════════════════════════════════
  // 第七部分：草案 (Drafts) — 4 部
  // ═══════════════════════════════════════════════════════════

  // ========== 74. 人工智能法（草案） ==========
  {
    id: "reg-ai-law-draft",
    title: "中华人民共和国人工智能法（草案）",
    shortTitle: "AI法草案",
    issuingBody: "全国人民代表大会常务委员会",
    lawType: "draft",
    legalLevel: "draft",
    publishDate: "—",
    effectiveDate: "—",
    status: "draft",
    category: "ai",
    subCategory: "立法草案",
    industry: "AI",
    crossBorderLevel: "★★",
    keywords: ["AI法", "人工智能", "草案", "立法"],
    summary: "2025年列入全国人大立法计划【视情安排审议】，截至2026年6月尚未颁布。需持续关注立法进展。",
    source: "excel",
    articles: [metadataArticle("reg-ai-law-draft", 1, "人工智能法草案（尚未颁布）")]
  },

  // ========== 75. 网络安全等级保护条例（征求意见稿） ==========
  {
    id: "reg-eqpl-draft",
    title: "网络安全等级保护条例（征求意见稿）",
    shortTitle: "等保条例草案",
    issuingBody: "公安部",
    lawType: "draft",
    legalLevel: "draft",
    publishDate: "征求意见中",
    effectiveDate: "—",
    status: "draft",
    category: "cybersecurity",
    subCategory: "行政法规草案",
    industry: "通用",
    crossBorderLevel: "—",
    keywords: ["等级保护", "等保", "行政法规", "草案"],
    summary: "等保制度从标准层级升格为行政法规，将细化等级认定和义务。目前在征求意见阶段。",
    source: "excel",
    articles: [metadataArticle("reg-eqpl-draft", 1, "等保制度升格行政法规草案")]
  },

  // ========== 76. 数据安全技术 个人信息保护合规审计要求（征求意见） ==========
  {
    id: "gbt-pip-audit-draft",
    title: "数据安全技术 个人信息保护合规审计要求（GB/T 计划）",
    shortTitle: "个保审计标准草案",
    issuingBody: "TC260",
    lawType: "draft",
    legalLevel: "draft",
    publishDate: "2024-07（征求意见稿）",
    effectiveDate: "—",
    status: "draft",
    category: "data-privacy",
    subCategory: "国家标准草案",
    industry: "通用",
    crossBorderLevel: "★",
    keywords: ["合规审计", "GB/T", "草案", "征求意见"],
    summary: "配合《个人信息保护合规审计管理办法》制定中的技术标准。",
    source: "excel",
    articles: [metadataArticle("gbt-pip-audit-draft", 1, "个保审计技术标准草案")]
  },

  // ========== 77. 数据安全技术 敏感个人信息处理安全要求（征求意见） ==========
  {
    id: "gbt-sensitive-data-draft",
    title: "数据安全技术 敏感个人信息处理安全要求（GB/T 征求意见）",
    shortTitle: "敏感信息处理标准草案",
    issuingBody: "TC260",
    lawType: "draft",
    legalLevel: "draft",
    publishDate: "征求意见中",
    effectiveDate: "—",
    status: "draft",
    category: "data-privacy",
    subCategory: "国家标准草案",
    industry: "通用",
    crossBorderLevel: "★",
    keywords: ["敏感个人信息", "生物特征", "金融", "健康", "草案"],
    summary: "细化敏感个人信息（生物特征/金融/健康等）处理技术要求。",
    source: "excel",
    articles: [metadataArticle("gbt-sensitive-data-draft", 1, "敏感信息处理技术要求草案")]
  },

  // ═══════════════════════════════════════════════════════════
  // 附：已有但 Excel 清单中未单独列出的保留法规
  // ═══════════════════════════════════════════════════════════
  // 注意：以下法规保留自有代码，Excel 全量清单未列入但合规引擎依赖

  // ========== 附录A. 消费者权益保护法 [保留] ==========
  {
    id: "reg-cpl-2013",
    title: "中华人民共和国消费者权益保护法",
    shortTitle: "消费者权益保护法",
    documentNumber: "中华人民共和国主席令第7号",
    issuingBody: "全国人民代表大会常务委员会",
    lawType: "law",
    legalLevel: "law",
    publishDate: "2013-10-25",
    effectiveDate: "2014-03-15",
    status: "effective",
    category: "consumer",
    subCategory: "法律",
    industry: "通用",
    crossBorderLevel: "—",
    keywords: ["消费者", "虚假宣传", "知情权", "个人信息", "赔偿"],
    summary: "保护消费者合法权益的基础法律，规定经营者不得作虚假或引人误解的宣传，消费者享有知情权、自主选择权等。（不在数据合规专项清单中，但引擎依赖）",
    source: "existing_code",
    articles: [
      {
        id: "cpl-art-20",
        regulationId: "reg-cpl-2013",
        articleOrder: 1,
        articleNumber: "第20条",
        title: "禁止虚假宣传",
        content: "经营者向消费者提供有关商品或者服务的质量、性能、用途、有效期限等信息，应当真实、全面，不得作虚假或者引人误解的宣传。经营者对消费者就其提供的商品或者服务的质量和使用方法等问题提出的询问，应当作出真实、明确的答复。",
        obligations: [
          { type: "prohibitive", target: "禁止虚假宣传", triggerKeywords: ["营销", "广告", "推广", "商品描述", "AI生成", "虚假"], severity: "high" }
        ],
        penalty: {
          type: "fine",
          description: "虚假或者引人误解的宣传",
          statutoryPenalty: "责令改正，可以根据情节单处或者并处警告、没收违法所得、处以违法所得一倍以上十倍以下的罚款；没有违法所得的，处以五十万元以下的罚款"
        },
        keywords: ["虚假宣传", "误导", "消费者权益", "营销", "广告"]
      }
    ]
  },

  // ========== 附录B. 广告法 [保留] ==========
  {
    id: "reg-ad-law-2021",
    title: "中华人民共和国广告法",
    shortTitle: "广告法",
    documentNumber: "中华人民共和国主席令第81号",
    issuingBody: "全国人民代表大会常务委员会",
    lawType: "law",
    legalLevel: "law",
    publishDate: "2021-04-29",
    effectiveDate: "2021-04-29",
    status: "effective",
    category: "advertising",
    subCategory: "法律",
    industry: "通用",
    crossBorderLevel: "—",
    keywords: ["广告", "虚假广告", "标识", "审查", "AI营销"],
    summary: "规范广告活动的基本法律，禁止虚假广告，要求广告内容真实合法，特定行业广告须经审查。（不在数据合规专项清单中，但引擎依赖）",
    source: "existing_code",
    articles: [
      {
        id: "ad-law-art-4",
        regulationId: "reg-ad-law-2021",
        articleOrder: 1,
        articleNumber: "第4条",
        title: "广告真实性原则",
        content: "广告不得含有虚假或者引人误解的内容，不得欺骗、误导消费者。广告主应当对广告内容的真实性负责。",
        obligations: [
          { type: "prohibitive", target: "禁止虚假广告", triggerKeywords: ["广告投放", "营销文案", "推广内容", "广告", "营销", "AI广告"], severity: "high" }
        ],
        penalty: {
          type: "fine",
          description: "发布虚假广告",
          statutoryPenalty: "处广告费用三倍以上五倍以下的罚款，广告费用无法计算或者明显偏低的，处二十万元以上一百万元以下的罚款"
        },
        keywords: ["虚假广告", "消费者", "误导", "广告真实性"]
      },
      {
        id: "ad-law-art-14",
        regulationId: "reg-ad-law-2021",
        articleOrder: 2,
        articleNumber: "第14条",
        title: "广告可识别性",
        content: "广告应当具有可识别性，能够使消费者辨明其为广告。大众传播媒介不得以新闻报道形式变相发布广告。通过大众传播媒介发布的广告应当显著标明\u201C广告\u201D，与其他非广告信息相区别，不得使消费者产生误解。",
        obligations: [
          { type: "mandatory", target: "广告标识", triggerKeywords: ["广告", "软文", "营销内容", "推广", "种草"], severity: "medium" }
        ],
        keywords: ["广告标识", "可识别性", "营销", "软文"]
      }
    ]
  },

  // ========== 附录C. 未成年人保护法（网络专章）[保留] ==========
  {
    id: "reg-minor-law-2020",
    title: "中华人民共和国未成年人保护法",
    shortTitle: "未成年人保护法",
    documentNumber: "中华人民共和国主席令第57号",
    issuingBody: "全国人民代表大会常务委员会",
    lawType: "law",
    legalLevel: "law",
    publishDate: "2020-10-17",
    effectiveDate: "2021-06-01",
    status: "effective",
    category: "consumer",
    subCategory: "法律",
    industry: "未成年人保护",
    crossBorderLevel: "★",
    keywords: ["未成年人", "青少年", "儿童", "网络保护", "防沉迷"],
    summary: "新增网络保护专章，规定网络服务提供者面向未成年人的特殊保护义务，包括防沉迷、内容过滤、信息保护等。（不在数据合规专项清单中，但引擎依赖）",
    source: "existing_code",
    articles: [
      {
        id: "minor-law-art-75",
        regulationId: "reg-minor-law-2020",
        articleOrder: 1,
        articleNumber: "第75条",
        title: "未成年人网络保护义务",
        content: "网络游戏、网络直播、网络音视频、网络社交等网络服务提供者应当针对未成年人使用其服务设置相应的时间管理、权限管理、消费管理等功能。网络服务提供者发现用户发布、传播含有危害未成年人身心健康内容的信息的，应当立即停止传输，采取删除、屏蔽、断开链接等处置措施，保存有关记录，并向网信、公安等部门报告。",
        obligations: [
          { type: "mandatory", target: "未成年人保护措施", triggerKeywords: ["未成年人", "青少年", "儿童", "学生", "未成年"], severity: "critical" },
          { type: "mandatory", target: "内容过滤", triggerKeywords: ["未成年人", "少儿", "儿童"], severity: "high" }
        ],
        penalty: {
          type: "shutdown",
          description: "未履行未成年人网络保护义务",
          statutoryPenalty: "责令改正，给予警告，没收违法所得；拒不改正或者情节严重的，可以责令暂停相关业务、停业整顿、关闭网站、吊销相关业务许可证或者吊销营业执照"
        },
        keywords: ["未成年人", "防沉迷", "内容过滤", "儿童保护"]
      }
    ]
  }
];

// ============================================================
// 统计汇总
// ============================================================

/** 法规总数 */
export const REGULATION_COUNT = REGULATORY_LIBRARY.length;

/** 按法律类型统计 */
export const REGULATION_COUNT_BY_TYPE: Record<string, number> = {};
for (const r of REGULATORY_LIBRARY) {
  REGULATION_COUNT_BY_TYPE[r.lawType] = (REGULATION_COUNT_BY_TYPE[r.lawType] || 0) + 1;
}

/** 含完整条款的法规数 */
export const REGULATIONS_WITH_ARTICLES = REGULATORY_LIBRARY.filter(
  (r) => r.articles.length > 0 && r.articles[0].dataStatus !== "metadata_only"
).length;

/** 仅含元数据的法规数 */
export const REGULATIONS_METADATA_ONLY = REGULATORY_LIBRARY.filter(
  (r) => r.articles.length === 0 || (r.articles.length === 1 && r.articles[0].dataStatus === "metadata_only")
).length;

// ============================================================
// 索引与查询工具函数
// ============================================================

/** 所有法规的扁平化条款列表 */
export const ALL_ARTICLES: RegulatoryArticle[] = REGULATORY_LIBRARY.flatMap(
  (reg) => reg.articles.map((a) => ({ ...a, regulationId: reg.id }))
);

/** 按法规ID查找 */
export function getRegulationById(id: string): Regulatory | undefined {
  return REGULATORY_LIBRARY.find((r) => r.id === id);
}

/** 按条款ID查找 */
export function getArticleById(id: string): RegulatoryArticle | undefined {
  return ALL_ARTICLES.find((a) => a.id === id);
}

/** 按类别筛选 */
export function getRegulationsByCategory(category: string): Regulatory[] {
  return REGULATORY_LIBRARY.filter((r) => r.category === category);
}

/** 按法律类型筛选 */
export function getRegulationsByType(lawType: Regulatory["lawType"]): Regulatory[] {
  return REGULATORY_LIBRARY.filter((r) => r.lawType === lawType);
}

/** 按行业筛选 */
export function getRegulationsByIndustry(industry: string): Regulatory[] {
  return REGULATORY_LIBRARY.filter((r) => r.industry === industry);
}

/** 按出海等级筛选 */
export function getRegulationsByCrossBorderLevel(level: "★★" | "★" | "—"): Regulatory[] {
  return REGULATORY_LIBRARY.filter((r) => r.crossBorderLevel === level);
}

/** 获取现行有效的法规 */
export function getEffectiveRegulations(): Regulatory[] {
  return REGULATORY_LIBRARY.filter((r) => r.status === "effective");
}

/** 关键词检索条款 */
export function searchArticlesByKeyword(query: string): RegulatoryArticle[] {
  const q = query.toLowerCase();
  return ALL_ARTICLES.filter(
    (a) =>
      a.content.toLowerCase().includes(q) ||
      a.keywords.some((kw) => kw.includes(q)) ||
      a.obligations.some((o) => o.triggerKeywords.some((tk) => tk.includes(q)))
  );
}

/** 全文检索（法规+条款） */
export function fullTextSearch(query: string): {
  regulation: Regulatory;
  article: RegulatoryArticle;
  relevanceScore: number;
}[] {
  const q = query.toLowerCase();
  const results: { regulation: Regulatory; article: RegulatoryArticle; relevanceScore: number }[] = [];

  for (const reg of REGULATORY_LIBRARY) {
    for (const article of reg.articles) {
      let score = 0;

      // 关键词匹配得分
      for (const kw of article.keywords) {
        if (q.includes(kw.toLowerCase())) score += 10;
      }
      // 全文匹配得分
      if (article.content.toLowerCase().includes(q)) score += 5;
      // 标题匹配得分
      if (article.title?.toLowerCase().includes(q)) score += 8;
      // 义务触发词匹配得分
      for (const ob of article.obligations) {
        for (const tk of ob.triggerKeywords) {
          if (q.includes(tk.toLowerCase())) score += 15;
        }
      }

      if (score > 0) {
        results.push({ regulation: reg, article, relevanceScore: score });
      }
    }
  }

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/** 按义务严重等级筛选 */
export function getArticlesBySeverity(severity: "critical" | "high" | "medium" | "low"): RegulatoryArticle[] {
  return ALL_ARTICLES.filter((a) => a.obligations.some((o) => o.severity === severity));
}
