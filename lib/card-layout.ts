export type CardLayoutModel = {
  cardAspectRatio: string;
  mediaAspectRatio: string;
  minHeight: string;
  shellRadius: string;
  frameRadius: string;
  mediaRadius: string;
};

export type ArchiveGridModel = {
  minColumnWidth: string;
  gap: string;
};

export function buildCardLayoutModel(compact: boolean): CardLayoutModel {
  return {
    cardAspectRatio: "0.6",
    mediaAspectRatio: "3 / 4",
    minHeight: compact ? "332px" : "404px",
    shellRadius: "26px",
    frameRadius: "20px",
    mediaRadius: "16px"
  };
}

export function buildArchiveGridModel(): ArchiveGridModel {
  return {
    minColumnWidth: "244px",
    gap: "28px"
  };
}
