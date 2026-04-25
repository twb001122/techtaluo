import type { CardDraw, ReadingInterpretation } from "./types";

type AiConfig = {
  baseUrl: string;
  apiKey: string;
  modelId: string;
  systemPrompt?: string;
  userPromptTemplate?: string;
  enabled: boolean;
  thinkingEnabled?: boolean;
  reasoningEffort?: string;
};

type LegacyInterpretation = {
  summary: string;
  cardInsights: string[];
  advancedPreview: string;
};

type FlexibleInterpretation = Partial<ReadingInterpretation> & {
  funnyAction?: string;
  "搞笑行动"?: string;
};

export type AiInterpretationDebug = {
  ok: boolean;
  reason:
    | "config_incomplete"
    | "http_error"
    | "missing_content"
    | "invalid_json_shape"
    | "request_failed"
    | "accepted";
  message: string;
  url?: string;
  model?: string;
  status?: number;
  detail?: string;
};

const DEFAULT_PAYWALL_ROASTS: ReadingInterpretation["paywallRoasts"] = {
  paid: "1块钱就想了解命运？也行，至少你愿意为自己的精神状态出一点预算。",
  unpaid: "1块钱都不花就想了解命运？你的财务策略和感情策略一样，主打一个再看看。"
};

const logAiDebug = (message: string, details?: Record<string, unknown>) => {
  console.warn("[ai-interpretation]", message, details ?? {});
};

export const normalizeChatCompletionsUrl = (baseUrl: string) => {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  return `${trimmed}/chat/completions`;
};

export const normalizeAiReasoningEffort = (value: unknown): "high" | "max" => {
  return value === "high" ? "high" : "max";
};

export const sanitizeModelContent = (content: string) => {
  const withoutThink = content.replace(/<think>[\s\S]*?<\/think>/gi, " ");
  const withoutFences = withoutThink.replace(/```(?:json)?/gi, " ").replace(/```/g, " ");
  return withoutFences.replace(/\s+/g, " ").trim();
};

const extractJsonCandidate = (content: string) => {
  const start = content.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < content.length; index += 1) {
    const char = content[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return content.slice(start, index + 1);
    }
  }

  return null;
};

export const extractJson = (content: string): FlexibleInterpretation | LegacyInterpretation | null => {
  const sanitized = sanitizeModelContent(content);
  try {
    return JSON.parse(sanitized) as FlexibleInterpretation;
  } catch {
    const candidate = extractJsonCandidate(sanitized);
    if (!candidate) return null;
    try {
      return JSON.parse(candidate) as FlexibleInterpretation;
    } catch {
      return null;
    }
  }
};

export const isValidInterpretation = (value: ReadingInterpretation | null): value is ReadingInterpretation => {
  return Boolean(
    value &&
      typeof value.summary === "string" &&
      Array.isArray(value.cardReadings) &&
      value.cardReadings.length === 3 &&
      value.cardReadings.every(
        (item) =>
          item &&
          (item.position === "现状" || item.position === "阻力" || item.position === "建议") &&
          typeof item.cardName === "string" &&
          (item.orientation === "正位" || item.orientation === "逆位") &&
          typeof item.reading === "string"
      ) &&
      typeof value.analysis === "string" &&
      typeof value.insight === "string" &&
      value.paywallRoasts &&
      typeof value.paywallRoasts.paid === "string" &&
      typeof value.paywallRoasts.unpaid === "string"
  );
};

const hasValidCardReadings = (value: unknown): value is ReadingInterpretation["cardReadings"] => {
  return Boolean(
    Array.isArray(value) &&
      value.length === 3 &&
      value.every(
        (item) =>
          item &&
          typeof item === "object" &&
          ((item as ReadingInterpretation["cardReadings"][number]).position === "现状" ||
            (item as ReadingInterpretation["cardReadings"][number]).position === "阻力" ||
            (item as ReadingInterpretation["cardReadings"][number]).position === "建议") &&
          typeof (item as ReadingInterpretation["cardReadings"][number]).cardName === "string" &&
          (((item as ReadingInterpretation["cardReadings"][number]).orientation === "正位") ||
            (item as ReadingInterpretation["cardReadings"][number]).orientation === "逆位") &&
          typeof (item as ReadingInterpretation["cardReadings"][number]).reading === "string"
      )
  );
};

const isFlexibleInterpretation = (value: unknown): value is FlexibleInterpretation => {
  const candidate = value as FlexibleInterpretation;
  const actionField = candidate?.insight ?? candidate?.funnyAction ?? candidate?.["搞笑行动"];
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof candidate.summary === "string" &&
      hasValidCardReadings(candidate.cardReadings) &&
      typeof candidate.analysis === "string" &&
      typeof actionField === "string" &&
      candidate.paywallRoasts &&
      typeof candidate.paywallRoasts.paid === "string" &&
      typeof candidate.paywallRoasts.unpaid === "string"
  );
};

const isLegacyInterpretation = (value: unknown): value is LegacyInterpretation => {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as LegacyInterpretation).summary === "string" &&
      Array.isArray((value as LegacyInterpretation).cardInsights) &&
      (value as LegacyInterpretation).cardInsights.length === 3 &&
      (value as LegacyInterpretation).cardInsights.every((item) => typeof item === "string") &&
      typeof (value as LegacyInterpretation).advancedPreview === "string"
  );
};

export const coerceInterpretation = (value: unknown, draws: CardDraw[]): ReadingInterpretation | null => {
  if (isValidInterpretation(value as ReadingInterpretation | null)) return value as ReadingInterpretation;
  if (isFlexibleInterpretation(value)) {
    return {
      summary: value.summary as string,
      cardReadings: value.cardReadings as ReadingInterpretation["cardReadings"],
      analysis: value.analysis as string,
      insight: (value.insight ?? value.funnyAction ?? value["搞笑行动"]) as string,
      paywallRoasts: value.paywallRoasts as ReadingInterpretation["paywallRoasts"]
    };
  }
  if (!isLegacyInterpretation(value) || draws.length !== 3) return null;

  return {
    summary: value.summary,
    cardReadings: draws.map((draw, index) => ({
      position: draw.position,
      cardName: draw.card.name,
      orientation: draw.orientation === "upright" ? "正位" : "逆位",
      reading: value.cardInsights[index] ?? ""
    })),
    analysis: value.cardInsights.join(" ").trim(),
    insight: value.advancedPreview,
    paywallRoasts: DEFAULT_PAYWALL_ROASTS
  };
};

export const formatDrawsForPrompt = (draws: CardDraw[]) =>
  draws
    .map((draw) => {
      const meaning = draw.orientation === "upright" ? draw.card.uprightMeaning : draw.card.reversedMeaning;
      return `${draw.position}：${draw.card.name}（${draw.orientation === "upright" ? "正位" : "逆位"}）。关键词：${draw.card.aiKeywords.join("、")}。含义：${meaning}。幽默核心：${draw.card.stageLine}。详细介绍：${draw.card.description}`;
    })
    .join("\n");

export const renderPromptTemplate = (template: string, question: string, draws: CardDraw[]) => {
  const normalizedQuestion = question.trim() || "这件事";
  return template
    .replaceAll("{{question}}", normalizedQuestion)
    .replaceAll("{{cards}}", formatDrawsForPrompt(draws))
    .replaceAll("{{drawsJson}}", JSON.stringify(draws, null, 2));
};

export const buildConfiguredAiRequestBody = (config: AiConfig, question: string, draws: CardDraw[]) => {
  return {
    model: config.modelId,
    temperature: 0.8,
    thinking: {
      type: config.thinkingEnabled === false ? "disabled" : "enabled"
    },
    reasoning_effort: normalizeAiReasoningEffort(config.reasoningEffort),
    messages: [
      {
        role: "system",
        content: config.systemPrompt ?? ""
      },
      {
        role: "user",
        content: renderPromptTemplate(config.userPromptTemplate ?? "", question, draws)
      }
    ]
  };
};

export async function attemptConfiguredAiInterpretation(
  question: string,
  draws: CardDraw[],
  config: AiConfig
): Promise<{ interpretation: ReadingInterpretation | null; debug: AiInterpretationDebug }> {
  if (!config.enabled || !config.baseUrl || !config.apiKey || !config.modelId || draws.length !== 3) {
    const debug: AiInterpretationDebug = {
      ok: false,
      reason: "config_incomplete",
      message: "AI 配置不完整或抽牌数量不是 3 张。",
      model: config.modelId || undefined,
      detail: JSON.stringify({
        enabled: config.enabled,
        hasBaseUrl: Boolean(config.baseUrl),
        hasApiKey: Boolean(config.apiKey),
        hasModelId: Boolean(config.modelId),
        drawCount: draws.length
      })
    };
    logAiDebug("Skipped configured AI because config is incomplete", {
      enabled: config.enabled,
      hasBaseUrl: Boolean(config.baseUrl),
      hasApiKey: Boolean(config.apiKey),
      hasModelId: Boolean(config.modelId),
      drawCount: draws.length
    });
    return { interpretation: null, debug };
  }

  const timeoutSignal =
    typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? AbortSignal.timeout(60000)
      : undefined;

  const requestUrl = normalizeChatCompletionsUrl(config.baseUrl);

  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      signal: timeoutSignal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(buildConfiguredAiRequestBody(config, question, draws))
    });

    if (!response.ok) {
      const bodyPreview = await response.text().catch(() => "");
      const debug: AiInterpretationDebug = {
        ok: false,
        reason: "http_error",
        message: `AI 接口返回 HTTP ${response.status}`,
        url: requestUrl,
        model: config.modelId,
        status: response.status,
        detail: bodyPreview.slice(0, 800)
      };
      logAiDebug("Configured AI HTTP error", {
        url: requestUrl,
        status: response.status,
        bodyPreview: bodyPreview.slice(0, 800)
      });
      return { interpretation: null, debug };
    }

    const payload = await response.json().catch(() => null);
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      const debug: AiInterpretationDebug = {
        ok: false,
        reason: "missing_content",
        message: "AI 响应里没有 choices[0].message.content。",
        url: requestUrl,
        model: config.modelId,
        detail: JSON.stringify(payload).slice(0, 800)
      };
      logAiDebug("Configured AI response missing message content", {
        url: requestUrl,
        payloadPreview: JSON.stringify(payload).slice(0, 800)
      });
      return { interpretation: null, debug };
    }

    const parsed = extractJson(content);
    const coerced = coerceInterpretation(parsed, draws);

    if (!coerced) {
      const debug: AiInterpretationDebug = {
        ok: false,
        reason: "invalid_json_shape",
        message: "AI 返回了内容，但 JSON 结构不符合当前解析规则。",
        url: requestUrl,
        model: config.modelId,
        detail: content.slice(0, 1200)
      };
      logAiDebug("Configured AI response could not be coerced into interpretation", {
        url: requestUrl,
        contentPreview: content.slice(0, 1200)
      });
      return { interpretation: null, debug };
    }

    console.info("[ai-interpretation] Configured AI interpretation accepted", {
      url: requestUrl,
      model: config.modelId,
      thinking: config.thinkingEnabled === false ? "disabled" : "enabled",
      reasoningEffort: normalizeAiReasoningEffort(config.reasoningEffort)
    });
    return {
      interpretation: coerced,
      debug: {
        ok: true,
        reason: "accepted",
        message: "已使用配置 AI 解读。",
        url: requestUrl,
        model: config.modelId
      }
    };
  } catch (error) {
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    logAiDebug("Configured AI request failed", { url: requestUrl, model: config.modelId, detail });
    return {
      interpretation: null,
      debug: {
        ok: false,
        reason: "request_failed",
        message: "AI 请求失败或超时。",
        url: requestUrl,
        model: config.modelId,
        detail
      }
    };
  }
}

export async function interpretWithConfiguredAi(question: string, draws: CardDraw[], config: AiConfig): Promise<ReadingInterpretation | null> {
  const result = await attemptConfiguredAiInterpretation(question, draws, config);
  return result.interpretation;
}
