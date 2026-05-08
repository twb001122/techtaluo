import { describe, expect, it } from "vitest";
import { buildConfiguredAiRequestBody, coerceInterpretation, extractJson, normalizeChatCompletionsUrl, renderPromptTemplate, sanitizeModelContent } from "./ai-interpretation";
import { initialCards } from "./cards";
import { buildReadingFlowModel } from "./reading-flow";
import type { CardDraw } from "./types";

const twoDraws: CardDraw[] = [
  { position: "症状", orientation: "upright", card: initialCards[0] },
  { position: "解法", orientation: "reversed", card: initialCards[1] }
];

describe("AI interpretation helpers", () => {
  it("normalizes OpenAI-compatible base URLs", () => {
    expect(normalizeChatCompletionsUrl("https://api.example.com/v1/")).toBe("https://api.example.com/v1/chat/completions");
    expect(normalizeChatCompletionsUrl("https://api.example.com/v1/chat/completions")).toBe("https://api.example.com/v1/chat/completions");
  });

  it("extracts a JSON interpretation from plain or wrapped model output", () => {
    const output =
      '好的：{"summary":"结论","cardReadings":[{"position":"症状","cardName":"服务器宕机","orientation":"正位","reading":"一"},{"position":"解法","cardName":"提示词工程师","orientation":"逆位","reading":"二"}],"analysis":"详解","insight":"行动建议","paywallRoasts":{"paid":"付费吐槽","unpaid":"白嫖吐槽"}}';
    expect(extractJson(output)).toEqual({
      summary: "结论",
      cardReadings: [
        { position: "症状", cardName: "服务器宕机", orientation: "正位", reading: "一" },
        { position: "解法", cardName: "提示词工程师", orientation: "逆位", reading: "二" }
      ],
      analysis: "详解",
      insight: "行动建议",
      paywallRoasts: { paid: "付费吐槽", unpaid: "白嫖吐槽" }
    });
  });

  it("sanitizes think blocks and code fences before JSON extraction", () => {
    const output = `<think>
这里是一大堆推理
</think>

先说两句废话
\`\`\`json
{"summary":"结论","cardInsights":["症状","解法"],"advancedPreview":"搞笑行动"}
\`\`\`
后面这些字不要了`;

    expect(sanitizeModelContent(output)).toContain('{"summary":"结论"');
    expect(extractJson(output)).toEqual({
      summary: "结论",
      cardInsights: ["症状", "解法"],
      advancedPreview: "搞笑行动"
    });
  });

  it("coerces legacy prompt output into the two-card structured reading shape", () => {
    const legacy = {
      summary: "一句旧版结论",
      cardInsights: ["症状旧解读", "解法旧解读"],
      advancedPreview: "旧版高级洞察预告"
    };

    expect(coerceInterpretation(legacy, twoDraws)).toEqual({
      summary: "一句旧版结论",
      cardReadings: [
        { position: "症状", cardName: initialCards[0].name, orientation: "正位", reading: "症状旧解读" },
        { position: "解法", cardName: initialCards[1].name, orientation: "逆位", reading: "解法旧解读" }
      ],
      analysis: "症状旧解读 解法旧解读",
      insight: "旧版高级洞察预告",
      paywallRoasts: {
        paid: "1块钱就想了解命运？也行，至少你愿意为自己的精神状态出一点预算。",
        unpaid: "1块钱都不花就想了解命运？你的财务策略和感情策略一样，主打一个再看看。"
      }
    });
  });

  it("normalizes old three-card AI output onto the current two drawn cards", () => {
    const oldThreeCardOutput = {
      summary: "一句旧结论",
      cardReadings: [
        { position: "现状", cardName: "旧现状牌", orientation: "正位", reading: "现状解读" },
        { position: "阻力", cardName: "旧阻力牌", orientation: "逆位", reading: "阻力解读" },
        { position: "建议", cardName: "旧建议牌", orientation: "正位", reading: "建议解读" }
      ],
      analysis: "问题详解",
      insight: "行动建议",
      paywallRoasts: { paid: "付费吐槽", unpaid: "白嫖吐槽" }
    };

    expect(coerceInterpretation(oldThreeCardOutput, twoDraws)?.cardReadings).toEqual([
      { position: "症状", cardName: "旧现状牌", orientation: "正位", reading: "现状解读" },
      { position: "解法", cardName: "旧阻力牌", orientation: "逆位", reading: "阻力解读" }
    ]);
  });

  it("accepts funnyAction aliases for the action field", () => {
    const modernWithFunnyAction = {
      summary: "一句新结论",
      cardReadings: [
        { position: "症状", cardName: initialCards[0].name, orientation: "正位", reading: "症状解读" },
        { position: "解法", cardName: initialCards[1].name, orientation: "逆位", reading: "解法解读" }
      ],
      analysis: "问题详解",
      funnyAction: "去楼下转三圈再回来投简历",
      paywallRoasts: { paid: "付费吐槽", unpaid: "白嫖吐槽" }
    };

    expect(coerceInterpretation(modernWithFunnyAction, twoDraws)).toEqual({
      summary: "一句新结论",
      cardReadings: modernWithFunnyAction.cardReadings,
      analysis: "问题详解",
      insight: "去楼下转三圈再回来投简历",
      paywallRoasts: { paid: "付费吐槽", unpaid: "白嫖吐槽" }
    });
  });

  it("tolerates two-card output that still uses old positions and incomplete roasts", () => {
    const oldPromptTwoCardOutput = {
      summary: "一句新结论",
      cardReadings: [
        { position: "现状", cardName: "产品经理", orientation: "逆位", reading: "脑子像崩溃的 PRD。" },
        { position: "建议", cardName: "大领导挺喜欢", orientation: "逆位", reading: "被喜欢以后就要开始还债。" }
      ],
      analysis: "这是旧 prompt 还没改完时常见的结构，但内容已经足够展示。",
      funnyAction: "明天先别解释世界，先解释你的第一版稿子。",
      paywallRoasts: {
        paid: "1块钱买不了命运，但可以买一句损话。"
      }
    };

    expect(coerceInterpretation(oldPromptTwoCardOutput, twoDraws)).toEqual({
      summary: "一句新结论",
      cardReadings: [
        { position: "症状", cardName: "产品经理", orientation: "逆位", reading: "脑子像崩溃的 PRD。" },
        { position: "解法", cardName: "大领导挺喜欢", orientation: "逆位", reading: "被喜欢以后就要开始还债。" }
      ],
      analysis: "这是旧 prompt 还没改完时常见的结构，但内容已经足够展示。",
      insight: "明天先别解释世界，先解释你的第一版稿子。",
      paywallRoasts: {
        paid: "1块钱买不了命运，但可以买一句损话。",
        unpaid: "1块钱都不花就想了解命运？你的财务策略和感情策略一样，主打一个再看看。"
      }
    });
  });

  it("renders editable prompt templates with reading placeholders", () => {
    const prompt = renderPromptTemplate("问题={{question}}\n牌={{cards}}\nJSON={{drawsJson}}", "要不要辞职？", twoDraws);

    expect(prompt).toContain("问题=要不要辞职？");
    expect(prompt).toContain("症状：体验版用户");
    expect(prompt).toContain('"position": "症状"');
  });

  it("adds OpenAI-compatible thinking controls to configured AI requests", () => {
    expect(
      buildConfiguredAiRequestBody(
        {
          baseUrl: "https://api.example.com/v1",
          apiKey: "key",
          modelId: "model",
          enabled: true,
          thinkingEnabled: true,
          reasoningEffort: "max",
          systemPrompt: "system",
          userPromptTemplate: "问题={{question}}"
        },
        "要不要上线？",
        twoDraws
      )
    ).toMatchObject({
      model: "model",
      thinking: { type: "enabled" },
      reasoning_effort: "max"
    });

    expect(
      buildConfiguredAiRequestBody(
        {
          baseUrl: "https://api.example.com/v1",
          apiKey: "key",
          modelId: "model",
          enabled: true,
          thinkingEnabled: false,
          reasoningEffort: "high"
        },
        "要不要上线？",
        twoDraws
      )
    ).toMatchObject({
      thinking: { type: "disabled" }
    });
    expect(
      buildConfiguredAiRequestBody(
        {
          baseUrl: "https://api.example.com/v1",
          apiKey: "key",
          modelId: "model",
          enabled: true,
          thinkingEnabled: false,
          reasoningEffort: "high"
        },
        "要不要上线？",
        twoDraws
      )
    ).not.toHaveProperty("reasoning_effort");
  });

  it("slows the ritual reveal rhythm to cover AI latency more generously", () => {
    expect(buildReadingFlowModel()).toEqual({
      deckBackCount: 10,
      faceCardCount: 2,
      requestStartsAt: "question_submit",
      faceRevealDelaysMs: [2900, 3720],
      reportRevealOffsetMs: 840
    });
  });
});
