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
  action?: string;
  "行动建议"?: string;
};

type LooseCardReading = {
  position?: unknown;
  cardName?: unknown;
  orientation?: unknown;
  reading?: unknown;
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

const readingPositions: CardDraw["position"][] = ["症状", "解法"];
const legacyPositions = ["现状", "阻力", "建议"];

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
      value.cardReadings.length === readingPositions.length &&
      value.cardReadings.every(
        (item) =>
          item &&
          readingPositions.includes(item.position) &&
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

const hasUsableCardReadings = (value: unknown): value is LooseCardReading[] => {
  return Boolean(
    Array.isArray(value) &&
      value.length >= readingPositions.length &&
      value.every(
        (item) =>
          item &&
          typeof item === "object" &&
          typeof (item as LooseCardReading).cardName === "string" &&
          typeof (item as LooseCardReading).reading === "string"
      )
  );
};

const isFlexibleInterpretation = (value: unknown): value is FlexibleInterpretation => {
  const candidate = value as FlexibleInterpretation;
  const actionField = candidate?.insight ?? candidate?.funnyAction ?? candidate?.["搞笑行动"] ?? candidate?.action ?? candidate?.["行动建议"];
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof candidate.summary === "string" &&
      hasUsableCardReadings(candidate.cardReadings) &&
      typeof candidate.analysis === "string" &&
      typeof actionField === "string"
  );
};

const isLegacyInterpretation = (value: unknown): value is LegacyInterpretation => {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as LegacyInterpretation).summary === "string" &&
      Array.isArray((value as LegacyInterpretation).cardInsights) &&
      (value as LegacyInterpretation).cardInsights.length >= readingPositions.length &&
      (value as LegacyInterpretation).cardInsights.every((item) => typeof item === "string") &&
      typeof (value as LegacyInterpretation).advancedPreview === "string"
  );
};

const normalizeCardReadings = (value: LooseCardReading[], draws: CardDraw[]): ReadingInterpretation["cardReadings"] => {
  return draws.map((draw, index) => {
    const source = value[index];
    return {
      position: draw.position,
      cardName: typeof source?.cardName === "string" && source.cardName.trim() ? source.cardName : draw.card.name,
      orientation: source?.orientation === "正位" || source?.orientation === "逆位" ? source.orientation : draw.orientation === "upright" ? "正位" : "逆位",
      reading: typeof source?.reading === "string" ? source.reading : ""
    };
  });
};

const normalizePaywallRoasts = (value: unknown): ReadingInterpretation["paywallRoasts"] => {
  const candidate = value as Partial<ReadingInterpretation["paywallRoasts"]> | null;
  return {
    paid: typeof candidate?.paid === "string" && candidate.paid.trim() ? candidate.paid : DEFAULT_PAYWALL_ROASTS.paid,
    unpaid: typeof candidate?.unpaid === "string" && candidate.unpaid.trim() ? candidate.unpaid : DEFAULT_PAYWALL_ROASTS.unpaid
  };
};

export const coerceInterpretation = (value: unknown, draws: CardDraw[]): ReadingInterpretation | null => {
  if (isValidInterpretation(value as ReadingInterpretation | null)) return value as ReadingInterpretation;
  if (isFlexibleInterpretation(value)) {
    return {
      summary: value.summary as string,
      cardReadings: normalizeCardReadings(value.cardReadings as LooseCardReading[], draws),
      analysis: value.analysis as string,
      insight: (value.insight ?? value.funnyAction ?? value["搞笑行动"] ?? value.action ?? value["行动建议"]) as string,
      paywallRoasts: normalizePaywallRoasts(value.paywallRoasts)
    };
  }
  if (!isLegacyInterpretation(value) || draws.length !== readingPositions.length) return null;

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
  const thinkingEnabled = config.thinkingEnabled !== false;
  return {
    model: config.modelId,
    temperature: 0.8,
    thinking: {
      type: thinkingEnabled ? "enabled" : "disabled"
    },
    ...(thinkingEnabled ? { reasoning_effort: normalizeAiReasoningEffort(config.reasoningEffort) } : {}),
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
  if (!config.enabled || !config.baseUrl || !config.apiKey || !config.modelId || draws.length !== readingPositions.length) {
    const missingParts = [
      !config.enabled ? "自定义 AI 解读未启用" : "",
      !config.baseUrl ? "Base URL 为空" : "",
      !config.apiKey ? "API Key 为空" : "",
      !config.modelId ? "Model ID 为空" : "",
      draws.length !== readingPositions.length ? `抽牌数量是 ${draws.length}，不是 ${readingPositions.length}` : ""
    ].filter(Boolean);
    const debug: AiInterpretationDebug = {
      ok: false,
      reason: "config_incomplete",
      message: missingParts.join("；") || "AI 配置不完整。",
      model: config.modelId || undefined,
      detail: JSON.stringify({
        enabled: config.enabled,
        hasBaseUrl: Boolean(config.baseUrl),
        hasApiKey: Boolean(config.apiKey),
        hasModelId: Boolean(config.modelId),
        drawCount: draws.length
      })
    };
    logAiDebug("Skipped configured AI because config is incomplete or disabled", {
      enabled: config.enabled,
      hasBaseUrl: Boolean(config.baseUrl),
      hasApiKey: Boolean(config.apiKey),
      hasModelId: Boolean(config.modelId),
      drawCount: draws.length,
      missingParts
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
