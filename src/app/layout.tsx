import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import { WorkspaceProvider } from "@/lib/workspace-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "星链 AI Lex — 让合规与开发并行",
  description: "面向 AI 开发者的 Pre-compliance Pipeline，在产品 Day 1 就识别风险、生成备案材料。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <WorkspaceProvider>
          <Sidebar />
          <main className="ml-60 min-h-screen">
            {children}
          </main>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
