/**
 * Agent 1 — 需求拆解器 (Decomposer)
 *
 * 功能：将产品功能描述拆解为结构化数据处理活动列表
 * 输入：产品名称 + 功能描述 + 产品形态
 * 输出：按数据生命周期（收集/存储/处理/传输/披露/删除）分类的活动列表
 */

import type { DecomposerInput, DecomposerOutput, DataProcessingActivity, DataLifecycle } from "./types";

// ============================================================
// 活动模板库 — 按产品形态/行业预定义常见活动
// ============================================================

interface ActivityTemplate {
  activityName: string;
  lifecycle: DataLifecycle;
  dataTypes: string[];
  personalData: boolean;
  sensitiveData: boolean;
  crossBorder: boolean;
  aiInvolved: boolean;
  thirdPartyInvolved: boolean;
  regulatoryKeywords: string[];
}

const activityTemplates: Record<string, ActivityTemplate[]> = {
  // AI 营销/GEO 典型活动
  ai_marketing: [
    { activityName: "用户注册与账号管理", lifecycle: "collection", dataTypes: ["basic_identity", "contact"], personalData: true, sensitiveData: false, crossBorder: false, aiInvolved: false, thirdPartyInvolved: false, regulatoryKeywords: ["注册", "手机号", "邮箱", "个人信息"] },
    { activityName: "AI文案生成", lifecycle: "processing", dataTypes: ["content", "behavioral"], personalData: true, sensitiveData: false, crossBorder: false, aiInvolved: true, thirdPartyInvolved: true, regulatoryKeywords: ["生成式AI", "LLM", "大模型", "AI生成", "内容生成"] },
    { activityName: "用户行为数据收集与分析", lifecycle: "processing", dataTypes: ["behavioral", "content"], personalData: true, sensitiveData: false, crossBorder: false, aiInvolved: true, thirdPartyInvolved: false, regulatoryKeywords: ["行为数据", "数据分析", "用户画像", "个人信息"] },
    { activityName: "营销内容发布与分发", lifecycle: "disclosure", dataTypes: ["content"], personalData: false, sensitiveData: false, crossBorder: false, aiInvolved: true, thirdPartyInvolved: false, regulatoryKeywords: ["营销", "广告", "推广", "内容发布"] },
    { activityName: "用户数据存储", lifecycle: "storage", dataTypes: ["basic_identity", "content", "behavioral"], personalData: true, sensitiveData: false, crossBorder: false, aiInvolved: false, thirdPartyInvolved: false, regulatoryKeywords: ["数据存储", "用户数据", "数据安全"] },
    { activityName: "第三方SDK集成（支付/统计）", lifecycle: "transfer", dataTypes: ["basic_identity", "behavioral"], personalData: true, sensitiveData: false, crossBorder: false, aiInvolved: false, thirdPartyInvolved: true, regulatoryKeywords: ["SDK", "第三方", "数据共享"] },
  ],

  // AI 内容生成典型活动
  ai_content: [
    { activityName: "用户注册与身份验证", lifecycle: "collection", dataTypes: ["basic_identity", "contact"], personalData: true, sensitiveData: false, crossBorder: false, aiInvolved: false, thirdPartyInvolved: false, regulatoryKeywords: ["注册", "手机号", "邮箱", "个人信息"] },
    { activityName: "AI图片/视频生成", lifecycle: "processing", dataTypes: ["content"], personalData: false, sensitiveData: false, crossBorder: false, aiInvolved: true, thirdPartyInvolved: true, regulatoryKeywords: ["生成式AI", "深度合成", "AI图片", "AI视频", "内容生成"] },
    { activityName: "用户作品存储与展示", lifecycle: "storage", dataTypes: ["content"], personalData: false, sensitiveData: false, crossBorder: false, aiInvolved: false, thirdPartyInvolved: false, regulatoryKeywords: ["UGC", "用户生成内容", "内容存储"] },
    { activityName: "个性化内容推荐", lifecycle: "processing", dataTypes: ["behavioral"], personalData: true, sensitiveData: false, crossBorder: false, aiInvolved: true, thirdPartyInvolved: false, regulatoryKeywords: ["推荐算法", "个性化推荐", "算法", "用户画像"] },
    { activityName: "内容分享至社交平台", lifecycle: "disclosure", dataTypes: ["content"], personalData: false, sensitiveData: false, crossBorder: false, aiInvolved: false, thirdPartyInvolved: true, regulatoryKeywords: ["分享", "社交平台", "内容传播"] },
  ],

  // AI 陪伴典型活动
  ai_companion: [
    { activityName: "用户注册与实名认证", lifecycle: "collection", dataTypes: ["basic_identity", "contact"], personalData: true, sensitiveData: false, crossBorder: false, aiInvolved: false, thirdPartyInvolved: false, regulatoryKeywords: ["注册", "手机号", "实名认证", "个人信息"] },
    { activityName: "AI对话内容生成", lifecycle: "processing", dataTypes: ["content", "behavioral"], personalData: true, sensitiveData: false, crossBorder: false, aiInvolved: true, thirdPartyInvolved: true, regulatoryKeywords: ["生成式AI", "LLM", "大模型", "对话", "AI生成"] },
    { activityName: "用户偏好与画像分析", lifecycle: "processing", dataTypes: ["behavioral", "content"], personalData: true, sensitiveData: false, crossBorder: false, aiInvolved: true, thirdPartyInvolved: false, regulatoryKeywords: ["用户画像", "偏好分析", "行为数据", "个人信息"] },
    { activityName: "对话记录存储", lifecycle: "storage", dataTypes: ["content"], personalData: true, sensitiveData: true, crossBorder: false, aiInvolved: false, thirdPartyInvolved: false, regulatoryKeywords: ["对话记录", "敏感信息", "数据存储"] },
    { activityName: "未成年人保护验证", lifecycle: "collection", dataTypes: ["basic_identity"], personalData: true, sensitiveData: true, crossBorder: false, aiInvolved: false, thirdPartyInvolved: false, regulatoryKeywords: ["未成年人", "年龄验证", "青少年保护"] },
    { activityName: "账号注销与数据删除", lifecycle: "deletion", dataTypes: ["basic_identity", "content", "behavioral"], personalData: true, sensitiveData: false, crossBorder: false, aiInvolved: false, thirdPartyInvolved: false, regulatoryKeywords: ["注销", "删除", "个人信息"] },
  ],
};

// 通用活动模板（产品描述中检测到的关键词触发补充活动）
const keywordActivityMap: Record<string, ActivityTemplate> = {
  "支付": { activityName: "支付信息收集与处理", lifecycle: "collection", dataTypes: ["sensitive"], personalData: true, sensitiveData: true, crossBorder: false, aiInvolved: false, thirdPartyInvolved: true, regulatoryKeywords: ["支付", "银行卡", "金融", "敏感信息"] },
  "跨境": { activityName: "数据跨境传输", lifecycle: "transfer", dataTypes: ["basic_identity", "content"], personalData: true, sensitiveData: false, crossBorder: true, aiInvolved: false, thirdPartyInvolved: true, regulatoryKeywords: ["跨境", "海外", "境外", "数据传输"] },
  "订阅": { activityName: "订阅付费管理", lifecycle: "collection", dataTypes: ["sensitive"], personalData: true, sensitiveData: true, crossBorder: false, aiInvolved: false, thirdPartyInvolved: true, regulatoryKeywords: ["支付", "订阅", "金融"] },
  "人脸": { activityName: "人脸/生物识别数据采集", lifecycle: "collection", dataTypes: ["sensitive"], personalData: true, sensitiveData: true, crossBorder: false, aiInvolved: true, thirdPartyInvolved: false, regulatoryKeywords: ["人脸识别", "生物识别", "敏感信息", "深度合成"] },
  "定位": { activityName: "位置信息采集", lifecycle: "collection", dataTypes: ["sensitive", "location"], personalData: true, sensitiveData: true, crossBorder: false, aiInvolved: false, thirdPartyInvolved: false, regulatoryKeywords: ["位置", "定位", "敏感信息", "行踪轨迹"] },
  "微调": { activityName: "模型微调训练", lifecycle: "processing", dataTypes: ["content"], personalData: false, sensitiveData: false, crossBorder: false, aiInvolved: true, thirdPartyInvolved: true, regulatoryKeywords: ["训练数据", "微调", "fine-tune", "模型训练"] },
  "未成年人": { activityName: "未成年人信息保护", lifecycle: "processing", dataTypes: ["basic_identity"], personalData: true, sensitiveData: true, crossBorder: false, aiInvolved: false, thirdPartyInvolved: false, regulatoryKeywords: ["未成年人", "儿童", "青少年", "敏感信息"] },
};

// ============================================================
// 核心逻辑
// ============================================================

export function decompose(input: DecomposerInput): DecomposerOutput {
  const activities: DataProcessingActivity[] = [];
  const descText = input.productDescription.toLowerCase();
  let idCounter = 1;

  // Step 1: 按行业加载模板活动
  const templates = activityTemplates[input.industry] || activityTemplates["ai_marketing"];
  for (const tpl of templates) {
    activities.push({
      id: `act-${String(idCounter).padStart(3, "0")}`,
      ...tpl,
      description: `${tpl.activityName} — ${getDefaultDescription(tpl)}`,
    });
    idCounter++;
  }

  // Step 2: 关键词触发的补充活动
  for (const [keyword, tpl] of Object.entries(keywordActivityMap)) {
    if (descText.includes(keyword) && !activities.some((a) => a.activityName === tpl.activityName)) {
      activities.push({
        id: `act-${String(idCounter).padStart(3, "0")}`,
        ...tpl,
        description: `${tpl.activityName} — ${getDefaultDescription(tpl)}`,
      });
      idCounter++;
    }
  }

  // Step 3: 按生命周期排序
  const lifecycleOrder: DataLifecycle[] = ["collection", "storage", "processing", "transfer", "disclosure", "deletion"];
  activities.sort((a, b) => lifecycleOrder.indexOf(a.lifecycle) - lifecycleOrder.indexOf(b.lifecycle));

  // Metadata
  const lifecycleDistribution = {} as Record<DataLifecycle, number>;
  for (const lc of lifecycleOrder) {
    lifecycleDistribution[lc] = activities.filter((a) => a.lifecycle === lc).length;
  }

  const dataTypeSummary = [...new Set(activities.flatMap((a) => a.dataTypes))];

  return {
    activities,
    metadata: {
      totalActivities: activities.length,
      lifecycleDistribution,
      dataTypeSummary,
    },
  };
}

function getDefaultDescription(tpl: ActivityTemplate): string {
  const lifecycleDesc: Record<DataLifecycle, string> = {
    collection: "从用户/设备采集数据",
    storage: "将数据存储于服务器/云端",
    processing: "对数据进行计算、分析或AI处理",
    transfer: "将数据提供给第三方或跨系统传输",
    disclosure: "将数据/内容对外发布或展示",
    deletion: "响应请求删除数据",
  };
  return lifecycleDesc[tpl.lifecycle] || "数据处理活动";
}
