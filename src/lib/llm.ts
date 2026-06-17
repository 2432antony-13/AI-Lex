/**
 * LLM 服务层 — DeepSeek V4 Pro API 封装
 *
 * 兼容 OpenAI Chat Completions API 格式。
 * DeepSeek API 文档: https://api-docs.deepseek.com
 *
 * 使用方式：
 *   import { llmChat, llmChatWithThinking } from "@/lib/llm";
 *   const reply = await llmChat("你好");
 */

// ============================================================
// 类型定义
// ============================================================

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  /** 模型选择，默认 deepseek-v4-flash */
  model?: "deepseek-v4-pro" | "deepseek-v4-flash";
  /** 温度，0-2，默认 0（合规分析需极精确） */
  temperature?: number;
  /** 最大输出 token */
  maxTokens?: number;
  /** 是否启用 Thinking 模式 */
  thinking?: boolean;
  /** JSON 输出模式 */
  jsonMode?: boolean;
  /**
   * 超时（ms）。不设则按模型自动计算：
   * flash=30s, pro=90s, pro+thinking=120s
   */
  timeoutMs?: number;
  /** 失败重试次数，默认 2 */
  retries?: number;
}

export interface LLMResponse {
  content: string;
  /** Thinking 模式下的推理过程 */
  reasoning?: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

// ============================================================
// 核心调用
// ============================================================

const BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const API_KEY = process.env.DEEPSEEK_API_KEY;

function ensureConfigured() {
  if (!API_KEY) {
    throw new Error(
      "DeepSeek API Key 未配置。请在 .env.local 中设置 DEEPSEEK_API_KEY"
    );
  }
}

/**
 * 基础 LLM 对话
 */
export async function llmChat(
  messages: ChatMessage[],
  options: LLMOptions = {}
): Promise<LLMResponse> {
  ensureConfigured();

  const {
    model = "deepseek-v4-flash",  // 默认用 flash（快+便宜），pro 需显式指定
    temperature = 0,
    maxTokens = 4096,
    thinking = false,
    jsonMode = false,
    timeoutMs: inputTimeoutMs,
    retries = 2,
  } = options;

  // 动态超时：flash=30s, pro=90s, pro+thinking=120s
  const timeoutMs =
    inputTimeoutMs ??
    (thinking ? 120_000 : model === "deepseek-v4-pro" ? 90_000 : 30_000);

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };

  if (thinking) {
    body.reasoning_effort = "medium";
  }

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  // ======== Retry 循环（含指数退避）========
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const status = response.status;

        // 4xx 不重试（客户端错误），5xx/429 可重试
        if (status >= 400 && status < 500 && status !== 429) {
          throw new Error(
            `DeepSeek API error ${status}: ${errorBody.slice(0, 500)}`
          );
        }

        // 5xx / 429：准备重试
        throw new Error(
          `DeepSeek API error ${status} (retryable): ${errorBody.slice(0, 200)}`
        );
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      return {
        content: choice?.message?.content ?? "",
        reasoning: choice?.message?.reasoning_content ?? undefined,
        usage: {
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
          totalTokens: data.usage?.total_tokens ?? 0,
        },
        model: data.model ?? model,
        finishReason: choice?.finish_reason ?? "unknown",
      };
    } catch (err) {
      lastError = err as Error;
      clearTimeout(timer);

      // 最后一次尝试失败 → 直接抛出
      if (attempt === retries) break;

      // 判断是否可重试
      const msg = lastError.message;
      const isRetryable =
        msg.includes("retryable") ||
        msg.includes("aborted") ||           // 超时也可重试
        msg.includes("fetch failed") ||
        msg.includes("network");

      if (!isRetryable) break;

      // 指数退避：1s, 2s, 4s...
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(
        `[LLM] Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${msg.slice(0, 100)}`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError ?? new Error("DeepSeek API 调用失败");
}

/**
 * 带 Thinking 模式的对话
 */
export async function llmChatWithThinking(
  messages: ChatMessage[],
  options: Omit<LLMOptions, "thinking"> = {}
): Promise<LLMResponse> {
  return llmChat(messages, { ...options, thinking: true, model: options.model ?? "deepseek-v4-pro" });
}

/**
 * 单轮问答（快捷）
 */
export async function llmAsk(
  prompt: string,
  systemPrompt?: string,
  options?: LLMOptions
): Promise<string> {
  const messages: ChatMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await llmChat(messages, options);
  return response.content;
}

/**
 * JSON 结构输出（快捷）
 */
export async function llmAskJSON<T>(
  prompt: string,
  systemPrompt?: string,
  options?: LLMOptions
): Promise<T> {
  const messages: ChatMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await llmChat(messages, {
    ...options,
    jsonMode: true,
    temperature: 0,
  });

  // 尝试解析 JSON
  const content = response.content.trim();
  // 去掉可能的 markdown 代码块
  const jsonStr = content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(jsonStr) as T;
}

/**
 * 系统状态检查
 */
export async function llmHealthCheck(): Promise<{
  ok: boolean;
  model: string;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const response = await llmChat([{ role: "user", content: "ping" }], {
      maxTokens: 10,
      temperature: 0,
    });
    return {
      ok: true,
      model: response.model,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      ok: false,
      model: "unknown",
      latencyMs: Date.now() - start,
      error: (err as Error).message,
    };
  }
}
