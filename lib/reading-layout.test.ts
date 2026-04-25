import { describe, expect, it } from "vitest";
import { buildReadingSceneLayoutModel } from "./reading-layout";

describe("buildReadingSceneLayoutModel", () => {
  it("keeps the ritual hero title wrappable inside the copy column", () => {
    const model = buildReadingSceneLayoutModel();

    expect(model.sceneColumns).toBe("minmax(0, 0.92fr) minmax(420px, 1.08fr)");
    expect(model.titleMaxWidth).toBe("5ch");
    expect(model.titleWordBreak).toBe("normal");
  });
});
