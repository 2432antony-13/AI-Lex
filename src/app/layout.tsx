import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LocaleProvider, DemoNotice } from "@/lib/i18n/provider";
import Sidebar from "@/components/sidebar";
import { WorkspaceProvider } from "@/lib/workspace-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  icons: { icon: "/tony.svg" },
  description: "面向 AI 开发者的 Pre-compliance Pipeline，在产品 Day 1 就识别风险、生成备案材料。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <LocaleProvider><WorkspaceProvider>
          <Sidebar />
          <main className="md:ml-[260px] min-h-screen min-w-0">
            <DemoNotice />
            {children}
          </main>
        </WorkspaceProvider></LocaleProvider>
      </body>
    </html>
  );
}
