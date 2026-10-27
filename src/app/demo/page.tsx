"use client";
import { Localize } from "@/lib/i18n/provider";

import { useState, useCallback } from "react";

// ============================================================
// Types
// ============================================================

interface Activity {
  id: string;
  activityName: string;
  lifecycle: string;
  description: string;
  dataTypes: string[];
  personalData: boolean;
  sensitiveData: boolean;
  aiInvolved: boolean;
  crossBorder: boolean;
}

interface Finding {
  id: string;
  riskLevel: string;
  violatedArticle: string;
  articleOriginalText: string;
  gapDescription: string;
  remediationSuggestion: string;
  relatedActivity: string;
  penaltyRisk?: string;
}

interface RegulationMatch {
  articleId: string;
  regulationTitle: string;
  articleNumber: string;
  articleTitle: string;
  content: string;
  relevanceScore: number;
  matchReason: string;
  obligations: { type: string; target: string; severity: string }[];
}

interface AnalysisResult {
  pipeline: { agentChain: string[]; totalDurationMs: number };
  activities: { totalActivities: number; lifecycleDistribution: Record<string, number> };
  matchingSummary: { totalMatchedArticles: number; uniqueRegulations: number };
  report: {
    overallRiskLevel: string;
    overallRiskScore: number;
    conclusionText: string;
    summary: { critical: number; high: number; medium: number; low: number };
    filingRequired: boolean;
    filingList: { name: string; regulation: string }[];
    securityAssessmentRequired: boolean;
    securityAssessmentReason: string;
  };
  findings: Finding[];
  formattedFindings: string[];
  graphTrace: { totalNodes: number; totalEdges: number; keyPaths: { description: string; nodes: string[] }[] };
}

// LLM Analysis Result Types
interface LLMObligation {
  regulationTitle: string;
  regulationId: string;
  articleNumber: string;
  articleTitle: string;
  obligationType: string;
  severity: string;
  reasoning: string;
  penalty?: { type: string; description: string; maxPenalty: string };
}

interface LLMGap {
  dimension: string;
  riskLevel: string;
  gapDescription: string;
  violatedArticle: string;
  remediationSuggestion: string;
}

interface LLMResult {
  features: Record<string, unknown>;
  obligations: LLMObligation[];
  gaps: LLMGap[];
  overallRiskLevel: string;
  conclusionText: string;
  filingRequired: boolean;
  filingItems: { name: string; urgency: string; regulation: string }[];
  securityAssessmentRequired: boolean;
  crossBorderPath: string;
  unansweredQuestions: string[];
  meta: {
    model: string;
    latencyMs: number;
    thinking: boolean;
    reasoning?: string;
    tokensUsed: number;
  };
}

// ============================================================
// Constants
// ============================================================

const DEMO_SCENARIOS = [
  {
    label: "AI 营销配图",
    emoji: "🎨",
    input: "我要做一个AI生成营销配图的功能：商家上传商品照片，AI自动更换背景并生成营销文案，投放到小红书和抖音。用户需要手机号注册，付费订阅使用。",
    tag: "AI营销 + 深度合成 + 个人信息",
  },
  {
    label: "AI 虚拟伴侣",
    emoji: "💬",
    input: "开发一个AI虚拟伴侣App，用户可以创建虚拟角色进行日常对话和情感交流。需要手机号注册，收集用户兴趣偏好和对话记录来做个性化推荐。",
    tag: "AI陪伴 + 敏感信息 + 未成年人风险",
  },
  {
    label: "AI SEO 工具",
    emoji: "📈",
    input: "做一个AI驱动的SEO优化工具，抓取网页内容分析关键词，自动生成优化后的文章并发布。支持批量处理，需要用户提供网站信息和登录凭证。",
    tag: "AI内容生成 + 数据采集 + 平台合规",
  },
];

// ============================================================
// 法规库数据（含条款原文）
// ============================================================

const REGULATIONS = [
  { id:"reg-gen-ai-2023", title:"生成式人工智能服务管理暂行办法", short:"生成式AI暂行办法", level:"部门规章", date:"2023-08-15", articles:6, cat:"AI", color:"bg-brand-50 border-brand-200" },
  { id:"reg-algorithm-2021", title:"互联网信息服务算法推荐管理规定", short:"算法推荐管理规定", level:"部门规章", date:"2022-03-01", articles:2, cat:"AI", color:"bg-brand-50 border-brand-200" },
  { id:"reg-deep-synthesis-2022", title:"互联网信息服务深度合成管理规定", short:"深度合成管理规定", level:"部门规章", date:"2023-01-10", articles:2, cat:"AI", color:"bg-brand-50 border-brand-200" },
  { id:"reg-pipl-2021", title:"中华人民共和国个人信息保护法", short:"个人信息保护法", level:"法律", date:"2021-11-01", articles:5, cat:"数据隐私", color:"bg-blue-50 border-blue-200" },
  { id:"reg-dsl-2021", title:"中华人民共和国数据安全法", short:"数据安全法", level:"法律", date:"2021-09-01", articles:2, cat:"数据隐私", color:"bg-blue-50 border-blue-200" },
  { id:"reg-csl-2017", title:"中华人民共和国网络安全法", short:"网络安全法", level:"法律", date:"2017-06-01", articles:2, cat:"网络安全", color:"bg-purple-50 border-purple-200" },
  { id:"reg-cpl-2013", title:"中华人民共和国消费者权益保护法", short:"消费者权益保护法", level:"法律", date:"2014-03-15", articles:1, cat:"消费者", color:"bg-green-50 border-green-200" },
  { id:"reg-ad-law-2021", title:"中华人民共和国广告法", short:"广告法", level:"法律", date:"2021-04-29", articles:2, cat:"广告", color:"bg-orange-50 border-orange-200" },
  { id:"reg-minor-law-2020", title:"中华人民共和国未成年人保护法", short:"未成年人保护法", level:"法律", date:"2021-06-01", articles:1, cat:"消费者", color:"bg-pink-50 border-pink-200" },
];

const REGULATION_ARTICLES: Record<string, { id:string; articleNumber:string; title:string; content:string; obligationType:string; obligationTarget:string; severity:string; penalty?:string; keywords:string[] }[]> = {
  "reg-gen-ai-2023": [
    { id:"genai-3", articleNumber:"第3条", title:"基本原则", content:"国家坚持发展和安全并重、促进创新和依法治理相结合的原则，采取有效措施鼓励生成式人工智能创新发展，对生成式人工智能服务实行包容审慎和分类分级监管。", obligationType:"conditional", obligationTarget:"分类分级监管要求", severity:"medium", keywords:["基本原则","分类分级"] },
    { id:"genai-4", articleNumber:"第4条", title:"安全评估与算法备案义务", content:"提供具有舆论属性或者社会动员能力的生成式人工智能服务的，应当按照国家有关规定开展安全评估，并按照《互联网信息服务算法推荐管理规定》履行算法备案手续。", obligationType:"mandatory", obligationTarget:"安全评估与算法备案", severity:"critical", penalty:"拒不改正或者情节严重的，责令暂停提供相关服务，处一万元以上十万元以下罚款", keywords:["安全评估","算法备案","舆论属性"] },
    { id:"genai-7", articleNumber:"第7条", title:"训练数据合规要求", content:"生成式人工智能服务提供者应当依法开展预训练、优化训练等训练数据处理活动，使用具有合法来源的数据和基础模型；涉及知识产权的，不得侵害他人依法享有的知识产权；涉及个人信息的，应当取得个人同意。", obligationType:"mandatory", obligationTarget:"训练数据来源合法", severity:"critical", penalty:"拒不改正的，责令暂停提供相关服务，处一万元以上十万元以下罚款", keywords:["训练数据","知识产权","个人信息"] },
    { id:"genai-9", articleNumber:"第9条", title:"网络信息安全义务", content:"生成式人工智能服务提供者应当依法承担网络信息内容生产者责任，履行网络信息安全义务。涉及个人信息的，依法承担个人信息处理者责任，履行个人信息保护义务。", obligationType:"mandatory", obligationTarget:"网络信息安全义务", severity:"high", keywords:["网络信息安全","个人信息","服务协议"] },
    { id:"genai-12", articleNumber:"第12条", title:"AI生成内容标识义务", content:"生成式人工智能服务提供者应当按照《互联网信息服务深度合成管理规定》对图片、视频等生成内容进行标识。", obligationType:"mandatory", obligationTarget:"内容标识", severity:"high", penalty:"拒不改正或者情节严重的，责令暂停提供相关服务，处一万元以上十万元以下罚款", keywords:["内容标识","深度合成","AI生成"] },
    { id:"genai-15", articleNumber:"第15条", title:"违法信息处置义务", content:"生成式人工智能服务提供者发现违法内容的，应当及时采取停止生成、停止传输、消除等处置措施，并按照有关要求向有关主管部门报告。", obligationType:"mandatory", obligationTarget:"违法内容处置", severity:"critical", keywords:["违法内容","内容审核","处置措施"] },
  ],
  "reg-algorithm-2021": [
    { id:"algo-24", articleNumber:"第24条", title:"算法推荐服务备案", content:"具有舆论属性或者社会动员能力的算法推荐服务提供者应当履行备案手续。算法推荐服务提供者应当在其网站、应用程序等对外提供服务的显著位置公示其备案编号。", obligationType:"mandatory", obligationTarget:"算法备案", severity:"critical", penalty:"拒不改正或者情节严重的，责令暂停信息更新，处一万元以上十万元以下罚款", keywords:["算法备案","备案编号","公示"] },
    { id:"algo-10", articleNumber:"第10条", title:"算法透明度与用户选择", content:"算法推荐服务提供者应当以显著方式告知用户其提供算法推荐服务的情况，并以适当方式公示算法推荐服务的基本原理、目的意图和主要运行机制。应当向用户提供不针对其个人特征的选项，或者向用户提供便捷的关闭算法推荐服务的选项。", obligationType:"mandatory", obligationTarget:"算法透明度告知与关闭选项", severity:"high", keywords:["算法透明度","用户选择","关闭推荐"] },
  ],
  "reg-deep-synthesis-2022": [
    { id:"deep-16", articleNumber:"第16条", title:"深度合成内容标识义务", content:"深度合成服务提供者应当对使用其服务生成或者编辑的信息内容，采取技术措施添加不影响用户使用的标识，并依照法律、行政法规和国家有关规定保存日志信息。涉及人脸、人声等生物识别信息编辑功能的，应当提示深度合成服务使用者依法告知被编辑的个人，并取得其单独同意。", obligationType:"mandatory", obligationTarget:"深度合成内容标识与单独同意", severity:"critical", penalty:"拒不改正的，责令暂停提供相关服务，处一万元以上十万元以下罚款", keywords:["深度合成","内容标识","生物识别","单独同意"] },
    { id:"deep-19", articleNumber:"第19条", title:"辟谣机制", content:"深度合成服务提供者发现利用深度合成服务制作、发布、传播谣言的，应当及时采取辟谣措施，保存有关记录，并向网信部门和有关主管部门报告。", obligationType:"mandatory", obligationTarget:"辟谣机制", severity:"high", keywords:["辟谣","谣言","虚假信息"] },
  ],
  "reg-pipl-2021": [
    { id:"pipl-13", articleNumber:"第13条", title:"个人信息处理合法性基础", content:"符合下列情形之一的，个人信息处理者方可处理个人信息：（一）取得个人的同意；（二）为订立、履行个人作为一方当事人的合同所必需……", obligationType:"mandatory", obligationTarget:"取得同意或满足其他合法性基础", severity:"high", penalty:"情节严重的，处五千万元以下或者上一年度营业额百分之五以下罚款", keywords:["合法性基础","同意","个人信息"] },
    { id:"pipl-17", articleNumber:"第17条", title:"告知义务与隐私政策", content:"个人信息处理者在处理个人信息前，应当以显著方式、清晰易懂的语言真实、准确、完整地向个人告知处理目的、处理方式、个人信息种类、保存期限等事项。", obligationType:"mandatory", obligationTarget:"提供隐私政策", severity:"high", keywords:["隐私政策","告知义务","信息公开"] },
    { id:"pipl-28", articleNumber:"第28条", title:"敏感个人信息处理规则", content:"敏感个人信息包括生物识别、特定身份、医疗健康、金融账户、行踪轨迹等信息。只有在具有特定的目的和充分的必要性并采取严格保护措施的情形下，个人信息处理者方可处理敏感个人信息，并应当取得个人的单独同意。", obligationType:"mandatory", obligationTarget:"单独同意与影响评估", severity:"critical", penalty:"情节严重的，处五千万元以下或者上一年度营业额百分之五以下罚款，并可以责令暂停相关业务或者停业整顿", keywords:["敏感信息","单独同意","生物识别","影响评估"] },
    { id:"pipl-38", articleNumber:"第38条", title:"个人信息跨境传输规则", content:"个人信息处理者因业务等需要，确需向中华人民共和国境外提供个人信息的，应当具备下列条件之一：通过国家网信部门组织的安全评估、经专业机构进行个人信息保护认证、按照国家网信部门制定的标准合同与境外接收方订立合同。", obligationType:"mandatory", obligationTarget:"数据出境安全评估或标准合同", severity:"critical", penalty:"情节严重的，处五千万元以下或者上一年度营业额百分之五以下罚款", keywords:["跨境传输","安全评估","标准合同","数据出境"] },
    { id:"pipl-44", articleNumber:"第44条", title:"数据主体权利", content:"个人对其个人信息的处理享有知情权、决定权，有权限制或者拒绝他人对其个人信息进行处理。", obligationType:"mandatory", obligationTarget:"保障数据主体权利（查阅/更正/删除/撤回同意）", severity:"high", keywords:["知情权","决定权","用户权利"] },
  ],
  "reg-dsl-2021": [
    { id:"dsl-21", articleNumber:"第21条", title:"数据分类分级保护", content:"国家建立数据分类分级保护制度，根据数据在经济社会发展中的重要程度以及一旦遭到篡改、破坏、泄露或者非法获取、非法利用对国家安全、公共利益或者个人、组织合法权益造成的危害程度，对数据实行分类分级保护。", obligationType:"mandatory", obligationTarget:"数据分类分级", severity:"medium", keywords:["分类分级","数据保护","安全制度"] },
    { id:"dsl-27", articleNumber:"第27条", title:"全流程数据安全管理制度", content:"开展数据处理活动应当依照法律、法规的规定，建立健全全流程数据安全管理制度，组织开展数据安全教育培训，采取相应的技术措施和其他必要措施，保障数据安全。", obligationType:"mandatory", obligationTarget:"数据安全管理制度", severity:"high", penalty:"责令改正，给予警告；拒不改正的，处五十万元以上二百万元以下罚款", keywords:["数据安全","管理制度","全流程"] },
  ],
  "reg-csl-2017": [
    { id:"csl-21", articleNumber:"第21条", title:"网络安全等级保护义务", content:"国家实行网络安全等级保护制度。网络运营者应当按照网络安全等级保护制度的要求，履行安全保护义务，保障网络免受干扰、破坏或者未经授权的访问，防止网络数据泄露或者被窃取、篡改。", obligationType:"mandatory", obligationTarget:"等级保护定级备案", severity:"medium", keywords:["等级保护","网络运营","安全义务"] },
    { id:"csl-37", articleNumber:"第37条", title:"数据本地化与出境安全评估", content:"关键信息基础设施的运营者在中华人民共和国境内运营中收集和产生的个人信息和重要数据应当在境内存储。因业务需要，确需向境外提供的，应当按照国家网信部门会同国务院有关部门制定的办法进行安全评估。", obligationType:"mandatory", obligationTarget:"数据本地化存储", severity:"high", keywords:["数据本地化","境外传输","安全评估"] },
  ],
  "reg-cpl-2013": [
    { id:"cpl-20", articleNumber:"第20条", title:"禁止虚假宣传", content:"经营者向消费者提供有关商品或者服务的质量、性能、用途、有效期限等信息，应当真实、全面，不得作虚假或者引人误解的宣传。", obligationType:"prohibitive", obligationTarget:"禁止虚假或引人误解的宣传", severity:"high", penalty:"责令改正，可以根据情节单处或者并处警告、没收违法所得、处以违法所得一倍以上十倍以下的罚款；没有违法所得的，处以五十万元以下的罚款", keywords:["虚假宣传","误导","消费者权益","营销"] },
  ],
  "reg-ad-law-2021": [
    { id:"ad-4", articleNumber:"第4条", title:"广告真实性原则", content:"广告不得含有虚假或者引人误解的内容，不得欺骗、误导消费者。广告主应当对广告内容的真实性负责。", obligationType:"prohibitive", obligationTarget:"禁止虚假广告", severity:"high", penalty:"处广告费用三倍以上五倍以下的罚款，广告费用无法计算或者明显偏低的，处二十万元以上一百万元以下的罚款", keywords:["虚假广告","消费者","误导","AI营销"] },
    { id:"ad-14", articleNumber:"第14条", title:"广告可识别性", content:"广告应当具有可识别性，能够使消费者辨明其为广告。通过大众传播媒介发布的广告应当显著标明\"广告\"，与其他非广告信息相区别，不得使消费者产生误解。", obligationType:"mandatory", obligationTarget:"广告标识", severity:"medium", keywords:["广告标识","可识别性","软文"] },
  ],
  "reg-minor-law-2020": [
    { id:"minor-75", articleNumber:"第75条", title:"未成年人网络保护义务", content:"网络游戏、网络直播、网络音视频、网络社交等网络服务提供者应当针对未成年人使用其服务设置相应的时间管理、权限管理、消费管理等功能。", obligationType:"mandatory", obligationTarget:"未成年人保护措施（防沉迷/内容过滤/消费管理）", severity:"critical", penalty:"拒不改正或者情节严重的，可以责令暂停相关业务、停业整顿、关闭网站、吊销相关业务许可证或者吊销营业执照", keywords:["未成年人","防沉迷","内容过滤","儿童保护"] },
  ],
};

const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-50 border-red-200 text-red-800",
  high: "bg-orange-50 border-orange-200 text-orange-800",
  medium: "bg-yellow-50 border-yellow-200 text-yellow-700",
  low: "bg-green-50 border-green-200 text-green-700",
};

const RISK_LABELS: Record<string, string> = {
  critical: "严重",
  high: "高",
  medium: "中",
  low: "低",
};

const RISK_EMOJI: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🟢",
};

const LIFECYCLE_LABELS: Record<string, string> = {
  collection: "📥 收集",
  storage: "💾 存储",
  processing: "⚙️ 处理",
  transfer: "📤 传输",
  disclosure: "📢 披露",
  deletion: "🗑️ 删除",
};

const LIFECYCLE_COLORS: Record<string, string> = {
  collection: "bg-blue-100 text-blue-700 border-blue-200",
  storage: "bg-purple-100 text-purple-700 border-purple-200",
  processing: "bg-brand-100 text-brand-700 border-brand-200",
  transfer: "bg-amber-100 text-amber-700 border-amber-200",
  disclosure: "bg-orange-100 text-orange-700 border-orange-200",
  deletion: "bg-gray-100 text-gray-600 border-gray-200",
};

// ============================================================
// Sub-components
// ============================================================

function Spinner({ text }: { text: string }) {
  return (
    <Localize><div className="flex items-center gap-3 py-4">
      <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-surface-500">{text}</span>
    </div></Localize>
  );
}

function StepBadge({ step, label, active, done }: { step: number; label: string; active: boolean; done: boolean }) {
  return (
    <Localize><div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
      done ? "bg-green-50 text-green-700 border border-green-200" :
      active ? "bg-brand-100 text-brand-700 border border-brand-200" :
      "bg-gray-100 text-gray-400 border border-gray-200"
    }`}>
      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
        done ? "bg-green-500 text-white" : active ? "bg-brand-500 text-white" : "bg-gray-300 text-white"
      }`}>
        {done ? "✓" : step}
      </span>
      {label}
    </div></Localize>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function DemoPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [llmResult, setLlmResult] = useState<LLMResult | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());
  const [showGraph, setShowGraph] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [expandedReg, setExpandedReg] = useState<string | null>(null);
  const [showThinking, setShowThinking] = useState(false);
  // "rules" | "llm"
  const [analysisMode, setAnalysisMode] = useState<"rules" | "llm">("llm");
  // LLM 子模式：quick(flash,快) | full(pro+thinking,深)
  const [llmMode, setLlmMode] = useState<"quick" | "full">("quick");

  const handleAnalyze = useCallback(async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setActiveStep(0);
    setExpandedFindings(new Set());
    setShowGraph(false);

    try {
      // Simulated step progression for visual feedback
      const stepTimer = setInterval(() => {
        setActiveStep((prev) => {
          if (prev >= 4) { clearInterval(stepTimer); return prev; }
          return prev + 1;
        });
      }, 400);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch("/api/compliance/agent-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: "用户输入项目",
          productDescription: input,
          industry: "ai_marketing",
          features: input.split(/[，,。.；;]/).filter(Boolean).map((s) => s.trim()),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      clearInterval(stepTimer);

      if (!res.ok) {
        console.error("API error:", await res.text());
        return;
      }

      const data = await res.json();
      setResult(data);
      setActiveStep(5);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        console.error("请求超时（30s），请重试");
        setActiveStep(0);
      } else {
        console.error("分析失败:", e);
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const toggleFinding = (id: string) => {
    setExpandedFindings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleScenario = (scenarioInput: string) => {
    setInput(scenarioInput);
    setTimeout(() => {
      if (analysisMode === "llm") handleLLMAnalyze(scenarioInput);
      else handleAnalyzeWithInput(scenarioInput);
    }, 100);
  };

  // ===== LLM 深度分析 =====
  const handleLLMAnalyze = async (text: string) => {
    if (!text.trim() || loading) return;
    console.log("[LLM] Starting analysis with:", text.slice(0, 50));
    setLoading(true);
    setResult(null);
    setLlmResult(null);
    setShowThinking(false);
    setActiveStep(0);

    const stepTimer = setInterval(() => {
      setActiveStep((prev) => (prev >= 2 ? prev : prev + 1));
    }, 800);

    try {
      console.log("[LLM] Fetching API...");
      const res = await fetch("/api/compliance/llm-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: "AI合规分析",
          description: text,
          mode: llmMode,
        }),
      });
      clearInterval(stepTimer);
      console.log("[LLM] Response status:", res.status);

      if (!res.ok) {
        const errText = await res.text();
        console.error("[LLM] API error:", res.status, errText.slice(0, 300));
        setActiveStep(0);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log("[LLM] Response data keys:", Object.keys(data));
      console.log("[LLM] Has error:", !!data.error, "Has obligations:", data.obligations?.length);
      
      if (data.error) {
        console.error("[LLM] Analysis error:", data.error, data.message);
        setActiveStep(0);
        setLoading(false);
        return;
      }

      console.log("[LLM] Setting result:", !!data.obligations, "items");
      setLlmResult(data);
      setActiveStep(3);
      setLoading(false);
      console.log("[LLM] Done - llmResult set, loading false");
    } catch (e: unknown) {
      clearInterval(stepTimer);
      console.error("[LLM] Fetch failed:", e instanceof Error ? e.message : String(e));
      setActiveStep(0);
      setLoading(false);
    }
  };

  const handleAnalyzeWithInput = async (text: string) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setActiveStep(0);
    setExpandedFindings(new Set());
    setShowGraph(false);

    try {
      const stepTimer = setInterval(() => {
        setActiveStep((prev) => (prev >= 4 ? prev : prev + 1));
      }, 350);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch("/api/compliance/agent-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: "用户输入项目",
          productDescription: text,
          industry: "ai_marketing",
          features: text.split(/[，,。.；;]/).filter(Boolean).map((s) => s.trim()),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      clearInterval(stepTimer);

      if (!res.ok) return;
      const data = await res.json();
      setResult(data);
      setActiveStep(5);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        console.error("请求超时（30s），请重试");
        setActiveStep(0);
      } else {
        console.error("分析失败:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Localize><div className="min-h-screen grain relative">
      {/* Ambient blobs */}
      <div className="fixed top-[-80px] right-[-80px] w-[400px] h-[400px] bg-brand-200/[0.10] rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-60px] left-[260px] w-[350px] h-[350px] bg-amber-200/[0.08] rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-100 text-brand-600 border border-brand-200">
              Demo v0.5
            </span>
            <span className="text-[11px] text-surface-400">DeepSeek V4 Pro · 80部法规库 · Thinking推理链</span>
          </div>
          <h1 className="text-[32px] font-extrabold text-[#2d2117] mb-2">
            输入需求，<span className="gradient-brand-text">AI 定位法规</span>，生成合规方案
          </h1>
          <p className="text-sm text-surface-500 max-w-xl">
            自然语言描述产品 → DeepSeek V4 Pro 语义理解 → 匹配80部法规 → 输出结构化合规报告
          </p>
        </div>

        {/* Input Area */}
        <div className="warm-card p-5 mb-5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleAnalyze(); }}
            placeholder="描述你的产品需求，例如：我要做一个AI生成营销配图的功能，商家上传商品照片后AI自动换背景加文案..."
            rows={4}
            className="w-full rounded-xl border border-surface-300/60 px-4 py-3.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 bg-white/80 placeholder:text-surface-400 resize-none"
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-3 gap-4">
            {/* 左侧：模式切换 */}
            <div className="flex items-center gap-2">
              {/* 主模式 */}
              <div className="flex rounded-lg border border-surface-300/40 bg-white/60 p-0.5 shrink-0">
                <button
                  onClick={() => setAnalysisMode("llm")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    analysisMode === "llm"
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-surface-500 hover:text-brand-600"
                  }`}
                >
                  🤖 AI 分析
                </button>
                <button
                  onClick={() => setAnalysisMode("rules")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    analysisMode === "rules"
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-surface-500 hover:text-brand-600"
                  }`}
                >
                  ⚡ 规则引擎
                </button>
              </div>
              {/* 子模式 — 仅 AI 模式 */}
              {analysisMode === "llm" && (
                <div className="flex rounded-lg border border-brand-200/50 bg-white/60 p-0.5 shrink-0">
                  <button
                    onClick={() => setLlmMode("quick")}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      llmMode === "quick"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-surface-500 hover:text-emerald-600"
                    }`}
                    title="Flash 模型 — 快速 + 低成本"
                  >
                    ⚡ Quick
                  </button>
                  <button
                    onClick={() => setLlmMode("full")}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      llmMode === "full"
                        ? "bg-violet-500 text-white shadow-sm"
                        : "text-surface-500 hover:text-violet-600"
                    }`}
                    title="Pro 模型 + Thinking — 深度推理 + 法规全文"
                  >
                    🧠 Full
                  </button>
                </div>
              )}
            </div>
            {/* 右侧：分析按钮 */}
            <button
              onClick={() => analysisMode === "llm" ? handleLLMAnalyze(input) : handleAnalyze()}
              disabled={!input.trim() || loading}
              className="px-6 py-2.5 gradient-brand text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
            >
              {loading ? (analysisMode === "llm" ? (llmMode === "full" ? "深度推理中..." : "AI 分析中...") : "分析中...") : (analysisMode === "llm" ? (llmMode === "full" ? "🧠 深度推理分析 →" : "🤖 AI 智能分析 →") : "⚡ 规则分析 →")}
            </button>
          </div>
          {/* 场景快捷标签 — 独立行，自动换行 */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-surface-200/50">
            <span className="text-[11px] text-surface-400 mr-1 shrink-0">快捷场景：</span>
            {DEMO_SCENARIOS.map((s) => (
              <button
                key={s.label}
                onClick={() => handleScenario(s.input)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-300/40 bg-white/60 text-xs text-surface-500 hover:border-brand-300 hover:text-brand-600 disabled:opacity-50 transition-all"
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading Pipeline Visualization */}
        {loading && (
          <div className="warm-card p-6 mb-5 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-6">
              <StepBadge step={1} label="需求拆解" active={activeStep === 1} done={activeStep > 1} />
              <span className="text-surface-300">→</span>
              <StepBadge step={2} label="法规定位" active={activeStep === 2} done={activeStep > 2} />
              <span className="text-surface-300">→</span>
              <StepBadge step={3} label="图谱扩展" active={activeStep === 3} done={activeStep > 3} />
              <span className="text-surface-300">→</span>
              <StepBadge step={4} label="差距分析" active={activeStep === 4} done={activeStep > 4} />
            </div>
            <div className="flex justify-center">
              {activeStep === 0 && <Spinner text={analysisMode === "llm" ? (llmMode === "full" ? "正在连接 DeepSeek V4 Pro (Thinking)... " : "正在连接 DeepSeek V4 Flash...") : "正在启动 Agent 管道..."} />}
              {activeStep === 1 && <Spinner text={analysisMode === "llm" ? (llmMode === "full" ? "DeepSeek V4 Pro Thinking: 深度推理产品特征..." : "DeepSeek V4 Flash: 语义理解产品特征...") : "Agent 1: 拆解数据处理活动..."} />}
              {activeStep === 2 && <Spinner text={analysisMode === "llm" ? (llmMode === "full" ? "Pro+Thinking 对照 80 部法规全文 + 43 条验证条款..." : "Flash 快速对照 80 部法规标题 + 义务摘要...") : "Agent 2: 检索适用法规..."} />}
              {activeStep === 3 && <Spinner text="AI 生成结构化合规报告..." />}
              {activeStep >= 4 && <span className="text-green-600 text-sm font-semibold">✓ 分析完成</span>}
            </div>
          </div>
        )}

        {/* LLM Analysis Results */}
        {llmResult && (
          <div className="space-y-5 animate-fade-in">
            {/* Meta Bar */}
            <div className="warm-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧠</span>
                  <span className="text-sm font-bold text-[#2d2117]">DeepSeek V4 Pro</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700">
                    {llmResult.meta.thinking ? "Thinking 推理模式" : "标准模式"}
                  </span>
                </div>
                <div className="w-px h-5 bg-surface-300" />
                <div className="text-xs text-surface-500">
                  延迟 {llmResult.meta.latencyMs}ms · {llmResult.meta.tokensUsed} tokens
                </div>
              </div>
              {llmResult.meta.reasoning && (
                <button
                  onClick={() => setShowThinking(!showThinking)}
                  className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-xs text-purple-700 font-medium hover:bg-purple-100 transition-colors"
                >
                  {showThinking ? "收起推理过程" : "👁 查看 AI 推理过程"}
                </button>
              )}
            </div>

            {/* Thinking Panel */}
            {showThinking && llmResult.meta.reasoning && (
              <div className="warm-card p-5 border-2 border-purple-200 bg-purple-50/50 animate-fade-in">
                <h3 className="text-sm font-bold text-purple-800 mb-3">🧠 AI 推理过程（Thinking Chain）</h3>
                <pre className="text-xs text-purple-700 whitespace-pre-wrap leading-relaxed font-mono max-h-[300px] overflow-y-auto">
                  {llmResult.meta.reasoning}
                </pre>
              </div>
            )}

            {/* Summary */}
            <div className="warm-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-surface-400 mb-1">AI 综合风险评估</div>
                  <span className={`text-2xl font-extrabold ${
                    llmResult.overallRiskLevel === "critical" ? "text-red-600" :
                    llmResult.overallRiskLevel === "high" ? "text-orange-600" :
                    llmResult.overallRiskLevel === "medium" ? "text-yellow-600" : "text-green-600"
                  }`}>
                    {RISK_EMOJI[llmResult.overallRiskLevel] || "⚪"} {RISK_LABELS[llmResult.overallRiskLevel] || llmResult.overallRiskLevel}风险
                  </span>
                </div>
                {llmResult.crossBorderPath !== "none" && (
                  <div className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-medium">
                    🌐 数据出境路径：{llmResult.crossBorderPath === "security_assessment" ? "安全评估" : llmResult.crossBorderPath === "standard_contract" ? "标准合同" : llmResult.crossBorderPath}
                  </div>
                )}
              </div>
              <p className="text-sm text-surface-600 mb-4">{llmResult.conclusionText}</p>

              {/* Filing + Security Assessment */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl border ${llmResult.filingRequired ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                  <div className={`text-xs font-bold ${llmResult.filingRequired ? "text-red-700" : "text-green-700"}`}>
                    {llmResult.filingRequired ? "⚠️ 需要办理备案" : "✅ 暂无需强制备案"}
                  </div>
                  {llmResult.filingItems.map((f, i) => (
                    <div key={i} className="text-[10px] text-surface-500 mt-1">• {f.name}（{f.urgency === "immediate" ? "紧急" : f.urgency === "before_launch" ? "上线前" : "持续"}）</div>
                  ))}
                </div>
                <div className={`p-3 rounded-xl border ${llmResult.securityAssessmentRequired ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}`}>
                  <div className={`text-xs font-bold ${llmResult.securityAssessmentRequired ? "text-orange-700" : "text-green-700"}`}>
                    {llmResult.securityAssessmentRequired ? "⚠️ 需要进行安全评估" : "✅ 暂无需安全评估"}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Extraction */}
            <div className="warm-card p-5">
              <h2 className="text-sm font-bold text-[#2d2117] mb-3">🔍 AI 特征提取</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {Object.entries(llmResult.features).map(([key, val]) => {
                  const labelMap: Record<string, string> = {
                    hasGenerativeAI: "生成式AI", aiTechPath: "技术路径", productForm: "产品形态",
                    targetUsers: "目标用户", collectsPersonalData: "收集个人信息",
                    involvesSensitiveData: "敏感信息", involvesCrossBorder: "跨境数据",
                    contentType: "内容类型", deploymentRegion: "部署区域"
                  };
                  const valStr = typeof val === "boolean" ? (val ? "✅" : "❌") : String(val);
                  return (
                    <Localize><div key={key} className="p-2 rounded-lg bg-surface-50 border border-surface-200">
                      <div className="text-[10px] text-surface-400">{labelMap[key] || key}</div>
                      <div className="text-xs font-semibold text-surface-700 mt-0.5">{valStr}</div>
                    </div></Localize>
                  );
                })}
              </div>
            </div>

            {/* Obligations */}
            <div className="warm-card p-5">
              <h2 className="text-sm font-bold text-[#2d2117] mb-4">📋 触发的法规义务（{llmResult.obligations.length} 条）</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {llmResult.obligations.map((ob, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${RISK_COLORS[ob.severity]?.replace(/text-|bg-/g, "") || ""} border-surface-200 bg-white`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${RISK_COLORS[ob.severity] || ""}`}>
                            {RISK_EMOJI[ob.severity] || ""} {RISK_LABELS[ob.severity] || ob.severity}
                          </span>
                          <span className="text-xs text-surface-500">
                            {ob.obligationType === "mandatory" ? "🚫 强制" : ob.obligationType === "prohibitive" ? "⛔ 禁止" : "⚠️ 条件"}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-[#2d2117]">{ob.regulationTitle} · {ob.articleNumber}</div>
                        <div className="text-xs text-surface-500 mt-1">{ob.articleTitle}</div>
                        <div className="text-xs text-surface-400 mt-1 italic">"{ob.reasoning}"</div>
                      </div>
                    </div>
                    {ob.penalty && (
                      <div className="mt-2 text-[10px] text-red-600 bg-red-50 p-2 rounded">
                        <span className="font-semibold">⚠️ {ob.penalty.type}：</span>{ob.penalty.maxPenalty}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Gaps */}
            {llmResult.gaps.length > 0 && (
              <div className="warm-card p-5">
                <h2 className="text-sm font-bold text-[#2d2117] mb-4">🔧 合规差距与整改建议</h2>
                <div className="space-y-2">
                  {llmResult.gaps.map((g, i) => (
                    <div key={i} className="p-3 rounded-xl border border-surface-200 bg-white">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${RISK_COLORS[g.riskLevel] || ""}`}>
                          {RISK_EMOJI[g.riskLevel] || ""} {RISK_LABELS[g.riskLevel] || g.riskLevel}
                        </span>
                        <span className="text-xs text-surface-400">{g.dimension} · {g.violatedArticle}</span>
                      </div>
                      <div className="text-xs text-surface-600 mb-2">{g.gapDescription}</div>
                      <div className="text-xs text-brand-700 bg-brand-50 p-2 rounded">
                        💡 {g.remediationSuggestion}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unanswered Questions */}
            {llmResult.unansweredQuestions.length > 0 && (
              <div className="warm-card p-5 border-2 border-amber-200 bg-amber-50/50">
                <h2 className="text-sm font-bold text-amber-800 mb-3">❓ AI 需要补充了解</h2>
                <ul className="space-y-1">
                  {llmResult.unansweredQuestions.map((q, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Rule Engine Results */}
        {result && !llmResult && (
          <div className="space-y-5 animate-fade-in">
            {/* Summary Bar */}
            <div className="warm-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-surface-400 mb-1">综合风险评估</div>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-extrabold ${
                      result.report.overallRiskLevel === "critical" ? "text-red-600" :
                      result.report.overallRiskLevel === "high" ? "text-orange-600" :
                      result.report.overallRiskLevel === "medium" ? "text-yellow-600" : "text-green-600"
                    }`}>
                      {RISK_EMOJI[result.report.overallRiskLevel]} {RISK_LABELS[result.report.overallRiskLevel]}风险
                    </span>
                    <span className="text-sm text-surface-400">评分 {result.report.overallRiskScore}/100</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-xs text-surface-400">Pipeline</div>
                    <div className="text-sm font-bold text-brand-600">{result.pipeline.totalDurationMs}ms</div>
                  </div>
                  <div className="w-px h-8 bg-surface-300/50" />
                  <div className="text-center">
                    <div className="text-xs text-surface-400">匹配法规</div>
                    <div className="text-sm font-bold text-brand-600">{result.matchingSummary.uniqueRegulations}部</div>
                  </div>
                  <div className="w-px h-8 bg-surface-300/50" />
                  <div className="text-center">
                    <div className="text-xs text-surface-400">图谱节点</div>
                    <div className="text-sm font-bold text-brand-600">{result.graphTrace.totalNodes}</div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-surface-600">{result.report.conclusionText}</p>

              {/* 查看法规库按钮 */}
              <div className="mt-3 pt-3 border-t border-surface-200/50 flex items-center justify-between">
                <button
                  onClick={() => setShowLibrary(!showLibrary)}
                  className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
                >
                  <span>{showLibrary ? "📕" : "📚"}</span>
                  <span>{showLibrary ? "收起法规库" : "查看法规库（"+result.matchingSummary.uniqueRegulations+"部）"}</span>
                </button>
                <span className="text-[10px] text-surface-400">9部法规 · 22条条款 · 含罚则信息</span>
              </div>

              {/* 法规库面板 */}
              {showLibrary && (
                <div className="mt-3 grid grid-cols-1 gap-2 animate-fade-in max-h-[550px] overflow-y-auto pr-1">
                  {REGULATIONS.map((reg) => {
                    const isExpanded = expandedReg === reg.id;
                    return (
                      <Localize><div key={reg.id}>
                        <div
                          onClick={() => setExpandedReg(isExpanded ? null : reg.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${reg.color} ${isExpanded ? "shadow-sm" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-bold text-[#2d2117]">{reg.short}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  reg.level === "法律" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                                }`}>{reg.level}</span>
                                <span className="text-[10px] text-surface-400">{reg.cat}</span>
                              </div>
                              <div className="text-[10px] text-surface-400">{reg.title}</div>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-surface-400 flex-shrink-0 ml-3">
                              <span>生效 {reg.date}</span>
                              <span className="w-px h-3 bg-surface-300/50" />
                              <span className="font-semibold text-surface-600">{reg.articles} 条</span>
                              <span className="text-brand-500 ml-1">{isExpanded ? "▲" : "▼"}</span>
                            </div>
                          </div>
                        </div>

                        {/* 展开的条款详情 */}
                        {isExpanded && (
                          <div className="mt-2 ml-2 pl-4 border-l-2 border-brand-200 space-y-2 animate-fade-in">
                            {(REGULATION_ARTICLES[reg.id] || []).map((art) => (
                              <div key={art.id} className="p-3 rounded-lg bg-white border border-surface-200/60">
                                <div className="flex items-start gap-2 mb-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
                                    art.severity === "critical" ? "bg-red-100 text-red-700" :
                                    art.severity === "high" ? "bg-orange-100 text-orange-700" :
                                    art.severity === "medium" ? "bg-yellow-100 text-yellow-700" :
                                    "bg-green-100 text-green-700"
                                  }`}>
                                    {art.severity === "critical" ? "严重" : art.severity === "high" ? "高" : art.severity === "medium" ? "中" : "低"}
                                  </span>
                                  <div>
                                    <div className="text-sm font-semibold text-[#2d2117]">{art.articleNumber} {art.title}</div>
                                    <div className="text-xs text-surface-500 mt-0.5">
                                      <span className={`px-1 py-0.5 rounded text-[10px] mr-1 ${
                                        art.obligationType === "mandatory" ? "bg-red-50 text-red-600" :
                                        art.obligationType === "prohibitive" ? "bg-orange-50 text-orange-600" :
                                        "bg-blue-50 text-blue-600"
                                      }`}>
                                        {art.obligationType === "mandatory" ? "强制性" : art.obligationType === "prohibitive" ? "禁止性" : "附条件"}
                                      </span>
                                      {art.obligationTarget}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-surface-600 bg-surface-50 p-2.5 rounded-lg leading-relaxed">
                                  <div className="text-[10px] text-surface-400 mb-1 font-medium">📜 原文</div>
                                  {art.content}
                                </div>
                                {art.penalty && (
                                  <div className="mt-2 text-[10px] text-red-600 bg-red-50 p-2 rounded-lg">
                                    <span className="font-semibold">⚠️ 罚则：</span>{art.penalty}
                                  </div>
                                )}
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {art.keywords.map((kw) => (
                                    <span key={kw} className="px-1.5 py-0.5 rounded bg-surface-100 text-[10px] text-surface-500">{kw}</span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div></Localize>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 1: Activities */}
            <div className="warm-card p-5">
              <h2 className="text-sm font-bold text-[#2d2117] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
                需求拆解 — 数据处理活动 ({result.activities.totalActivities} 项)
              </h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.activities.lifecycleDistribution).map(([lc, count]) =>
                  count > 0 ? (
                    <span key={lc} className={`px-3 py-1 rounded-full text-xs font-medium ${LIFECYCLE_COLORS[lc]}`}>
                      {LIFECYCLE_LABELS[lc]} ×{count}
                    </span>
                  ) : null
                )}
              </div>
            </div>

            {/* Step 2: Regulation Matching */}
            <div className="warm-card p-5">
              <h2 className="text-sm font-bold text-[#2d2117] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">2</span>
                法规定位 — 匹配 {result.findings.length} 条合规要求
              </h2>

              {/* Key Risk Distribution */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-5">
                {(["critical", "high", "medium", "low"] as const).map((level) => (
                  <div key={level} className={`p-3 rounded-xl border ${RISK_COLORS[level]} text-center`}>
                    <div className="text-lg font-extrabold">{result.report.summary[level]}</div>
                    <div className="text-[10px] font-medium">{RISK_LABELS[level]}风险</div>
                  </div>
                ))}
              </div>

              {/* Findings Cards */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {result.findings.slice(0, 8).map((f) => (
                  <div
                    key={f.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      RISK_COLORS[f.riskLevel].replace("text-", "border-").replace(/bg-\w+-\d+/, "bg-white")
                    } border-2 hover:shadow-sm`}
                    onClick={() => toggleFinding(f.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${RISK_COLORS[f.riskLevel].split(" ").filter(c => c.startsWith("bg-") || c.startsWith("text-")).join(" ")}`}>
                            {RISK_EMOJI[f.riskLevel]} {RISK_LABELS[f.riskLevel]}
                          </span>
                          <span className="text-sm font-semibold text-[#2d2117]">{f.violatedArticle}</span>
                        </div>
                        <div className="text-xs text-surface-500 line-clamp-2">{f.gapDescription}</div>
                      </div>
                    </div>

                    {expandedFindings.has(f.id) && (
                      <div className="mt-3 pt-3 border-t border-surface-200/50 space-y-2 text-xs animate-fade-in">
                        <div>
                          <span className="font-semibold text-surface-500">原文依据：</span>
                          <span className="text-surface-600">"{f.articleOriginalText.slice(0, 150)}..."</span>
                        </div>
                        <div>
                          <span className="font-semibold text-surface-500">整改建议：</span>
                          <span className="text-brand-700">{f.remediationSuggestion}</span>
                        </div>
                        {f.penaltyRisk && (
                          <div>
                            <span className="font-semibold text-surface-500">⚠️ 处罚风险：</span>
                            <span className="text-red-600">{f.penaltyRisk}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-surface-500">关联活动：</span>
                          <span className="text-surface-500">{f.relatedActivity}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {result.findings.length > 8 && (
                  <div className="text-center text-xs text-surface-400 py-2">
                    共 {result.findings.length} 条，展示前 8 条
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Knowledge Graph */}
            <div className="warm-card p-5">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowGraph(!showGraph)}
              >
                <h2 className="text-sm font-bold text-[#2d2117] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">3</span>
                  法规引用图谱 — {result.graphTrace.totalNodes} 节点 {result.graphTrace.totalEdges} 条边
                </h2>
                <span className="text-xs text-surface-400">{showGraph ? "收起 ▲" : "展开 ▼"}</span>
              </div>

              {showGraph && (
                <div className="mt-4 space-y-2 animate-fade-in">
                  {result.graphTrace.keyPaths.length > 0 ? (
                    result.graphTrace.keyPaths.map((path, i) => (
                      <div key={i} className="p-3 rounded-lg bg-purple-50/50 border border-purple-100">
                        <div className="text-xs text-surface-500 mb-1">{path.description}</div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {path.nodes.map((n, j) => (
                            <span key={j} className="inline-flex items-center">
                              <span className="px-2 py-0.5 rounded bg-white border border-purple-200 text-[10px] text-purple-700 font-medium">
                                {n.length > 20 ? n.slice(0, 18) + "…" : n}
                              </span>
                              {j < path.nodes.length - 1 && (
                                <span className="text-purple-300 text-[10px] mx-0.5">→</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-surface-400 p-3 bg-gray-50 rounded-lg">
                      <div className="mb-2 font-medium text-surface-500">图结构概览</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-white rounded border">
                          <div className="text-lg font-bold text-brand-600">{result.graphTrace.totalNodes}</div>
                          <div className="text-[10px] text-surface-400">节点</div>
                        </div>
                        <div className="p-2 bg-white rounded border">
                          <div className="text-lg font-bold text-purple-600">{result.graphTrace.totalEdges}</div>
                          <div className="text-[10px] text-surface-400">边（引用关系）</div>
                        </div>
                        <div className="p-2 bg-white rounded border">
                          <div className="text-lg font-bold text-amber-600">{result.findings.length}</div>
                          <div className="text-[10px] text-surface-400">合规发现</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 4: Filing + Security Assessment */}
            <div className="warm-card p-5">
              <h2 className="text-sm font-bold text-[#2d2117] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">4</span>
                备案清单与安全评估
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Filing */}
                <div>
                  <div className={`p-3 rounded-xl border ${result.report.filingRequired ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"} mb-3`}>
                    <div className={`text-xs font-bold ${result.report.filingRequired ? "text-red-700" : "text-green-700"}`}>
                      {result.report.filingRequired ? "⚠️ 需要办理备案" : "✅ 暂无需强制备案"}
                    </div>
                  </div>
                  {result.report.filingList.length > 0 && (
                    <div className="space-y-1.5">
                      {result.report.filingList.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-red-400 mt-0.5">•</span>
                          <div>
                            <span className="font-medium text-surface-700">{f.name}</span>
                            <div className="text-surface-400">{f.regulation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Security Assessment */}
                <div>
                  <div className={`p-3 rounded-xl border ${result.report.securityAssessmentRequired ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"} mb-3`}>
                    <div className={`text-xs font-bold ${result.report.securityAssessmentRequired ? "text-orange-700" : "text-green-700"}`}>
                      {result.report.securityAssessmentRequired ? "⚠️ 需要进行安全评估" : "✅ 暂无需安全评估"}
                    </div>
                  </div>
                  <div className="text-xs text-surface-500">{result.report.securityAssessmentReason}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div></Localize>
  );
}
