<p><img src="../assets/tony.gif" width="112" height="112" alt="Tony 24 · AI-Lex"></p>

[简体中文](../../README.md) · **繁體中文** · [English](../../docs/i18n/README.en.md)

# AI-Lex

**從產品事實，到有依據的合規審查。**

面向 AI 產品團隊的可稽核合規工作流程原型：輸入事實、匹配規則、分析風險、產生草案，再由人複核。

[任務](https://github.com/2432antony-13/AI-Lex/issues) · [文件](../../docs/README.md)

## 目前狀態

研究與示範階段。預設關閉外部模型、驗證和持久化；建置通過不等於規則正確性或法律驗收。

## 快速開始

Node.js 20；環境設定見 .env.example。不要將資料庫遷移當作日常檢查。

```bash
npm ci
# Copy .env.example to .env.local
npm run dev
# http://localhost:3000
npm run build
```

## 能力與範圍

結構化產品事實；規則與風險依據；合規日曆；審查紀錄與文件草案。

部署區域缺失必須保留為未知。法律來源、適用條件和產生內容需要獨立複核。

[原始碼](../../src/) · [文件](../../docs/README.md)

倉庫首頁與產品介面提供 **简体中文 / 繁體中文 / English**。採用 Q 版 **Tony 24** 標識，GitHub 顯示 GIF，產品使用 SVG/CSS 動畫。

[語言覆蓋與原文範圍](../LOCALIZATION.md)
