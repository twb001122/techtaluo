import { describe, expect, it } from "vitest";
import { buildReadingFlowModel } from "./reading-flow";

describe("buildReadingFlowModel", () => {
  it("defines a slower 10-back ritual animation that starts AI work immediately on submit", () => {
    const model = buildReadingFlowModel();

    expect(model.deckBackCount).toBe(10);
    expect(model.faceCardCount).toBe(3);
    expect(model.requestStartsAt).toBe("question_submit");
    expect(model.faceRevealDelaysMs).toEqual([2900, 3560, 4220]);
    expect(model.reportRevealOffsetMs).toBe(840);
  });
});
