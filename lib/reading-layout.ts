export type ReadingSceneLayoutModel = {
  sceneColumns: string;
  titleMaxWidth: string;
  titleWordBreak: string;
};

export function buildReadingSceneLayoutModel(): ReadingSceneLayoutModel {
  return {
    sceneColumns: "minmax(0, 0.92fr) minmax(420px, 1.08fr)",
    titleMaxWidth: "5ch",
    titleWordBreak: "normal"
  };
}
