"use client";

import { Sparkles } from "lucide-react";

type Props = {
  cardCount: number;
};

export default function HomeEntryPage({ cardCount }: Props) {
  return (
    <main className="home-entry-page">
      <nav className="top-nav">
        <div className="nav-branding">
          <a className="brand" href="/" aria-label="科技塔罗牌">
            <span className="brand-mark">✶</span>
            <span>科技塔罗牌<small>TECH TAROT</small></span>
          </a>
          <span className="nav-whisper">现代精神状态神谕机</span>
        </div>
        <div className="nav-links">
          <a href="/reading">抽牌体验</a>
          <a href="/admin">后台</a>
        </div>
      </nav>

      <section className="home-entry-hero">
        <span className="eyebrow">Cyber Divination / Modern Mood Deck</span>
        <h1>科技塔罗牌</h1>
        <p>这是一套给现代人精神状态做赛博占卜的牌。你负责提问，系统负责随机抽两张，然后让 AI 一本正经地瞎洞察你的人生。</p>
        <a className="primary-button" href="/reading">
          <Sparkles size={18} />
          开始抽卡
        </a>
        <small>{cardCount} 张科技塔罗样本已准备就绪。</small>
      </section>
    </main>
  );
}
