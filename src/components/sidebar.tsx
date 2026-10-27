"use client";
import { Localize } from "@/lib/i18n/provider";

import { LanguageSelector } from "@/lib/i18n/provider";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/demo", label: "合规分析", icon: "🧭", description: "NEW" },
  { href: "/", label: "工作台", icon: "⚡", description: "总览" },
  { href: "/assess", label: "风险初筛", icon: "🔍", description: "PART A" },
  { href: "/review", label: "合规评审", icon: "📋", description: "PART B" },
  { href: "/docs", label: "文档中心", icon: "📄", description: "PART C" },
  { href: "/calendar", label: "合规日历", icon: "📅", description: "日程" },
  { href: "/history", label: "历史记录", icon: "🕐", description: "回溯" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <Localize><aside className="sticky md:fixed left-0 top-0 md:bottom-0 w-full md:w-[260px] bg-surface-0/90 backdrop-blur-xl border-r border-surface-300/40 flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-surface-300/30">
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/tony.svg" alt="Tony 24" width="48" height="48" className="shrink-0" />
          <div>
            <div className="font-bold text-[15px] text-[#2d2117] tracking-tight">
              星链 <span className="gradient-brand-text">AI Lex</span>
            </div>
            <div className="text-[11px] text-surface-400 tracking-wide">
              Pre-compliance Pipeline
            </div>
          </div>
        </Link>
      </div>

      <LanguageSelector />
      {/* Navigation */}
      <nav className="flex md:block flex-1 px-3 py-2 md:space-y-1 overflow-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Localize key={item.href}><Link
              key={item.href}
              href={item.href}
              className={`
                group flex shrink-0 items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative
                ${isActive
                  ? "bg-brand-100/60 text-brand-700 shadow-sm"
                  : "text-[#6b5c4f] hover:text-[#2d2117] hover:bg-surface-200/50"
                }
              `}
            >
              <span className={`text-base transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              <span className={`text-[10px] tracking-wider uppercase ${isActive ? "text-brand-500/70" : "text-surface-400"}`}>
                {item.description}
              </span>
              {isActive && (
                <div className="absolute left-0 w-[3px] h-5 rounded-r-full gradient-brand" />
              )}
            </Link></Localize>
          );
        })}
      </nav>

      {/* Workspace Info */}
      <div className="hidden md:block px-4 py-4 border-t border-surface-300/30">
        <div className="bg-white/80 border border-surface-300/30 p-3 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-xs">
              🏢
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#2d2117] truncate">Demo 工作空间</div>
              <div className="text-[10px] text-surface-400">灵犀文案 · AI 营销</div>
            </div>
          </div>
        </div>
      </div>
    </aside></Localize>
  );
}
