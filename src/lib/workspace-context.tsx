"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Workspace = {
  id: string;
  name: string;
  productName: string;
  industry: string;
  description: string;
};

const PRESET_WORKSPACES: Workspace[] = [
  {
    id: "ws-marketing",
    name: "灵犀文案",
    productName: "灵犀文案",
    industry: "AI营销/GEO",
    description: "基于 GPT 的电商文案生成工具，帮助商家自动生成商品标题、详情页文案和广告素材",
  },
  {
    id: "ws-content",
    name: "创绘",
    productName: "创绘",
    industry: "AI内容生成",
    description: "AI 图片与短视频生成平台，用户输入文字即可生成配图、短视频素材",
  },
  {
    id: "ws-companion",
    name: "星语",
    productName: "星语",
    industry: "AI陪伴",
    description: "AI 虚拟伴侣 App，提供情感陪伴、日常对话、角色扮演功能",
  },
];

type WorkspaceContextType = {
  workspace: Workspace;
  switchWorkspace: (id: string) => void;
  allWorkspaces: Workspace[];
};

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace>(PRESET_WORKSPACES[0]);

  const switchWorkspace = useCallback((id: string) => {
    const ws = PRESET_WORKSPACES.find((w) => w.id === id);
    if (ws) setWorkspace(ws);
  }, []);

  return (
    <WorkspaceContext.Provider value={{ workspace, switchWorkspace, allWorkspaces: PRESET_WORKSPACES }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
