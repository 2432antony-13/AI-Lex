"use client";
import { Localize } from "@/lib/i18n/provider";

import { useState, useMemo } from "react";
import { useWorkspace } from "@/lib/workspace-context";

const CALENDAR_EVENTS: Record<string, {
  title: string;
  date: string;
  type: "filing_deadline" | "regulatory_update" | "todo" | "milestone";
  description: string;
}[]> = {
  "ws-marketing": [
    { title: "算法备案截止日", date: "2026-09-15", type: "filing_deadline", description: "提交算法备案材料至网信办系统" },
    { title: "生成式AI服务备案", date: "2026-09-15", type: "filing_deadline", description: "生成式AI服务备案（与算法备案同期）" },
    { title: "ICP备案到期续期", date: "2026-12-01", type: "filing_deadline", description: "ICP 备案年度审核" },
    { title: "清朗行动新规发布", date: "2026-07-01", type: "regulatory_update", description: "中央网信办 AI 营销专项治理新规" },
    { title: "隐私政策年度审查", date: "2026-10-01", type: "todo", description: "检查隐私政策是否需要更新" },
    { title: "算法备案材料准备", date: "2026-06-20", type: "filing_deadline", description: "提前准备算法备案所需的制度说明、数据流程图等材料" },
    { title: "AI营销合规新规解读", date: "2026-06-15", type: "regulatory_update", description: "市场监管总局发布AI营销内容标识规范，需在产品中增加AI生成标识" },
  ],
  "ws-content": [
    { title: "算法备案截止日", date: "2026-09-15", type: "filing_deadline", description: "提交算法备案材料" },
    { title: "深度合成服务备案", date: "2026-08-01", type: "filing_deadline", description: "深度合成内容标识规范备案" },
    { title: "训练数据合规审查", date: "2026-07-15", type: "todo", description: "检查训练数据来源合法性" },
    { title: "版权合规新规", date: "2026-08-15", type: "regulatory_update", description: "AI生成内容版权管理暂行办法" },
  ],
  "ws-companion": [
    { title: "算法备案截止日", date: "2026-09-15", type: "filing_deadline", description: "提交算法备案材料" },
    { title: "未成年人保护审查", date: "2026-07-30", type: "filing_deadline", description: "提交未成年人保护措施说明" },
    { title: "内容安全审计", date: "2026-08-01", type: "todo", description: "全量内容安全检测" },
    { title: "情感AI伦理指南", date: "2026-10-01", type: "regulatory_update", description: "AI伴侣类产品伦理规范征求意见稿" },
    { title: "用户协议更新", date: "2026-11-01", type: "todo", description: "更新用户协议中的AI交互条款" },
  ],
};

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

type CalendarEvent = (typeof CALENDAR_EVENTS)[string][number];

const typeDotColor: Record<string, string> = {
  filing_deadline: "bg-red-500",
  regulatory_update: "bg-blue-500",
  todo: "bg-yellow-500",
  milestone: "bg-green-500",
};

const typeLabel: Record<string, string> = {
  filing_deadline: "备案截止",
  regulatory_update: "法规更新",
  todo: "待办",
  milestone: "里程碑",
};

const typePillColor: Record<string, string> = {
  filing_deadline: "bg-red-100 text-red-700",
  regulatory_update: "bg-blue-100 text-blue-700",
  todo: "bg-yellow-100 text-yellow-700",
  milestone: "bg-green-100 text-green-700",
};

export default function CalendarPage() {
  const { workspace } = useWorkspace();
  const events = CALENDAR_EVENTS[workspace.id] || CALENDAR_EVENTS["ws-marketing"];
  const [currentMonth, setCurrentMonth] = useState(5); // June 2026
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const year = 2026;

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [events]);

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, currentMonth, 1).getDay();
    const totalDays = new Date(year, currentMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    return cells;
  }, [currentMonth]);

  const isToday = (day: number) => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === currentMonth && now.getDate() === day;
  };

  const formatDate = (day: number) =>
    `${year}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const goToPrev = () => setCurrentMonth((m) => (m === 0 ? 11 : m - 1));
  const goToNext = () => setCurrentMonth((m) => (m === 11 ? 0 : m + 1));

  const hoveredEvents = hoveredDate ? eventsByDate[hoveredDate] || [] : [];
  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  return (
    <Localize><div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">合规日历</h1>
          <p className="text-gray-500 mt-1">{workspace.productName} · {workspace.industry}</p>
        </div>
        <div className="flex gap-2">
          {Object.entries(typeLabel).map(([k, v]) => (
            <span key={k} className={`px-2.5 py-1 rounded-full text-xs font-medium ${typePillColor[k]}`}>{v}</span>
          ))}
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPrev}
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-xl font-bold text-gray-900">
          {MONTHS[currentMonth]} {year}
        </h2>
        <button
          onClick={goToNext}
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {WEEKDAYS.map((wd, i) => (
            <div
              key={wd}
              className={`py-3 text-center text-xs font-semibold tracking-wide ${
                i === 0 || i === 6 ? "text-red-400" : "text-gray-400"
              }`}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7">
          {daysInMonth.map((day, idx) => {
            if (day === null) {
              return <Localize><div key={`empty-${idx}`} className="min-h-[110px] border-b border-r border-gray-100 bg-gray-50/50" /></Localize>;
            }
            const dateStr = formatDate(day);
            const dayEvents = eventsByDate[dateStr] || [];
            const today = isToday(day);
            const hasEvents = dayEvents.length > 0;

            return (
              <Localize><div
                key={dateStr}
                className={`min-h-[110px] border-b border-r border-gray-100 p-2 cursor-pointer transition-all relative group ${
                  today ? "bg-brand-50/50" : hasEvents ? "bg-yellow-50/60" : "hover:bg-gray-50"
                }`}
                onMouseEnter={() => setHoveredDate(dateStr)}
                onMouseLeave={() => setHoveredDate(null)}
                onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
              >
                {/* Date Number */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    today
                      ? "bg-brand-500 text-white"
                      : hasEvents
                      ? "text-brand-700 font-bold"
                      : "text-gray-700"
                  }`}
                >
                  {day}
                </div>

                {/* Event Labels */}
                {hasEvents && (
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((e, i) => (
                      <div
                        key={i}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${
                          e.type === "filing_deadline"
                            ? "bg-red-100 text-red-700 border-l-2 border-red-400"
                            : e.type === "regulatory_update"
                            ? "bg-blue-100 text-blue-700 border-l-2 border-blue-400"
                            : e.type === "todo"
                            ? "bg-yellow-100 text-yellow-700 border-l-2 border-yellow-400"
                            : "bg-green-100 text-green-700 border-l-2 border-green-400"
                        }`}
                      >
                        {e.title.length > 8 ? e.title.slice(0, 8) + "…" : e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-gray-400 pl-1">+{dayEvents.length - 2} 项</div>
                    )}
                  </div>
                )}

                {/* Hover Popover */}
                {hoveredDate === dateStr && dayEvents.length > 0 && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-3 pointer-events-none">
                    <div className="text-xs font-semibold text-gray-400 mb-2">
                      {currentMonth + 1}月{day}日
                    </div>
                    <div className="space-y-2">
                      {dayEvents.map((e, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${typeDotColor[e.type]}`} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{e.title}</div>
                            <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{e.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r border-b border-gray-200 rotate-45" />
                  </div>
                )}
              </div></Localize>
            );
          })}
        </div>
      </div>

      {/* Selected Date Detail Panel */}
      {selectedDate && selectedEvents.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
            <h3 className="font-bold text-gray-900">
              {currentMonth + 1}月{parseInt(selectedDate.split("-")[2])}日 · {selectedEvents.length} 项日程
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="divide-y">
            {selectedEvents.map((e, i) => (
              <div key={i} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 mt-0.5 ${typePillColor[e.type]}`}>
                  {typeLabel[e.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900">{e.title}</div>
                  <p className="text-sm text-gray-500 mt-0.5">{e.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div></Localize>
  );
}
