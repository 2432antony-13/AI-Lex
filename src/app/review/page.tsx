"use client";
import { Localize } from "@/lib/i18n/provider";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useWorkspace } from "@/lib/workspace-context";

// ... (keep all the constants)
const industries = ["AI营销/GEO", "AI内容生成", "AI陪伴", "AI教育", "AI医疗", "其他"];
const productTypes = ["App", "小程序", "Web", "API", "App + Web"];
const teamStages = ["想法阶段", "开发中", "即将上线", "已有用户"];

function ReviewForm() {
  const searchParams = useSearchParams();
  const { workspace } = useWorkspace();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    productName: searchParams.get("name") || workspace.productName,
    productType: "Web",
    industry: workspace.industry,
    description: searchParams.get("desc") || workspace.description,

    collectsPersonalData: false,
    personalDataTypes: "",
    involvesSensitiveData: false,
    involvesCrossBorderData: false,
    usesThirdPartySDK: false,

    usesGenerativeAI: true,
    aiModelProvider: "",
    usesRecommendationAlgorithm: false,
    involvesDeepSynthesis: false,

    hasUserContent: false,
    targetsMinors: false,
    hasPaymentFeature: false,

    deploymentRegion: "中国境内",
    teamStage: "开发中",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const update = (key: string, value: any) => setForm({ ...form, [key]: value });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/review/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
      setStep(4);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const conclusionStyles: Record<string, string> = {
    approved: "bg-green-50 text-green-700 border-green-200",
    conditional: "bg-yellow-50 text-yellow-700 border-yellow-200",
    blocked: "bg-red-50 text-red-700 border-red-200",
  };

  const conclusionLabels: Record<string, string> = {
    approved: "✅ 放行 — 可进入开发",
    conditional: "⚠️ 有条件放行 — 需同步整改",
    blocked: "🔴 阻断 — 需整改后重新评审",
  };

  return (
    <Localize><main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-lg font-bold text-gray-900">AI Lex</a>
        <span className="text-sm text-gray-500">PART B1 · 国内合规评审</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {step === 0 && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">合规评审</h1>
            <p className="text-gray-600 mb-8">
              填写以下信息，系统将基于国内法规（个人信息保护法、生成式AI暂行办法等）对你的产品进行合规评审。
            </p>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">产品名称</span>
                  <input
                    value={form.productName}
                    onChange={(e) => update("productName", e.target.value)}
                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">产品形态</span>
                  <select
                    value={form.productType}
                    onChange={(e) => update("productType", e.target.value)}
                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-500"
                  >
                    {productTypes.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">行业</span>
                  <select
                    value={form.industry}
                    onChange={(e) => update("industry", e.target.value)}
                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-500"
                  >
                    {industries.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">团队阶段</span>
                  <select
                    value={form.teamStage}
                    onChange={(e) => update("teamStage", e.target.value)}
                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-500"
                  >
                    {teamStages.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">产品功能描述</span>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-500"
                  placeholder="描述产品核心功能和使用的技术"
                />
              </label>
              <button onClick={() => setStep(1)} className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">
                下一步：数据合规 →
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">数据合规</h2>
            <div className="space-y-4">
              {[
                { key: "collectsPersonalData", label: "是否收集用户个人信息？", hint: "如手机号、邮箱、位置、行为数据等" },
                { key: "involvesSensitiveData", label: "是否涉及敏感个人信息？", hint: "如人脸、身份证号、银行卡、行踪轨迹等" },
                { key: "involvesCrossBorderData", label: "是否有跨境数据传输？", hint: "使用境外服务器或向境外传输数据" },
                { key: "usesThirdPartySDK", label: "是否使用第三方 SDK 或插件？", hint: "如支付、地图、推送、统计等" },
              ].map((item) => (
                <label key={item.key} className="flex items-start gap-4 p-4 rounded-xl bg-white border cursor-pointer hover:border-brand-300">
                  <input
                    type="checkbox"
                    checked={(form as any)[item.key]}
                    onChange={(e) => update(item.key, e.target.checked)}
                    className="mt-0.5 h-5 w-5 accent-brand-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.hint}</div>
                  </div>
                </label>
              ))}
              {form.collectsPersonalData && (
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">收集的个人信息类型</span>
                  <input
                    value={form.personalDataTypes}
                    onChange={(e) => update("personalDataTypes", e.target.value)}
                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-500"
                    placeholder="如：手机号、邮箱、IP地址、设备信息..."
                  />
                </label>
              )}
              <div className="flex gap-4 mt-8">
                <button onClick={() => setStep(0)} className="flex-1 py-3 border rounded-lg font-medium hover:bg-gray-50">← 上一步</button>
                <button onClick={() => setStep(2)} className="flex-1 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">
                  下一步：AI 合规 →
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">AI 合规</h2>
            <div className="space-y-4">
              {[
                { key: "usesGenerativeAI", label: "是否使用生成式 AI / 大语言模型？", hint: "如 GPT、Claude、文心一言、通义千问等" },
                { key: "usesRecommendationAlgorithm", label: "是否使用推荐算法或个性化推送？", hint: "如信息流推荐、个性化推荐" },
                { key: "involvesDeepSynthesis", label: "是否涉及深度合成技术？", hint: "如 AI 换脸、语音合成、数字人、视频生成等" },
              ].map((item) => (
                <label key={item.key} className="flex items-start gap-4 p-4 rounded-xl bg-white border cursor-pointer hover:border-brand-300">
                  <input
                    type="checkbox"
                    checked={(form as any)[item.key]}
                    onChange={(e) => update(item.key, e.target.checked)}
                    className="mt-0.5 h-5 w-5 accent-brand-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.hint}</div>
                  </div>
                </label>
              ))}
              {form.usesGenerativeAI && (
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">使用的 AI 模型 / 服务商</span>
                  <input
                    value={form.aiModelProvider}
                    onChange={(e) => update("aiModelProvider", e.target.value)}
                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-500"
                    placeholder="如：OpenAI GPT-4、Claude 3.5..."
                  />
                </label>
              )}
              <div className="flex gap-4 mt-8">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border rounded-lg font-medium hover:bg-gray-50">← 上一步</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">
                  下一步：产品交互 →
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">产品交互与运营</h2>
            <div className="space-y-4">
              {[
                { key: "hasUserContent", label: "是否有用户生成内容（UGC）功能？", hint: "如评论、投稿、社区发帖、作品分享等" },
                { key: "targetsMinors", label: "是否面向未成年人？", hint: "如学生群体、青少年用户" },
                { key: "hasPaymentFeature", label: "是否涉及支付或交易功能？", hint: "如订阅、虚拟道具、电商等" },
              ].map((item) => (
                <label key={item.key} className="flex items-start gap-4 p-4 rounded-xl bg-white border cursor-pointer hover:border-brand-300">
                  <input
                    type="checkbox"
                    checked={(form as any)[item.key]}
                    onChange={(e) => update(item.key, e.target.checked)}
                    className="mt-0.5 h-5 w-5 accent-brand-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.hint}</div>
                  </div>
                </label>
              ))}
              <div className="flex gap-4 mt-8">
                <button onClick={() => setStep(2)} className="flex-1 py-3 border rounded-lg font-medium hover:bg-gray-50">← 上一步</button>
                <button
                  onClick={handleSubmit}
                  disabled={!form.productName || !form.description || loading}
                  className="flex-1 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
                >
                  {loading ? "分析中..." : "提交评审 →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {step === 4 && result && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">合规评审报告</h1>
            <p className="text-gray-500 mb-8">《{form.productName}》开发前合规评审 — 中国版</p>

            {/* Conclusion */}
            <div className={`p-6 rounded-xl border ${conclusionStyles[result.conclusion]} mb-6`}>
              <div className="text-2xl font-bold mb-1">{conclusionLabels[result.conclusion]}</div>
              <p className="text-sm opacity-80">{result.conclusionText}</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: "风险项", value: result.summary.total, color: "text-gray-700" },
                { label: "高风险", value: result.summary.high, color: "text-red-600" },
                { label: "中风险", value: result.summary.medium, color: "text-yellow-600" },
                { label: "低风险", value: result.summary.low, color: "text-green-600" },
              ].map((s) => (
                <div key={s.label} className="p-3 bg-white rounded-xl border text-center">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Detail by category */}
            <div className="space-y-4 mb-6">
              {Object.entries(result.categories).map(([key, cat]: [string, any]) => (
                cat.risks.length > 0 && (
                  <details key={key} className="p-4 bg-white rounded-xl border">
                    <summary className="font-semibold text-gray-900 cursor-pointer">
                      {key === "data" && "📊 数据合规"}
                      {key === "ai" && "🤖 AI 与算法合规"}
                      {key === "product" && "📱 产品交互合规"}
                      <span className="text-xs text-gray-400 ml-2">({cat.risks.length} 项)</span>
                    </summary>
                    <div className="mt-3 space-y-2">
                      {cat.risks.map((r: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg bg-gray-50 text-sm">
                          <div className="font-medium">{r.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{r.article}</div>
                          <div className="text-xs text-brand-600 mt-1">→ {r.action}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                )
              ))}
            </div>

            {/* Filing */}
            {result.filingRequired.length > 0 && (
              <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 mb-6">
                <div className="font-semibold text-sm mb-2 text-brand-700">⚡ 需要办理的备案</div>
                <div className="flex flex-wrap gap-2">
                  {result.filingRequired.map((f: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-brand-100 text-brand-700 text-sm rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Remediation */}
            {result.remediation.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">🔧 整改建议</h3>
                <div className="space-y-2">
                  {result.remediation.map((r: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg border text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.priority === "P0" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {r.priority}
                      </span>
                      <div>
                        <div className="text-gray-900">{r.action}</div>
                        <div className="text-xs text-gray-400">{r.reference}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={() => { setStep(0); setResult(null); }} className="flex-1 py-3 border rounded-lg font-medium hover:bg-gray-50">
                重新评审
              </button>
              <a href="/docs" className="flex-1 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 text-center">
                进入文档中心 →
              </a>
            </div>
          </div>
        )}
      </div>
      </main></Localize>
  );
}

export default function ReviewPage() {
  return (
    <Localize><Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500">加载中...</div>}>
      <ReviewForm />
    </Suspense></Localize>
  );
}
