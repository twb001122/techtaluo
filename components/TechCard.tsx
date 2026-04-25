"use client";

import type { CSSProperties } from "react";
import { buildCardDisplayModel } from "@/lib/card-display";
import { buildCardLayoutModel } from "@/lib/card-layout";
import type { TarotCard } from "@/lib/types";

type TechCardProps = {
  card: TarotCard;
  compact?: boolean;
  orientation?: string;
};

export default function TechCard({ card, compact = false, orientation }: TechCardProps) {
  const hasCover = Boolean(card.imageUrl);
  const coverStyle = hasCover ? { backgroundImage: `url(${card.imageUrl})` } : undefined;
  const display = buildCardDisplayModel(card, orientation);
  const layout = buildCardLayoutModel(compact);

  return (
    <article
      className={`tech-card ${compact ? "tech-card-compact" : ""} ${hasCover ? "tech-card-has-cover" : ""}`}
      style={
        {
          "--accent": card.accentColor,
          "--card-ratio": layout.cardAspectRatio,
          "--card-min-height": layout.minHeight,
          "--card-media-ratio": layout.mediaAspectRatio,
          "--card-shell-radius": layout.shellRadius,
          "--card-frame-radius": layout.frameRadius,
          "--card-media-radius": layout.mediaRadius
        } as CSSProperties
      }
    >
      <div className="tech-card-frame">
        <div className="tech-card-media">
          <div className="tech-card-cover" style={coverStyle} aria-hidden="true">
            {!hasCover ? (
              <div className="tech-card-placeholder">
                <div className="tech-card-glyph">{card.name.slice(0, 2)}</div>
              </div>
            ) : null}
          </div>
          <div className="tech-card-border" aria-hidden="true" />
        </div>
        <div className="tech-card-info">
          <div className="tech-card-meta">
            <span className="tech-card-order">{display.orderLabel}</span>
            <span className="tech-card-category">{display.categoryLabel}</span>
          </div>
          <div className="tech-card-copy">
            <h3>{display.title}</h3>
            <p>{display.subtitle}</p>
          </div>
          {display.orientationLabel ? <span className="orientation-pill">{display.orientationLabel}</span> : null}
        </div>
      </div>
    </article>
  );
}
