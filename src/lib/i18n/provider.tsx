"use client";
import { Children, cloneElement, createContext, isValidElement, useContext, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { locales, resolveLocale, translate, type Locale } from './core';
import originalText from './original.json';
const originals = new Set(originalText);
const LocaleContext = createContext<{locale: Locale; setLocale: (locale: Locale) => void}>({locale:'zh-CN',setLocale:()=>{}});
export const useLocale = () => useContext(LocaleContext);
export function LocaleProvider({children}:{children:ReactNode}) {
  const [locale, setState] = useState<Locale>('zh-CN');
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem('ai-lex-language'); } catch { /* Session-only preferences. */ }
    setState(resolveLocale(new URLSearchParams(location.search).get('lang'), saved, navigator.language));
  }, []);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  function setLocale(next: Locale) {
    if (!locales.includes(next)) return;
    setState(next);
    try { localStorage.setItem('ai-lex-language', next); } catch { /* Still switch the current page. */ }
    const url = new URL(location.href); url.searchParams.set('lang', next); history.replaceState(null, '', url);
  }
  return <LocaleContext.Provider value={{locale,setLocale}}><title>{locale === 'en' ? 'AI Lex · Compliance workspace' : locale === 'zh-TW' ? 'AI Lex · 合規工作區' : 'AI Lex · 合规工作区'}</title>{children}</LocaleContext.Provider>;
}
export function LanguageSelector() {
  const {locale,setLocale}=useLocale();
  return <div className="flex gap-1 px-4 py-2" role="group" aria-label="Language / 语言 / 語言">
    {locales.map(value=><button key={value} type="button" onClick={()=>setLocale(value)} aria-pressed={locale===value} lang={value}
      className={`rounded-lg px-2 py-2 text-xs border ${locale===value?'bg-amber-100 border-amber-700':'bg-white border-gray-300'}`}>
      {{'zh-CN':'简体中文','zh-TW':'繁體中文',en:'English'}[value]}</button>)}
  </div>;
}
/** Translate rendered display nodes, never input values, IDs, URLs, or rule keys.
 * React owns all cloned nodes; no MutationObserver modifies React's DOM. */
export function Localize({children}:{children:ReactNode}) {
  const {locale}=useLocale();
  function walk(node:ReactNode):ReactNode {
    if (typeof node==='string') {
      if (locale!=='zh-CN' && originals.has(node.replace(/\s+/g,' ').trim())) return <span lang="zh-CN" data-original-text="true" title={translate('保留原文，未作官方译文认证。',locale)}>{node}</span>;
      return translate(node,locale);
    }
    if (Array.isArray(node)) return Children.map(node,walk);
    if (!isValidElement(node)) return node;
    const element=node as ReactElement<Record<string,unknown>>;
    if (element.props['data-original-text'] || ['script','style','code'].includes(String(element.type))) return node;
    const props:Record<string,unknown>={};
    for(const key of ['title','placeholder','aria-label','alt']) if(typeof element.props[key]==='string') props[key]=translate(element.props[key] as string,locale);
    if(element.type !== 'textarea' && element.props.children!==undefined) props.children=Children.map(element.props.children as ReactNode,walk);
    return cloneElement(element,props);
  }
  return <>{Children.map(children,walk)}</>;
}
export function DemoNotice() {
  const {locale}=useLocale();
  return <p className="px-5 py-2 text-xs text-stone-600 bg-stone-100 border-b">{translate('研究演示 · 日历为示例，规则适用性需复核。',locale)}<span className="block mt-1">{translate('原始资料与生成内容保留原文；界面语言不会改写依据或用户输入。',locale)}</span></p>;
}
