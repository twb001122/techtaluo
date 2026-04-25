export type ReadingFlowModel = {
  deckBackCount: number;
  faceCardCount: number;
  requestStartsAt: "question_submit";
  faceRevealDelaysMs: [number, number, number];
  reportRevealOffsetMs: number;
};

export function buildReadingFlowModel(): ReadingFlowModel {
  return {
    deckBackCount: 10,
    faceCardCount: 3,
    requestStartsAt: "question_submit",
    faceRevealDelaysMs: [2900, 3560, 4220],
    reportRevealOffsetMs: 840
  };
}
