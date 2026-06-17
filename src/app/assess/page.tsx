"use client";

import { useState } from "react";
import { demoScenarios, type ScenarioKey } from "@/lib/demo-scenarios";

const questions = [
  { id: 1, question: "产品核心功能是什么？", hint: "用一句话描述产品能帮用户做什么", type: "text" },
  { id: 2, question: "是否使用生成式 AI 或大语言模型？", hint: "如 GPT、Claude、文心一言、通义千问等", type: "boolean" },
  { id: 3, question: "是否涉及推荐算法或个性化推送？", hint: "如信息流推荐、个性化推荐、内容排序等", type: "boolean" },
  { id: 4, question: "目标用户群体是谁？", hint: "", type: "select", options: ["公众", "企业", "未成年人", "企业+公众"] },
  { id: 5, question: "是否收集用户个人信息？", hint: "如手机号、邮箱、位置、行为数据等", type: "boolean" },
  { id: 6, question: "产品形态是什么？", hint: "", type: "select", options: ["App", "小程序", "Web", "API", "App + Web"] },
  { id: 7, question: "是否面向中国境内用户？", hint: "", type: "boolean" },
  { id: 8, question: "是否有用户生成内容（UGC）功能？", hint: "如评论、投稿、社区发帖等", type: "boolean" },
  { id: 9, question: "是否涉及支付、金融或交易功能？", hint: "", type: "boolean" },
  { id: 10, question: "团队目前处于什么阶段？", hint: "", type: "select", options: ["想法阶段", "开发中", "即将上线", "已有用户"] },
];

export default function AssessPage() {
  // 0=intro, 1-10=questions, 11=followup, 12=result
  const [step, setStep] = useState(0);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [followUps, setFollowUps] = useState<{ id: number; question: string; hint: string; type: string; options?: string[] }[]>([]);
  const [followUpIdx, setFollowUpIdx] = useState(0);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const loadScenario = (key: ScenarioKey) => {
    const s = demoScenarios[key];
    setProductName(s.product_name);
    setDescription(s.description);
    const newAnswers: Record<number, string> = {};
    s.answers.forEach((a, i) => { newAnswers[questions[i].id] = a.a; });
    setAnswers(newAnswers);
  };

  // After Q10, request follow-up questions
  const requestFollowUps = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assess/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "followup",
          productName,
          description,
          answers: questions.map((q) => ({
            questionId: q.id,
            question: q.question,
            answer: answers[q.id] || "",
          })),
        }),
      });
      const data = await res.json();
      if (data.followUps && data.followUps.length > 0) {
        setFollowUps(data.followUps);
        setStep(11); // Go to follow-up mode
      } else {
        // No follow-ups needed, go straight to result
        submitReport();
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // Submit final report with all answers (Q1-10 + follow-ups)
  const submitReport = async () => {
    setLoading(true);
    try {
      const allAnswers = [
        ...questions.map((q) => ({ questionId: q.id, question: q.question, answer: answers[q.id] || "" })),
        ...followUps.map((q) => ({ questionId: q.id, question: q.question, answer: followUpAnswers[q.id] || "" })),
      ];
      const res = await fetch("/api/assess/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "report", productName, description, answers: allAnswers }),
      });
      const data = await res.json();
      setResult(data);
      setStep(12);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const riskColors: Record<string, string> = {
    low: "bg-green-50 text-green-700 border-green-200",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    high: "bg-red-50 text-red-700 border-red-200",
    prohibited: "bg-purple-50 text-purple-700 border-purple-200",
  };
  const riskLabels: Record<string, string> = {
    low: "低风险 ✅", medium: "中等风险 ⚠️", high: "高风险 🔴", prohibited: "禁止 🚫",
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Intro */}
        {step === 0 && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">风险初筛</h1>
            <p className="text-gray-600 mb-2">PART A · 回答 10 题，系统自动追问并生成风险简报</p>
            <p className="text-xs text-gray-400 mb-8 flex items-center gap-1">⚡ 提交后将根据你的回答动态追加 2-3 道针对性追问</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {Object.entries(demoScenarios).map(([key, s]) => (
                <button key={key} onClick={() => loadScenario(key as ScenarioKey)}
                  className="p-4 rounded-xl bg-white border border-gray-200 text-left hover:border-brand-500 hover:shadow-md transition-all">
                  <div className="font-semibold text-sm text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.description.slice(0, 40)}...</div>
                  <div className="text-xs text-brand-600 mt-2">一键填充 →</div>
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">产品名称</span>
                <input value={productName} onChange={(e) => setProductName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500" placeholder="如：灵犀文案" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">产品简介</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500" placeholder="用一两句话描述你的产品能做什么" />
              </label>
            </div>
            <button onClick={() => setStep(1)} disabled={!productName || !description}
              className="mt-8 w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">
              开始答题 →
            </button>
          </div>
        )}

        {/* Questions 1-10 */}
        {step >= 1 && step <= 10 && (
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 text-sm">正在分析中...</p>
              </div>
            ) : (
              <>
            <div className="flex items-center gap-2 mb-8">
              <span className="text-sm text-gray-500">第 {step} / 10 题</span>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${(step/10)*100}%` }} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{questions[step-1].question}</h2>
            {questions[step-1].hint && <p className="text-sm text-gray-500 mb-6">{questions[step-1].hint}</p>}
            <div className="space-y-3">
              {questions[step-1].type === "boolean" ? (
                ["是", "否"].map((opt) => (
                  <button key={opt} onClick={() => {
                    setAnswers({ ...answers, [questions[step-1].id]: opt });
                    if (step === 10) { requestFollowUps(); } else { setStep(step+1); }
                  }}
                    className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-all">{opt}</button>
                ))
              ) : questions[step-1].type === "select" ? (
                questions[step-1].options!.map((opt) => (
                  <button key={opt} onClick={() => {
                    setAnswers({ ...answers, [questions[step-1].id]: opt });
                    if (step === 10) { requestFollowUps(); } else { setStep(step+1); }
                  }}
                    className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-all">{opt}</button>
                ))
              ) : (
                <div>
                  <textarea value={answers[questions[step-1].id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [questions[step-1].id]: e.target.value })} rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-brand-500" placeholder="输入你的回答..." />
                  <button onClick={() => {
                    if (step === 10) { requestFollowUps(); }
                    else { setStep(step+1); }
                  }} disabled={!answers[questions[step-1].id]}
                    className="mt-4 w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">
                    {step === 10 ? "提交 →" : "下一题 →"}
                  </button>
                </div>
              )}
            </div>
            </>
          )}
          </div>
        )}

        {/* Follow-up Questions */}
        {step === 11 && followUps.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">智能追问</span>
              <span className="text-sm text-gray-500">第 {followUpIdx+1} / {followUps.length} 题</span>
            </div>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full mb-8">
              <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${((followUpIdx+1)/followUps.length)*100}%` }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{followUps[followUpIdx].question}</h2>
            <p className="text-sm text-gray-500 mb-6">{followUps[followUpIdx].hint}</p>
            <div className="space-y-3">
              {followUps[followUpIdx].type === "boolean" ? (
                ["是", "否"].map((opt) => (
                  <button key={opt} onClick={() => {
                    setFollowUpAnswers({ ...followUpAnswers, [followUps[followUpIdx].id]: opt });
                    if (followUpIdx + 1 < followUps.length) { setFollowUpIdx(followUpIdx+1); }
                    else { submitReport(); }
                  }} className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-all">{opt}</button>
                ))
              ) : (
                followUps[followUpIdx].options!.map((opt) => (
                  <button key={opt} onClick={() => {
                    setFollowUpAnswers({ ...followUpAnswers, [followUps[followUpIdx].id]: opt });
                    if (followUpIdx + 1 < followUps.length) { setFollowUpIdx(followUpIdx+1); }
                    else { submitReport(); }
                  }} className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-all">{opt}</button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Result */}
        {step === 12 && result && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">风险简报</h1>
            <p className="text-gray-500 mb-8">《{productName}》立项前风险评估</p>

            <div className={`p-6 rounded-xl border ${riskColors[result.riskLevel]} mb-6`}>
              <div className="text-lg font-bold mb-1">{riskLabels[result.riskLevel]}</div>
              <ul className="list-disc list-inside space-y-1">
                {result.summary.map((s: string, i: number) => <li key={i} className="text-sm">{s}</li>)}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {Object.entries(result.dimensions).map(([key, dim]: [string, any]) => (
                <div key={key} className={`p-4 rounded-xl border ${riskColors[dim.level]}`}>
                  <div className="font-semibold text-sm mb-1">
                    {{policy:"政策风险",industry:"行业风险",product:"产品合规风险",data:"数据风险"}[key]}
                  </div>
                  <div className="text-xs opacity-75">{riskLabels[dim.level]}</div>
                  {dim.detail.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-xs space-y-0.5">
                      {dim.detail.map((d: string, i: number) => <li key={i}>{d}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {result.materialsRequired.length > 0 && (
              <div className="p-4 rounded-xl bg-white border mb-4">
                <div className="font-semibold text-sm mb-2">📄 需要准备的材料</div>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                  {result.materialsRequired.map((m: string, i: number) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            )}

            {result.filingRequired.length > 0 && (
              <div className="p-4 rounded-xl bg-white border border-brand-200 bg-brand-50/50 mb-6">
                <div className="font-semibold text-sm mb-2 text-brand-700">⚡ 需要办理的备案</div>
                <ul className="list-disc list-inside text-sm text-brand-600 space-y-0.5">
                  {result.filingRequired.map((f: string, i: number) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}

            <details className="mb-6">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                触发规则详情（{result.triggeredRules.length} 条）
              </summary>
              <div className="mt-3 space-y-2">
                {result.triggeredRules.map((r: any, i: number) => (
                  <div key={i} className="text-xs p-3 rounded-lg bg-gray-50 border">
                    <span className="font-medium">[{r.id}]</span> {r.article}<br/>
                    <span className="text-gray-600">{r.title}</span>
                    {r.action && <><br/><span className="text-brand-600">→ {r.action}</span></>}
                  </div>
                ))}
              </div>
            </details>

            <div className="flex gap-4">
              <button onClick={() => { setStep(0); setResult(null); setFollowUps([]); setFollowUpAnswers({}); setFollowUpIdx(0); }}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">重新评估</button>
              <a href={`/review?name=${encodeURIComponent(productName)}&desc=${encodeURIComponent(description)}`}
                className="flex-1 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 text-center transition-colors">
                进入合规评审 →
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
