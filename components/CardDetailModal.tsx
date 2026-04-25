"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import TechCard from "@/components/TechCard";
import { buildDetailModalModel } from "@/lib/detail-modal";
import type { TarotCard } from "@/lib/types";

type Props = {
  cards: TarotCard[];
  selected: TarotCard;
  onClose: () => void;
  onSelect: (card: TarotCard) => void;
};

export default function CardDetailModal({ cards, selected, onClose, onSelect }: Props) {
  const index = cards.findIndex((card) => card.id === selected.id);
  const safeIndex = index === -1 ? 0 : index;
  const previous = cards[(safeIndex - 1 + cards.length) % cards.length];
  const next = cards[(safeIndex + 1) % cards.length];
  const model = buildDetailModalModel(selected);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="detail-modal-shell">
        <div className="detail-modal">
          <button className="icon-button close-button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
          <div className="detail-card-stage">
            <div className="detail-stage-shell">
              <div className="detail-stage-rings" aria-hidden="true" />
              <div className="detail-stage-glow" aria-hidden="true" />
              <TechCard card={selected} />
              <div className="detail-stage-caption" aria-hidden="true">
                <span>Archive Reveal</span>
                <span>{model.metaLabel}</span>
              </div>
            </div>
          </div>
          <div className="detail-copy">
            <header className="detail-header">
              <span className="detail-meta-label">{model.metaLabel}</span>
              <h2>{model.title}</h2>
              <p className="subtitle">{model.subtitle}</p>
            </header>
            <section className="detail-emotion">
              <span className="detail-section-kicker">舞台一句话</span>
              <blockquote className="stage-quote">{model.stageLine}</blockquote>
            </section>
            <section className="detail-description">
              <h4>{model.descriptionLabel}</h4>
              <p>{model.description}</p>
            </section>
            <div className="detail-grid detail-properties">
              {model.properties.map((property) => (
                <section key={property.label}>
                  <h4>{property.label}</h4>
                  <p>{property.value}</p>
                </section>
              ))}
            </div>
          </div>
        </div>
        <div className="detail-modal-rail">
          <section className="detail-tags">
            <div className="tag-row detail-tag-row">{model.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          </section>
          {cards.length > 1 ? (
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => onSelect(previous)}>
                <ArrowLeft size={16} />上一张
              </button>
              <button className="primary-button" onClick={() => onSelect(next)}>
                下一张<ArrowRight size={16} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
