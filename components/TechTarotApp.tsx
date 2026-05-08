"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { BookOpen, Search, Shuffle, Wand2 } from "lucide-react";
import { buildArchiveGridModel } from "@/lib/card-layout";
import { buildHomepageModel } from "@/lib/homepage";
import { buildLibraryArchiveModel } from "@/lib/library";
import type { TarotCard } from "@/lib/types";
import CardDetailModal from "@/components/CardDetailModal";
import TechCard from "@/components/TechCard";

type Props = {
  initialCards: TarotCard[];
};

export default function TechTarotApp({ initialCards }: Props) {
  const [group, setGroup] = useState("all");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState("order");
  const [selected, setSelected] = useState<TarotCard | null>(null);
  const [cardBackUrl, setCardBackUrl] = useState("");
  const [heroShowcaseCard, setHeroShowcaseCard] = useState<TarotCard | null>(null);

  const allTags = useMemo(() => Array.from(new Set(initialCards.flatMap((card) => card.tags))).sort(), [initialCards]);
  const homepage = useMemo(() => buildHomepageModel(initialCards), [initialCards]);
  const archiveGrid = useMemo(() => buildArchiveGridModel(), []);

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cards = initialCards.filter((card) => {
      const matchesGroup = group === "all" || card.group === group;
      const matchesTag = tag === "all" || card.tags.includes(tag);
      const matchesQuery = !q || [card.name, card.subtitle, card.description, card.stageLine, ...card.tags].join(" ").toLowerCase().includes(q);
      return matchesGroup && matchesTag && matchesQuery;
    });
    return [...cards].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "zh-Hans-CN");
      if (sort === "reverse") return b.order - a.order;
      return a.order - b.order;
    });
  }, [group, initialCards, query, sort, tag]);
  const libraryArchive = useMemo(() => buildLibraryArchiveModel(initialCards, filteredCards), [filteredCards, initialCards]);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/card-back")
      .then((response) => response.json())
      .then((payload) => {
        if (isMounted && payload.exists && payload.imageUrl) setCardBackUrl(payload.imageUrl);
      })
      .catch(() => {
        if (isMounted) setCardBackUrl("");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const pool = initialCards.filter((card) => card.isPublished);
    const coverCards = pool.filter((card) => Boolean(card.imageUrl));
    const candidates = coverCards.length ? coverCards : pool;
    setHeroShowcaseCard(candidates[Math.floor(Math.random() * candidates.length)] ?? homepage.featuredCard);
  }, [homepage.featuredCard, initialCards]);

  const randomCard = () => {
    const pool = filteredCards.length ? filteredCards : initialCards;
    setSelected(pool[Math.floor(Math.random() * pool.length)]);
  };

  return (
    <main>
      <nav className="top-nav">
        <div className="nav-branding">
          <a className="brand" href="#top" aria-label="科技塔罗牌">
            <span className="brand-mark">✶</span>
            <span>科技塔罗牌<small>TECH TAROT</small></span>
          </a>
          <span className="nav-whisper">现代精神状态神谕机</span>
        </div>
        <div className="nav-links">
          <a href="#library">牌库</a>
          <a href="/reading">抽牌体验</a>
          <a href="#about">关于</a>
          <a href="/admin">后台</a>
        </div>
        <button className="nav-button" onClick={randomCard}><Shuffle size={16} />随机看一张</button>
      </nav>

      <section id="top" className="hero-section">
        <div className="star-track star-track-one" aria-hidden="true" />
        <div className="star-track star-track-two" aria-hidden="true" />
        <div className="hero-copy hero-shell">
          <div className="hero-copy-main">
            <span className="eyebrow">赛博神谕 / 现代精神状态</span>
            <h1>科技塔罗牌</h1>
            <p>画得像命运神谕，读出来却像你的精神状态事故报告。这里没有恋人、死神、太阳，只有服务器宕机、信息茧房、系统更新提醒和产品经理。</p>
            <div className="hero-actions">
              <a className="primary-button" href="/reading"><Wand2 size={18} />开始抽两张</a>
              <a className="ghost-button" href="#library"><BookOpen size={18} />浏览牌库</a>
            </div>
            <div className="hero-signals" aria-label="首页能力摘要">
              {homepage.heroSignals.map((signal) => (
                <span key={signal}>{signal}</span>
              ))}
            </div>
          </div>
          <div className="hero-footnote">
            <span className="hero-footnote-label">一句正经介绍</span>
            <p>它不是算命工具，更像一个把当代人的精神状态翻译成卡牌隐喻的幽默产品。</p>
          </div>
        </div>
        <div className="hero-visual" aria-label="科技塔罗牌组展示">
          <div
            className={`hero-card-theater ${cardBackUrl ? "has-card-back-image" : ""}`}
            style={{ "--card-back-image": cardBackUrl ? `url(${cardBackUrl})` : undefined } as CSSProperties}
          >
            <div className="hero-card-fan" aria-hidden="true">
              {[
                { x: -198, y: 88, r: -34 },
                { x: -132, y: 38, r: -23 },
                { x: -66, y: 10, r: -11 },
                { x: 0, y: 0, r: 0 },
                { x: 66, y: 10, r: 11 },
                { x: 132, y: 38, r: 23 },
                { x: 198, y: 88, r: 34 }
              ].map((card, index) => (
                <span
                  key={index}
                  className={`hero-fan-card hero-fan-card-${index + 1}`}
                  style={{ "--fan-x": `${card.x}px`, "--fan-y": `${card.y}px`, "--fan-r": `${card.r}deg` } as CSSProperties}
                />
              ))}
            </div>
            <div className="hero-card-float">
              <TechCard card={heroShowcaseCard ?? homepage.featuredCard} compact />
            </div>
          </div>
        </div>
      </section>

      <section className="status-strip" aria-label="牌库统计">
        {homepage.stats.map((item) => (
          <div key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <small>{item.detail}</small>
          </div>
        ))}
      </section>

      <section id="library" className="library-section">
        <div className="library-shell">
          <div className="library-heading">
            <div className="library-heading-copy">
              <span className="eyebrow">Card Archive</span>
              <h2>牌库</h2>
              <p>{libraryArchive.archiveNote}</p>
            </div>
            <div className="library-heading-meta">
              <span className="library-result-label">{libraryArchive.resultLabel}</span>
              <span className="library-heading-caption">Filed By Mood / Group / Failure</span>
            </div>
          </div>
          <div className="library-toolbar">
            <label className="search-box library-search-box">
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="检索馆藏中的精神状态..." />
            </label>
            <select value={tag} onChange={(event) => setTag(event.target.value)}>
              <option value="all">全部情绪标签</option>
              {allTags.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="order">默认顺序</option>
              <option value="reverse">倒序</option>
              <option value="name">名称</option>
            </select>
          </div>
          <div className="library-groups" aria-label="牌库分组">
            {libraryArchive.groups.map((option) => (
              <button key={option.value} className={group === option.value ? "active" : ""} onClick={() => setGroup(option.value)}>
                <span>{option.label}</span>
                <small>{option.count}</small>
              </button>
            ))}
          </div>
          <div
            className="card-grid archive-card-grid"
            style={{ "--archive-card-min": archiveGrid.minColumnWidth, "--archive-card-gap": archiveGrid.gap } as React.CSSProperties}
          >
            {filteredCards.map((card) => (
              <button key={card.id} className="card-button archive-card-button" onClick={() => setSelected(card)} aria-label={`查看 ${card.name}`}>
                <TechCard card={card} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="about-section">
        <div>
          <span className="eyebrow">About The Deck</span>
          <h2>庄严地离谱</h2>
        </div>
        <p>这套牌的幽默来自反差：画得像真的命运神牌，内容却是系统更新提醒、共享充电宝和产品经理。每张牌都对应一种现代人的真实精神状态，既能现场一笑，也能认真地给出一点行动线索。</p>
      </section>

      {selected ? <CardDetailModal cards={filteredCards.length ? filteredCards : initialCards} selected={selected} onClose={() => setSelected(null)} onSelect={setSelected} /> : null}
    </main>
  );
}
