import { describe, expect, it } from "vitest";
import { initialCards } from "./cards";
import { buildDetailModalModel } from "./detail-modal";

describe("buildDetailModalModel", () => {
  it("builds an emotion-first view model for the detail modal", () => {
    const card = initialCards.find((entry) => entry.id === "major-12");

    expect(card).toBeDefined();

    const model = buildDetailModalModel(card!);

    expect(model.metaLabel).toBe("大牌 / 12");
    expect(model.title).toBe("服务器宕机");
    expect(model.subtitle).toBe("你不是累，你是暂时不可用。");
    expect(model.stageLine).toBe("你现在这个状态已经不是累了，是服务暂时不可用。");
    expect(model.descriptionLabel).toBe("详细介绍");
    expect(model.properties).toEqual([
      { label: "正位", value: "暂停、强制休息、系统维护。" },
      { label: "逆位", value: "彻底崩溃、全面掉线、无响应。" }
    ]);
    expect(model.tags).toEqual(["崩溃", "系统故障", "停摆", "精神状态"]);
  });
});
