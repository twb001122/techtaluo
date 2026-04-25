import { isAdminRequest, unauthorized } from "@/lib/admin";
import { getAiConfig, saveAiConfig, toSafeAiConfig } from "@/lib/ai-config";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  const config = await getAiConfig();
  return Response.json({ config: toSafeAiConfig(config) });
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const config = await saveAiConfig({
    baseUrl: typeof body.baseUrl === "string" ? body.baseUrl : "",
    apiKey: typeof body.apiKey === "string" ? body.apiKey : undefined,
    modelId: typeof body.modelId === "string" ? body.modelId : "",
    systemPrompt: typeof body.systemPrompt === "string" ? body.systemPrompt : undefined,
    userPromptTemplate: typeof body.userPromptTemplate === "string" ? body.userPromptTemplate : undefined,
    enabled: Boolean(body.enabled),
    clearApiKey: Boolean(body.clearApiKey)
  });

  return Response.json({ config });
}
