import { getAiConfig } from "@/lib/ai-config";
import { attemptConfiguredAiInterpretation } from "@/lib/ai-interpretation";
import { prisma } from "@/lib/prisma";
import { interpretReadingFallback } from "@/lib/readings";
import type { CardDraw } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question : "";
  const draws = Array.isArray(body.draws) ? (body.draws as CardDraw[]) : [];
  const config = await getAiConfig();
  const attempt = config
    ? await attemptConfiguredAiInterpretation(question, draws, config).catch(() => ({
        interpretation: null,
        debug: {
          ok: false as const,
          reason: "request_failed" as const,
          message: "AI 请求在路由层抛错。",
          detail: "Unexpected route-level error"
        }
      }))
    : {
        interpretation: null,
        debug: {
          ok: false as const,
          reason: "config_incomplete" as const,
          message: "没有读取到 AI 配置。"
        }
      };
  const aiInterpretation = attempt.interpretation;
  const interpretation = aiInterpretation ?? interpretReadingFallback(question, draws);
  const provider = aiInterpretation ? "configured-ai" : "fallback";

  if (typeof body.readingId === "string" && !body.readingId.startsWith("local-")) {
    try {
      await prisma.reading.update({
        where: { id: body.readingId },
        data: { interpretation }
      });
    } catch {
      // The UI can still use the generated fallback even if persistence fails.
    }
  }

  return Response.json({ interpretation, provider, aiDebug: attempt.debug });
}
