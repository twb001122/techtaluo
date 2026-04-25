import { describe, expect, it } from "vitest";
import { buildArchiveGridModel, buildCardLayoutModel } from "./card-layout";

describe("buildCardLayoutModel", () => {
  it("uses a more slender card ratio that fits 3:4 portrait art", () => {
    const model = buildCardLayoutModel(false);

    expect(model.cardAspectRatio).toBe("0.6");
    expect(model.mediaAspectRatio).toBe("3 / 4");
    expect(model.minHeight).toBe("404px");
    expect(model.shellRadius).toBe("26px");
    expect(model.frameRadius).toBe("20px");
    expect(model.mediaRadius).toBe("16px");
  });

  it("keeps compact cards slimmer but slightly shorter", () => {
    const model = buildCardLayoutModel(true);

    expect(model.cardAspectRatio).toBe("0.6");
    expect(model.mediaAspectRatio).toBe("3 / 4");
    expect(model.minHeight).toBe("332px");
    expect(model.shellRadius).toBe("26px");
    expect(model.frameRadius).toBe("20px");
    expect(model.mediaRadius).toBe("16px");
  });
});

describe("buildArchiveGridModel", () => {
  it("widens the archive columns and adds more breathing room", () => {
    const model = buildArchiveGridModel();

    expect(model.minColumnWidth).toBe("244px");
    expect(model.gap).toBe("28px");
  });
});
