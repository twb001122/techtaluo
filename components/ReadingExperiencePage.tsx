"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, LockKeyhole, Sparkles, X } from "lucide-react";
import CardDetailModal from "@/components/CardDetailModal";
import TechCard from "@/components/TechCard";
import { buildReadingFlowModel } from "@/lib/reading-flow";
import type { CardDraw, ReadingInterpretation, TarotCard } from "@/lib/types";

type Props = {
  cardCount: number;
};

type RitualPhase = "intro" | "asking" | "submitting" | "animating" | "waiting" | "resolved" | "paywall" | "error";

export default function ReadingExperiencePage({ cardCount }: Props) {
  const flow = buildReadingFlowModel();
  const [phase, setPhase] = useState<RitualPhase>("intro");
  const [draftQuestion, setDraftQuestion] = useState("");
  const [question, setQuestion] = useState("");
  const [draws, setDraws] = useState<CardDraw[]>([]);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [interpretation, setInterpretation] = useState<ReadingInterpretation | null>(null);
  const [provider, setProvider] = useState("");
  const [revealCount, setRevealCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [paywallChoice, setPaywallChoice] = useState<"paid" | "unpaid" | null>(null);
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);

  const runIdRef = useRef(0);
  const revealCompleteRef = useRef(false);
  const interpretationReadyRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);

  const clearTimers = () => {
    timeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
    timeoutsRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const startQuestion = () => {
    setDraftQuestion(question);
    setPhase("asking");
  };

  const closeQuestion = () => {
    if (phase === "submitting") return;
    setPhase("intro");
  };

  const beginReading = async () => {
    const normalizedQuestion = draftQuestion.trim();
    const runId = Date.now();
    runIdRef.current = runId;

    setQuestion(normalizedQuestion);
    setDraws([]);
    setReadingId(null);
    setInterpretation(null);
    setProvider("");
    setRevealCount(0);
    setErrorMessage("");
    setPaywallChoice(null);
    setSelectedCard(null);
    setPhase("submitting");
    revealCompleteRef.current = false;
    interpretationReadyRef.current = false;
    clearTimers();

    // Fade out the intro/question UI immediately. The animation becomes cover for network latency.
    const enterAnimation = window.setTimeout(() => {
      if (runIdRef.current !== runId) return;
      setPhase("animating");
    }, 80);
    timeoutsRef.current.push(enterAnimation);

    try {
      const drawResponse = await fetch("/api/readings/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: normalizedQuestion })
      });
      const drawPayload = await drawResponse.json();

      if (!drawResponse.ok || !Array.isArray(drawPayload.draws) || drawPayload.draws.length !== 3) {
        throw new Error(drawPayload.error ?? "抽牌失败");
      }

      if (runIdRef.current !== runId) return;

      setDraws(drawPayload.draws);
      setReadingId(drawPayload.readingId ?? null);

      const [firstDelay, secondDelay, thirdDelay] = flow.faceRevealDelaysMs;
      const revealTimers = [
        window.setTimeout(() => {
          if (runIdRef.current !== runId) return;
          setRevealCount(1);
        }, firstDelay),
        window.setTimeout(() => {
          if (runIdRef.current !== runId) return;
          setRevealCount(2);
        }, secondDelay),
        window.setTimeout(() => {
          if (runIdRef.current !== runId) return;
          setRevealCount(3);
        }, thirdDelay),
        window.setTimeout(() => {
          if (runIdRef.current !== runId) return;
          revealCompleteRef.current = true;
          setPhase(interpretationReadyRef.current ? "resolved" : "waiting");
        }, thirdDelay + flow.reportRevealOffsetMs)
      ];

      timeoutsRef.current.push(...revealTimers);

      const interpretResponse = await fetch("/api/readings/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: normalizedQuestion,
          draws: drawPayload.draws,
          readingId: drawPayload.readingId
        })
      });
      const interpretPayload = await interpretResponse.json();

      if (runIdRef.current !== runId) return;
      if (typeof window !== "undefined") {
        const consolePayload = {
          provider: interpretPayload.provider ?? "unknown",
          aiDebug: interpretPayload.aiDebug ?? null
        };
        if (interpretPayload.provider === "configured-ai") {
          console.info("[reading] AI interpretation response", consolePayload);
        } else {
          console.warn("[reading] Fell back to local interpretation", consolePayload);
        }
      }
      if (!interpretResponse.ok || !interpretPayload.interpretation) {
        throw new Error(interpretPayload.error ?? "解读失败");
      }

      setInterpretation(interpretPayload.interpretation);
      setProvider(interpretPayload.provider ?? "");
      interpretationReadyRef.current = true;

      if (revealCompleteRef.current) {
        setPhase("resolved");
      }
    } catch (error) {
      if (runIdRef.current !== runId) return;
      clearTimers();
      setPhase("error");
      setErrorMessage(error instanceof Error ? error.message : "抽卡时出了点问题");
    }
  };

  const openPaywall = () => {
    setPaywallChoice(null);
    setPhase("paywall");
  };

  const closePaywall = () => {
    setPhase("resolved");
  };

  const isAnimatingStage = phase === "animating" || phase === "waiting" || phase === "resolved" || phase === "paywall";
  const isReporting = phase === "resolved" || phase === "paywall";

  return (
    <main className="reading-page">
      <nav className="top-nav">
        <div className="nav-branding">
          <a className="brand" href="/" aria-label="科技塔罗牌">
            <span className="brand-mark">✶</span>
            <span>科技塔罗牌<small>READING</small></span>
          </a>
          <span className="nav-whisper">三张牌仪式页</span>
        </div>
        <div className="nav-links">
          <a href="/">首页</a>
          <a href="/reading">抽牌体验</a>
          <a href="/admin">后台</a>
        </div>
        <a className="nav-button" href="/">
          <ArrowLeft size={16} />
          返回
        </a>
      </nav>

      <section className={`reading-ritual-page phase-${phase}`}>
        <div className={`reading-entry-panel ${isAnimatingStage || phase === "error" ? "is-hidden" : ""}`}>
          <span className="eyebrow">Modern Spirit Ritual</span>
          <h1>科技塔罗牌</h1>
          <p>输入问题，点下按钮，剩下的交给三张牌和一个多少有点缺德的 AI。它会在动画里偷偷完成抽牌和瞎洞察。</p>
          <button className="primary-button" type="button" onClick={startQuestion}>
            <Sparkles size={18} />
            开始抽卡
          </button>
          <small className="reading-entry-note">{cardCount} 张牌样本已待命，系统默认按现状 / 阻力 / 建议抽出三张。</small>
        </div>

        <div className={`reading-ritual-board ${isAnimatingStage ? "is-active" : ""} ${isReporting ? "is-reporting" : ""}`}>
          <div className={`ritual-back-row ${isAnimatingStage ? "is-active" : ""}`}>
            {Array.from({ length: flow.deckBackCount }, (_, slot) => (
              <span key={slot} className="ritual-back-card" style={{ "--slot": slot } as CSSProperties} />
            ))}
          </div>

          <div className={`ritual-face-row ${revealCount > 0 ? "is-visible" : ""} ${isReporting ? "is-reporting" : ""}`}>
            {draws.map((draw, index) => (
              <div
                key={`${readingId}-${draw.card.id}`}
                className={`ritual-face-card slot-${index + 1} ${index < revealCount ? "is-visible" : ""} ${draw.orientation === "reversed" ? "is-reversed" : ""}`}
              >
                <button
                  className="ritual-face-button"
                  type="button"
                  onClick={() => setSelectedCard(draw.card)}
                  disabled={index >= revealCount}
                  aria-label={`查看${draw.card.name}详情`}
                >
                  <TechCard card={draw.card} orientation={draw.orientation === "upright" ? "正位" : "逆位"} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {(phase === "waiting" || (phase === "animating" && revealCount === 3 && !interpretation)) && !interpretation ? (
          <div className="reading-loading reading-loading-page" role="status" aria-live="polite">
            <div className="reading-loading-orb" />
            <div className="reading-loading-viewport">
              <div className="reading-loading-track">
                {[
                  "读牌人正在起床……",
                  "读牌人正在准备胡说八道。",
                  "AI 接口欠费了，token 不抗用，马达正在充钱。",
                  "正在把宇宙信号转成能发朋友圈的中文。",
                  "命运服务器排队中，前面还有 404 个灵魂。",
                  "模型正在努力假装自己懂你。",
                  "读牌人正在起床……",
                  "读牌人正在准备胡说八道。",
                  "AI 接口欠费了，token 不抗用，马达正在充钱。",
                  "正在把宇宙信号转成能发朋友圈的中文。",
                  "命运服务器排队中，前面还有 404 个灵魂。",
                  "模型正在努力假装自己懂你。"
                ].map((line, index) => (
                  <span key={`${line}-${index}`}>{line}</span>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {interpretation && isReporting ? (
          <section className="reading-report-panel">
            <div className="reading-report-head">
              <div className="reading-report-title">
                <span className="eyebrow">Divination Report</span>
                <h2>这次抽卡给你的报告</h2>
                <div className="reading-report-meta">
                  {question ? <p className="reading-report-question-chip">问题：{question}</p> : null}
                  {provider ? <p className="reading-provider-note">来源：{provider === "configured-ai" ? "已配置 AI 接口" : "本地兜底解读"}</p> : null}
                </div>
              </div>
            </div>

            <article className="reading-report-summary">
              <span className="reading-report-kicker">一句话评语</span>
              <p>{interpretation.summary}</p>
            </article>

            <div className="reading-report-cards">
              {interpretation.cardReadings.map((item) => (
                <article key={`${item.position}-${item.cardName}`} className="reading-report-card">
                  <div className="reading-report-card-head">
                    <span>{item.position}</span>
                    <small>{item.orientation}</small>
                  </div>
                  <h3>{item.cardName}</h3>
                  <p>{item.reading}</p>
                </article>
              ))}
            </div>

            <div className="reading-report-lower">
              <article className="reading-report-analysis">
                <span className="reading-report-kicker">问题详解</span>
                <p>{interpretation.analysis}</p>
              </article>

              <div className="reading-report-side">
                <article className="reading-report-question-card">
                  <span className="reading-report-kicker">你的问题</span>
                  <p>{question || "这次你什么都没问，但命运还是给了你一点脸色。"}</p>
                </article>

                <article className="reading-report-lockup">
                  <span className="reading-report-kicker">搞笑行动</span>
                  <p>系统已经生成了一条很不正经的行动建议。大概率适合截图发群，也大概率不适合真的照做。</p>
                  <div className="reading-report-lockup-mask" aria-hidden="true">
                    <span>已生成 · 等待 1 元解锁</span>
                  </div>
                  <button className="ghost-button wide" type="button" onClick={openPaywall}>
                    <LockKeyhole size={16} />
                    解锁洞察
                  </button>
                </article>
              </div>
            </div>
          </section>
        ) : null}

        {phase === "error" ? (
          <section className="reading-error-card">
            <h2>这次抽卡没跑完</h2>
            <p>{errorMessage || "抽牌或解读时出了一点问题。你可以重新开始一次。"}</p>
            <button className="primary-button" type="button" onClick={startQuestion}>
              <Sparkles size={18} />
              重新抽卡
            </button>
          </section>
        ) : null}
      </section>

      {(phase === "asking" || phase === "submitting") && !isAnimatingStage ? (
        <div className="reading-question-backdrop" role="dialog" aria-modal="true">
          <div className="reading-question-modal">
            <button className="icon-button close-button" type="button" onClick={closeQuestion} aria-label="关闭">
              <X size={18} />
            </button>
            <span className="eyebrow">Question Portal</span>
            <h2>把你想问的事说出来。</h2>
            <p>输入问题后点击“获取 AI 的瞎洞察”。从你点下去那一刻，系统就会立刻抽三张牌并偷偷请求 AI。</p>
            <textarea
              value={draftQuestion}
              onChange={(event) => setDraftQuestion(event.target.value)}
              placeholder="比如：我要不要辞职？这段关系到底该不该继续？我最近是不是该停下来休息？"
            />
            <div className="reading-question-actions">
              <button className="ghost-button" type="button" onClick={closeQuestion}>
                先不问了
              </button>
              <button className="primary-button" type="button" onClick={beginReading} disabled={phase === "submitting"}>
                <Sparkles size={18} />
                {phase === "submitting" ? "正在获取瞎洞察" : "获取 AI 的瞎洞察"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {phase === "paywall" && interpretation ? (
        <div className="reading-question-backdrop" role="dialog" aria-modal="true">
          <div className="reading-paywall-modal">
            <button className="icon-button close-button" type="button" onClick={closePaywall} aria-label="关闭">
              <X size={18} />
            </button>
            <span className="eyebrow">Insight Unlock</span>
            <h2>是否花 1 元解锁洞察？</h2>
            <p>洞察其实已经生成了，但客户端暂时只演到这一步。你可以点一下，先看看命运系统怎么吐槽你。</p>
            <div className="reading-paywall-actions">
              <button className="primary-button" type="button" onClick={() => setPaywallChoice("paid")}>
                付 1 元试试看
              </button>
              <button className="ghost-button" type="button" onClick={() => setPaywallChoice("unpaid")}>
                先不花
              </button>
            </div>
            {paywallChoice ? (
              <div className="reading-paywall-result">
                <article className="reading-paywall-insight">
                  <span className="reading-report-kicker">{paywallChoice === "paid" ? "已解锁搞笑行动" : "白嫖预览"}</span>
                  <p>{interpretation.insight}</p>
                  <p className="reading-paywall-host-note">我知道这个文案看起来充满了ai塑料质感，但没办法，主持人用不起更贵的模型，门票钱都不买token！</p>
                </article>
                <article className="reading-paywall-roast">
                  <span className="reading-report-kicker">费用吐槽</span>
                  <p>{interpretation.paywallRoasts[paywallChoice]}</p>
                </article>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {selectedCard ? (
        <CardDetailModal
          cards={draws.map((draw) => draw.card)}
          selected={selectedCard}
          onClose={() => setSelectedCard(null)}
          onSelect={setSelectedCard}
        />
      ) : null}
    </main>
  );
}
