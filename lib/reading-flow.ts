export type ReadingFlowModel = {
  deckBackCount: number;
  faceCardCount: number;
  requestStartsAt: "question_submit";
  faceRevealDelaysMs: [number, number];
  reportRevealOffsetMs: number;
};

export function buildReadingFlowModel(): ReadingFlowModel {
  return {
    deckBackCount: 10,
    faceCardCount: 2,
    requestStartsAt: "question_submit",
    faceRevealDelaysMs: [2900, 3720],
    reportRevealOffsetMs: 840
  };
}
