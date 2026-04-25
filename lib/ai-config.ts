import { prisma } from "./prisma";
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_USER_PROMPT_TEMPLATE } from "./ai-prompt-defaults";

export type AiConfigInput = {
  baseUrl: string;
  apiKey?: string;
  modelId: string;
  systemPrompt?: string;
  userPromptTemplate?: string;
  enabled: boolean;
  clearApiKey?: boolean;
};

export type SafeAiConfig = {
  baseUrl: string;
  modelId: string;
  systemPrompt: string;
  userPromptTemplate: string;
  enabled: boolean;
  hasApiKey: boolean;
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
    hasApiKey: Boolean(config?.apiKey)
  };
}

export async function saveAiConfig(input: AiConfigInput): Promise<SafeAiConfig> {
  const existing = await getAiConfig();
  const apiKey = input.clearApiKey ? "" : input.apiKey?.trim() || existing?.apiKey || "";
  const saved = await prisma.aiConfig.upsert({
    where: { id: "default" },
    update: {
      baseUrl: input.baseUrl.trim(),
      apiKey,
      modelId: input.modelId.trim(),
      systemPrompt: input.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT,
      userPromptTemplate: input.userPromptTemplate?.trim() || DEFAULT_USER_PROMPT_TEMPLATE,
      enabled: input.enabled
    },
    create: {
      id: "default",
      baseUrl: input.baseUrl.trim(),
      apiKey,
      modelId: input.modelId.trim(),
      systemPrompt: input.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT,
      userPromptTemplate: input.userPromptTemplate?.trim() || DEFAULT_USER_PROMPT_TEMPLATE,
      enabled: input.enabled
    }
  });

  return toSafeAiConfig(saved);
}
