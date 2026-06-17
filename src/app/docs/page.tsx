"use client";

import { useState } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import { FileText, Shield, AlertTriangle, Download, Package, Copy, Check, ChevronRight, Folder, File } from "lucide-react";

const docTypes = [
  { id: "user_agreement", name: "用户协议", icon: FileText, desc: "涵盖服务内容、AI输出边界、责任限制" },
  { id: "privacy_policy", name: "隐私政策", icon: Shield, desc: "信息收集、使用目的、用户权利" },
  { id: "ai_disclosure", name: "AI服务特别说明", icon: AlertTriangle, desc: "生成内容标识、限制、审核机制" },
];

export default function DocsPage() {
  const { workspace } = useWorkspace();
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["user_agreement", "privacy_policy", "ai_disclosure"]);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [filingResult, setFilingResult] = useState<any>(null);
  const [filingLoading, setFilingLoading] = useState(false);
  const [showFilingModal, setShowFilingModal] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<string>("");
  const [copied, setCopied] = useState("");

  const toggle = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleGenerateDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate/doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: workspace.productName,
          companyName: companyName || undefined,
          types: selectedTypes,
        }),
      });
      const data = await res.json();
      setResult(data);
      setActiveDocTab(selectedTypes[0]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleGenerateFiling = async () => {
    setFilingLoading(true);
    setShowFilingModal(true);
    try {
      const res = await fetch("/api/generate/mock-filing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: workspace.productName,
          description: workspace.description,
        }),
      });
      const data = await res.json();
      setFilingResult(data);
    } catch (e) {
      console.error(e);
    }
    setFilingLoading(false);
  };

  const copyContent = (content: string, key: string) => {
    navigator.clipboard.writeText(content);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">文档中心</h1>
      <p className="text-gray-500 mb-8">PART C — 上线合规文档与备案模板生成</p>

      {/* C1: Legal Text */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-2">C1 · 前台法律文本</h2>
        <p className="text-sm text-gray-500 mb-6">选择需要生成的文档，系统自动填充产品信息</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {docTypes.map((dt) => (
            <label
              key={dt.id}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                selectedTypes.includes(dt.id)
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedTypes.includes(dt.id)}
                onChange={() => toggle(dt.id)}
                className="mt-0.5 accent-brand-600"
              />
              <div>
                <dt.icon size={18} className="text-gray-600 mb-1" />
                <div className="font-medium text-sm text-gray-900">{dt.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{dt.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="公司名称（可选）"
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          />
          <button
            onClick={handleGenerateDocs}
            disabled={selectedTypes.length === 0 || loading}
            className="px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "生成中..." : "生成文档 →"}
          </button>
        </div>

        {/* Document Preview */}
        {result && (
          <div className="mt-6 p-6 bg-white rounded-xl border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {selectedTypes.map((t) => {
                  const dt = docTypes.find((d) => d.id === t)!;
                  return (
                    <button
                      key={t}
                      onClick={() => setActiveDocTab(t)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeDocTab === t ? "bg-brand-100 text-brand-700" : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {dt.name}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => copyContent(result.docs[activeDocTab]?.content || "", activeDocTab)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600"
              >
                {copied === activeDocTab ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                {copied === activeDocTab ? "已复制" : "复制全文"}
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 max-h-[500px] overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                {result.docs[activeDocTab]?.content}
              </pre>
            </div>
          </div>
        )}
      </section>

      {/* C2: ICP Filing Accelerator */}
      <section className="p-6 bg-gradient-to-br from-brand-50 to-blue-50 rounded-xl border border-brand-200 mb-10">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
            <Package size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">C2 · ICP 备案加速器 ⚡</h2>
            <p className="text-sm text-gray-600 mt-1 mb-4">
              基于产品信息自动生成 Mock 备案材料包，包含系统架构说明书、算法自评估报告、备案承诺书。
              <br />
              <span className="text-brand-600 font-medium">在代码没写完时就能拿材料去跑备案流程，帮你「偷出」3 个月时间差。</span>
            </p>
            <button
              onClick={handleGenerateFiling}
              disabled={filingLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              <Package size={17} />
              {filingLoading ? "生成中..." : `生成「${workspace.productName}」备案材料包`}
            </button>
          </div>
        </div>
      </section>

      {/* Filing Modal */}
      {showFilingModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-900">📦 {workspace.productName} — 备案材料包</h3>
                <p className="text-xs text-gray-500 mt-0.5">Mock 版本 · 标注 [待确认] 的字段需自行补充</p>
              </div>
              <button onClick={() => setShowFilingModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {filingLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">正在生成备案材料...</p>
                  </div>
                </div>
              ) : filingResult ? (
                <div>
                  {/* File Tree */}
                  <div className="bg-gray-900 text-gray-100 rounded-xl p-5 font-mono text-sm mb-6">
                    <div className="text-gray-400 mb-1">$ tree {workspace.productName}-备案材料/</div>
                    <div className="space-y-0.5">
                      <div className="text-blue-300">📁 {workspace.productName}-备案材料/</div>
                      {filingResult.files.map((f: any, i: number) => (
                        <div key={i} className="ml-4 text-green-300">
                          📄 {f.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* File Contents */}
                  <div className="space-y-4">
                    {filingResult.files.map((f: any, i: number) => (
                      <details key={i} className="bg-gray-50 rounded-lg border">
                        <summary className="px-4 py-3 cursor-pointer hover:bg-gray-100 flex items-center gap-2 text-sm font-medium text-gray-900">
                          {f.type === "report" ? "📊" : "📄"} {f.name}
                          <span className="text-xs text-gray-400 ml-auto">
                            {f.type === "report" ? "报告" : "文档"}
                          </span>
                        </summary>
                        <div className="px-4 pb-4">
                          <div className="flex justify-end mb-2">
                            <button
                              onClick={() => copyContent(f.content, f.name)}
                              className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-600"
                            >
                              {copied === f.name ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                              {copied === f.name ? "已复制" : "复制"}
                            </button>
                          </div>
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed bg-white rounded-lg p-4 border max-h-64 overflow-y-auto">
                            {f.content}
                          </pre>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-500">⚠️ 以上内容由 AI 自动生成，标注 [待确认] 的字段请务必在提交前核实补充</p>
              <button
                onClick={() => setShowFilingModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
