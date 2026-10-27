"use client";
import { Localize } from "@/lib/i18n/provider";

import { useWorkspace } from "@/lib/workspace-context";

const MOCK_SESSIONS: Record<string, {
  id: string;
  type: string;
  typeLabel: string;
  date: string;
  summary: string;
}[]> = {
  "ws-marketing": [
    { id: "s1", type: "risk_brief", typeLabel: "风险简报", date: "2026-06-02 15:30", summary: "中等风险：触发算法备案 + AI内容标识义务" },
    { id: "s2", type: "review_report", typeLabel: "合规评审", date: "2026-06-02 16:00", summary: "有条件放行：需整改2项数据合规问题" },
    { id: "s3", type: "doc_package", typeLabel: "文档生成", date: "2026-06-02 16:30", summary: "生成用户协议、隐私政策、AI说明 3 份文档" },
  ],
  "ws-content": [
    { id: "s5", type: "risk_brief", typeLabel: "风险简报", date: "2026-05-28 10:00", summary: "高风险：触发深度合成备案 + 版权合规风险" },
    { id: "s6", type: "review_report", typeLabel: "合规评审", date: "2026-05-28 11:00", summary: "阻断：需整改训练数据来源问题" },
  ],
  "ws-companion": [
    { id: "s8", type: "risk_brief", typeLabel: "风险简报", date: "2026-05-20 14:00", summary: "中等风险：未成年人保护 + 内容安全审查" },
  ],
};

const typeStyles: Record<string, string> = {
  risk_brief: "bg-blue-100 text-blue-700",
  review_report: "bg-purple-100 text-purple-700",
  doc_package: "bg-green-100 text-green-700",
  mock_filing: "bg-orange-100 text-orange-700",
};

export default function HistoryPage() {
  const { workspace } = useWorkspace();
  const sessions = MOCK_SESSIONS[workspace.id] || [];

  return (
    <Localize><div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">历史记录</h1>
          <p className="text-gray-500 mt-1">{workspace.productName} · 共 {sessions.length} 条记录</p>
        </div>
      </div>

      {sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border p-4 hover:border-gray-300 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeStyles[s.type]}`}>
                    {s.typeLabel}
                  </span>
                  <span className="text-xs text-gray-400">{s.date}</span>
                </div>
                <span className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity text-sm">查看详情 →</span>
              </div>
              <p className="text-sm text-gray-700 mt-2">{s.summary}</p>
              <div className="mt-3 pt-3 border-t border-dashed">
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>📎 触发规则：{s.type === "risk_brief" ? "L1-001, L1-002, L1-005" : s.type === "review_report" ? "L1-005, L1-006, L1-011" : "-"}</span>
                  <span>👤 操作人：Demo User</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border">
          <p className="text-gray-400 mb-2">该工作空间暂无评估记录</p>
          <a href="/assess" className="text-brand-600 text-sm hover:underline">开始第一次风险评估 →</a>
        </div>
      )}
    </div></Localize>
  );
}
