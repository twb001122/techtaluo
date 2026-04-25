import { prisma } from "./prisma";
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_USER_PROMPT_TEMPLATE } from "./ai-prompt-defaults";

export type AiConfigInput = {
  baseUrl: string;
  apiKey?: string;
  modelId: string;
  systemPrompt?: string;
  userPromptTemplate?: string;
  enabled: boolean;
  thinkingEnabled?: boolean;
  reasoningEffort?: string;
  clearApiKey?: boolean;
};

export type SafeAiConfig = {
  baseUrl: string;
  modelId: string;
  systemPrompt: string;
  userPromptTemplate: string;
  enabled: boolean;
  thinkingEnabled: boolean;
  reasoningEffort: "high" | "max";
  hasApiKey: boolean;
};

export const normalizeReasoningEffort = (value: unknown): "high" | "max" => {
  return value === "high" ? "high" : "max";
};

export async function getAiConfig() {
  try {
    return await prisma.aiConfig.findUnique({ where: { id: "default" } });
  } catch {
    return null;
  }
}

export function toSafeAiConfig(config: Awaited<ReturnType<typeof getAiConfig>>): SafeAiConfig {
  return {
    baseUrl: config?.baseUrl ?? "",
    modelId: config?.modelId ?? "",
    systemPrompt: config?.systemPrompt || DEFAULT_SYSTEM_PROMPT,
    userPromptTemplate: config?.userPromptTemplate || DEFAULT_USER_PROMPT_TEMPLATE,
    enabled: config?.enabled ?? false,
    thinkingEnabled: config?.thinkingEnabled ?? true,
    reasoningEffort: normalizeReasoningEffort(config?.reasoningEffort),
    hasApiKey: Boolean(config?.apiKey)
  };
}

export async function saveAiConfig(input: AiConfigInput): Promise<SafeAiConfig> {
  const existing = await getAiConfig();
  const apiKey = input.clearApiKey ? "" : input.apiKey?.trim() || existing?.apiKey || "";
  const reasoningEffort = normalizeReasoningEffort(input.reasoningEffort);
  const saved = await prisma.aiConfig.upsert({
    where: { id: "default" },
    update: {
      baseUrl: input.baseUrl.trim(),
      apiKey,
      modelId: input.modelId.trim(),
      systemPrompt: input.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT,
      userPromptTemplate: input.userPromptTemplate?.trim() || DEFAULT_USER_PROMPT_TEMPLATE,
      enabled: input.enabled,
      thinkingEnabled: input.thinkingEnabled ?? true,
      reasoningEffort
    },
    create: {
      id: "default",
      baseUrl: input.baseUrl.trim(),
      apiKey,
      modelId: input.modelId.trim(),
      systemPrompt: input.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT,
      userPromptTemplate: input.userPromptTemplate?.trim() || DEFAULT_USER_PROMPT_TEMPLATE,
      enabled: input.enabled,
      thinkingEnabled: input.thinkingEnabled ?? true,
      reasoningEffort
    }
  });

  return toSafeAiConfig(saved);
}
