import { isAdminRequest, unauthorized } from "@/lib/admin";
import { getAiConfig, saveAiConfig, toSafeAiConfig } from "@/lib/ai-config";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  const config = await getAiConfig();
  return Response.json({ config: toSafeAiConfig(config) });
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    const config = await saveAiConfig({
      baseUrl: typeof body.baseUrl === "string" ? body.baseUrl : "",
      apiKey: typeof body.apiKey === "string" ? body.apiKey : undefined,
      modelId: typeof body.modelId === "string" ? body.modelId : "",
      systemPrompt: typeof body.systemPrompt === "string" ? body.systemPrompt : undefined,
      userPromptTemplate: typeof body.userPromptTemplate === "string" ? body.userPromptTemplate : undefined,
      enabled: Boolean(body.enabled),
      thinkingEnabled: typeof body.thinkingEnabled === "boolean" ? body.thinkingEnabled : true,
      reasoningEffort: typeof body.reasoningEffort === "string" ? body.reasoningEffort : "max",
      clearApiKey: Boolean(body.clearApiKey)
    });

    return Response.json({ config });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存 AI 配置失败";
    console.error("[admin-ai-config] save failed", error);
    return Response.json({ error: message }, { status: 500 });
  }
}
