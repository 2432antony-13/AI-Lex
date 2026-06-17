"use client";

import Link from "next/link";
import { useState } from "react";

const moduleCards = [
  {
    id: "A",
    href: "/assess",
    title: "风险初筛",
    subtitle: "PART A · 能不能做",
    description: "10 道引导式问题，30 秒输出四维风险简报与备案清单",
    icon: "🔍",
    tag: "设计期",
    stats: "80 部法规",
    accent: "bg-brand-100/50 border-brand-200/60",
    iconBg: "bg-brand-50",
  },
  {
    id: "B",
    href: "/review",
    title: "合规评审",
    subtitle: "PART B · 怎么开发",
    description: "国内法规结构化评审，输出整改清单与备案判断",
    icon: "📋",
    tag: "开发期",
    stats: "5 维度评审",
    accent: "bg-amber-50/60 border-amber-200/50",
    iconBg: "bg-amber-50",
  },
  {
    id: "C",
    href: "/docs",
    title: "文档中心",
    subtitle: "PART C · 怎么上线",
    description: "一键生成用户协议、隐私政策、备案材料包",
    icon: "📄",
    tag: "上线期",
    stats: "6 类模板",
    accent: "bg-orange-50/50 border-orange-200/40",
    iconBg: "bg-orange-50",
  },
  {
    id: "D",
    href: "/demo",
    title: "AI 深度分析",
    subtitle: "PART D · Demo",
    description: "自然语言描述产品 → DeepSeek V4 Pro 智能匹配法规 → 结构化报告",
    icon: "🧠",
    tag: "全流程",
    stats: "LLM 驱动",
    accent: "bg-purple-50/50 border-purple-200/40",
    iconBg: "bg-purple-50",
  },
];

const demoScenarios = [
  { key: "ai_marketing", name: "灵犀文案", tag: "AI 营销/GEO", emoji: "✍️", desc: "AI 营销文案生成平台" },
  { key: "ai_content", name: "创绘", tag: "AI 内容生成", emoji: "🎨", desc: "AI 图片与视频生成工具" },
  { key: "ai_companion", name: "星语", tag: "AI 陪伴", emoji: "💬", desc: "AI 情感陪伴对话应用" },
];

const stats = [
  { label: "覆盖法规", value: "80", unit: "部", color: "text-brand-600" },
  { label: "验证条款", value: "43", unit: "条", color: "text-brand-500" },
  { label: "文档模板", value: "6", unit: "类", color: "text-amber-600" },
  { label: "AI 分析", value: "DeepSeek", unit: "V4", color: "text-purple-600" },
];

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen grain relative">
      {/* Warm ambient blobs */}
      <div className="fixed top-[-100px] right-[-100px] w-[500px] h-[500px] bg-brand-200/[0.12] rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-80px] left-[260px] w-[400px] h-[400px] bg-amber-200/[0.10] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-8 py-14">
        {/* Hero */}
        <section className="mb-16 animate-fade-in">
          <div className="flex items-center gap-3 mb-5">
            <span className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase gradient-brand text-white shadow-sm">
              Demo v0.5
            </span>
            <span className="text-[11px] text-surface-400">
              DeepSeek V4 Pro · 80部法规 · 数据合规 + AI合规
            </span>
          </div>
          <h1 className="text-[42px] font-extrabold tracking-tight mb-4 leading-tight">
            <span className="text-[#2d2117]">让合规从</span>
            <span className="gradient-brand-text"> 阻塞点 </span>
            <span className="text-[#2d2117]">变成</span>
            <span className="gradient-brand-text"> 加速器</span>
          </h1>
          <p className="text-[#6b5c4f] text-[15px] leading-[1.8] max-w-xl">
            回答 10 个问题，自动识别合规风险 → 生成评审单 → 一键输出文档包。
            <br />
            用产品化手段帮创业团队
            <span className="text-brand-600 font-semibold">「偷出」三个月的时间差</span>。
          </p>
        </section>

        {/* Quick Demo Scenarios */}
        <section className="mb-12 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xs font-bold text-brand-600 tracking-wider uppercase">⚡ 快速演示</h2>
            <div className="flex-1 section-line" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {demoScenarios.map((s) => (
              <Link
                key={s.key}
                href={`/assess?scenario=${s.key}`}
                className="warm-card p-5 group cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl group-hover:animate-float">{s.emoji}</span>
                  <div>
                    <div className="text-sm font-bold text-[#2d2117] group-hover:text-brand-600 transition-colors">
                      {s.name}
                    </div>
                    <div className="text-[11px] text-surface-400">{s.tag}</div>
                  </div>
                </div>
                <p className="text-[12px] text-[#9c8d80] mb-3">{s.desc}</p>
                <div className="text-[10px] text-brand-500 font-semibold tracking-wider uppercase group-hover:text-brand-600 transition-colors">
                  一键体验完整流程 →
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Module Cards A / B / C */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-5 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <h2 className="text-xs font-bold text-brand-600 tracking-wider uppercase">🧭 合规工作台</h2>
            <div className="flex-1 section-line" />
          </div>
          <div className="grid grid-cols-4 gap-4 stagger-children">
            {moduleCards.map((card) => (
              <Link
                key={card.id}
                href={card.href}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="warm-card p-6 group cursor-pointer relative overflow-hidden"
              >
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center transition-transform duration-300 ${hoveredCard === card.id ? "scale-110" : ""}`}>
                      <span className="text-2xl">{card.icon}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-surface-100 text-[#9c8d80] border border-surface-300/30">
                      {card.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-[#2d2117] mb-1 group-hover:text-brand-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-brand-500/60 font-semibold tracking-wider uppercase mb-3">
                    {card.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-[13px] text-[#6b5c4f] leading-relaxed mb-5 group-hover:text-[#2d2117] transition-colors">
                    {card.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-surface-200/60">
                    <span className="text-[11px] text-surface-400">{card.stats}</span>
                    <span className="text-xs text-brand-500 font-semibold group-hover:text-brand-600 transition-colors">
                      进入 →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="mb-14 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xs font-bold text-brand-600 tracking-wider uppercase">📊 法规库与 AI 能力</h2>
            <div className="flex-1 section-line" />
            <span className="text-[10px] text-surface-400 tracking-wider">DeepSeek V4 Pro · 自有法规知识体系</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="warm-card p-5 text-center group">
                <div className={`text-3xl font-extrabold ${s.color} mb-1`}>
                  {s.value}
                  <span className="text-xs font-normal text-surface-400 ml-0.5">{s.unit}</span>
                </div>
                <div className="text-[11px] text-[#9c8d80] font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Pre-compliance Pipeline Diagram */}
        <section className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xs font-bold text-brand-600 tracking-wider uppercase">🚀 Pre-compliance Pipeline</h2>
            <div className="flex-1 section-line" />
          </div>
          <div className="warm-card p-7">
            <div className="space-y-6">
              {/* Traditional */}
              <div>
                <div className="text-[10px] text-[#9c8d80] font-semibold tracking-wider uppercase mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-50 text-red-400 flex items-center justify-center text-[10px]">✗</span>
                  传统路径
                </div>
                <div className="flex items-center gap-1.5">
                  {["产品开发", "开发完成", "发现要备案", "仓促准备", "等待审查", "推迟上线"].map((step, i) => (
                    <div key={i} className="flex items-center gap-1.5 flex-1">
                      <div className="flex-1 py-2 px-2 rounded-xl bg-red-50/80 border border-red-200/40 text-[10px] text-red-500/80 text-center truncate font-medium">
                        {step}
                      </div>
                      {i < 5 && <span className="text-surface-400 text-[10px]">→</span>}
                    </div>
                  ))}
                </div>
                <div className="text-right text-[10px] text-red-400/70 mt-2 font-medium">损失 3+ 个月</div>
              </div>

              {/* Divider */}
              <div className="section-line" />

              {/* Lex */}
              <div>
                <div className="text-[10px] text-brand-600 font-semibold tracking-wider uppercase mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center text-[10px]">✓</span>
                  Lex 路径 — 合规与开发并行
                </div>
                <div className="flex items-center gap-1.5">
                  {["Day 1 风险识别", "Mock 材料并行", "代码 + 合规同步", "开发完 = 可上线"].map((step, i) => (
                    <div key={i} className="flex items-center gap-1.5 flex-1">
                      <div className="flex-1 py-2 px-2 rounded-xl bg-brand-50/80 border border-brand-200/50 text-[10px] text-brand-700 text-center truncate font-medium">
                        {step}
                      </div>
                      {i < 3 && <span className="text-brand-400 text-[10px]">→</span>}
                    </div>
                  ))}
                </div>
                <div className="text-right text-[10px] text-brand-500/70 mt-2 font-medium">0 天延误 🎯</div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 pt-6 border-t border-surface-300/30 text-center animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <p className="text-[11px] text-[#9c8d80]">
            星链 AI Lex · Demo v0.5 · 80部数据合规法规库 · DeepSeek V4 Pro 驱动
          </p>
          <p className="text-[10px] text-surface-400 mt-1.5">
            ⚠️ AI 辅助生成内容不构成法律意见，重大决策前请咨询专业律师
          </p>
        </footer>
      </div>
    </div>
  );
}
