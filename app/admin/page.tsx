"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Database, EyeOff, ImageUp, RefreshCw, Save } from "lucide-react";
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_USER_PROMPT_TEMPLATE } from "@/lib/ai-prompt-defaults";
import type { TarotCard } from "@/lib/types";

const emptyCard: TarotCard = {
  id: "",
  order: 63,
  name: "",
  subtitle: "",
  category: "AI / 科技机制",
  group: "ai",
  tags: [],
  uprightMeaning: "",
  reversedMeaning: "",
  aiKeywords: [],
  stageLine: "",
  description: "",
  imageElements: [],
  visualStyle: "",
  accentColor: "#f7b267",
  imageUrl: "",
  isPublished: true
};

const toList = (value: string) => value.split(/[,\n，、/]+/).map((item) => item.trim()).filter(Boolean);

type AiConfigDraft = {
  baseUrl: string;
  apiKey: string;
  modelId: string;
  systemPrompt: string;
  userPromptTemplate: string;
  enabled: boolean;
  hasApiKey: boolean;
  clearApiKey: boolean;
};

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("techtaluo");
  const [cards, setCards] = useState<TarotCard[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<TarotCard>(emptyCard);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [aiConfig, setAiConfig] = useState<AiConfigDraft>({
    baseUrl: "",
    apiKey: "",
    modelId: "",
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    userPromptTemplate: DEFAULT_USER_PROMPT_TEMPLATE,
    enabled: false,
    hasApiKey: false,
    clearApiKey: false
  });
  const [message, setMessage] = useState("");

  const selected = useMemo(() => cards.find((card) => card.id === selectedId), [cards, selectedId]);
  const knownGroups = useMemo(() => Array.from(new Set(cards.map((card) => card.group))).sort(), [cards]);

  useEffect(() => {
    if (selected) setDraft(selected);
  }, [selected]);

  const loadCards = async () => {
    const response = await fetch("/api/admin/cards", { headers: { "x-admin-key": adminKey } });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "读取失败");
      return;
    }
    setCards(payload.cards);
    setSelectedId(payload.cards[0]?.id ?? "");
    setMessage(`已读取 ${payload.total} 张牌`);
  };

  const loadAiConfig = async () => {
    const response = await fetch("/api/admin/ai-config", { headers: { "x-admin-key": adminKey } });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "读取 AI 配置失败");
      return;
    }
    setAiConfig({
      baseUrl: payload.config.baseUrl ?? "",
      apiKey: "",
      modelId: payload.config.modelId ?? "",
      systemPrompt: payload.config.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
      userPromptTemplate: payload.config.userPromptTemplate ?? DEFAULT_USER_PROMPT_TEMPLATE,
      enabled: Boolean(payload.config.enabled),
      hasApiKey: Boolean(payload.config.hasApiKey),
      clearApiKey: false
    });
    setMessage("已读取 AI 解读接口配置");
  };

  const saveCard = async () => {
    const method = cards.some((card) => card.id === draft.id) ? "PATCH" : "POST";
    const url = method === "PATCH" ? `/api/admin/cards/${draft.id}` : "/api/admin/cards";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify(draft)
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "保存失败");
      return;
    }
    setCards((current) => {
      const exists = current.some((card) => card.id === payload.card.id);
      return exists ? current.map((card) => (card.id === payload.card.id ? payload.card : card)) : [...current, payload.card].sort((a, b) => a.order - b.order);
    });
    setSelectedId(payload.card.id);
    setMessage(`已保存：${payload.card.name}`);
  };

  const uploadCardImage = async (file: File | undefined) => {
    if (!file) return;
    if (!draft.id.trim()) {
      setMessage("请先填写卡牌 ID，再上传封面。");
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("cardId", draft.id);
    formData.append("file", file);

    const response = await fetch("/api/admin/upload-card-image", {
      method: "POST",
      headers: { "x-admin-key": adminKey },
      body: formData
    });
    const payload = await response.json();
    setIsUploadingImage(false);

    if (!response.ok) {
      setMessage(payload.error ?? "上传失败");
      return;
    }

    const nextDraft = { ...draft, imageUrl: payload.imageUrl };
    setDraft(nextDraft);
    setMessage(`封面已上传：${payload.imageUrl}。点击保存即可写入卡牌。`);
  };

  const seed = async () => {
    const response = await fetch("/api/admin/seed", { method: "POST", headers: { "x-admin-key": adminKey } });
    const payload = await response.json();
    setMessage(payload.message ?? payload.error ?? "初始化完成");
    await loadCards();
  };

  const saveAiConfig = async () => {
    const response = await fetch("/api/admin/ai-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify(aiConfig)
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "保存 AI 配置失败");
      return;
    }
    setAiConfig({
      baseUrl: payload.config.baseUrl ?? "",
      apiKey: "",
      modelId: payload.config.modelId ?? "",
      systemPrompt: payload.config.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
      userPromptTemplate: payload.config.userPromptTemplate ?? DEFAULT_USER_PROMPT_TEMPLATE,
      enabled: Boolean(payload.config.enabled),
      hasApiKey: Boolean(payload.config.hasApiKey),
      clearApiKey: false
    });
    setMessage("AI 解读接口配置已保存");
  };

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <a href="/" className="brand"><span className="brand-mark">✶</span><span>科技塔罗牌<small>ADMIN</small></span></a>
        <div className="admin-key">
          <input value={adminKey} onChange={(event) => setAdminKey(event.target.value)} placeholder="管理员密钥" />
          <button className="primary-button" onClick={loadCards}><Database size={16} />读取</button>
          <button className="ghost-button" onClick={loadAiConfig}><Bot size={16} />读取 AI 配置</button>
          <button className="ghost-button" onClick={seed}><RefreshCw size={16} />初始化默认牌</button>
        </div>
      </section>

      <section className="admin-ai-panel">
        <div className="admin-form-head">
          <div>
            <span className="eyebrow">AI Interpreter</span>
            <h2>AI 解读接口配置</h2>
          </div>
          <button className="primary-button" type="button" onClick={saveAiConfig}><Save size={16} />保存 AI 配置</button>
        </div>
        <div className="form-grid">
          <label className="span-2">Base URL
            <input value={aiConfig.baseUrl} onChange={(event) => setAiConfig({ ...aiConfig, baseUrl: event.target.value })} placeholder="https://api.openai.com/v1 或兼容接口地址" />
          </label>
          <label>Model ID
            <input value={aiConfig.modelId} onChange={(event) => setAiConfig({ ...aiConfig, modelId: event.target.value })} placeholder="gpt-4o-mini / deepseek-chat / ..." />
          </label>
          <label>API Key
            <input type="password" value={aiConfig.apiKey} onChange={(event) => setAiConfig({ ...aiConfig, apiKey: event.target.value, clearApiKey: false })} placeholder={aiConfig.hasApiKey ? "已保存，留空则不修改" : "请输入 API Key"} />
          </label>
          <label className="check-line"><input type="checkbox" checked={aiConfig.enabled} onChange={(event) => setAiConfig({ ...aiConfig, enabled: event.target.checked })} />启用自定义 AI 解读</label>
          <label className="check-line"><input type="checkbox" checked={aiConfig.clearApiKey} onChange={(event) => setAiConfig({ ...aiConfig, clearApiKey: event.target.checked, apiKey: event.target.checked ? "" : aiConfig.apiKey })} />保存时清空 API Key</label>
          <label className="span-2 prompt-editor">System Prompt
            <textarea value={aiConfig.systemPrompt} onChange={(event) => setAiConfig({ ...aiConfig, systemPrompt: event.target.value })} />
          </label>
          <label className="span-2 prompt-editor">User Prompt Template
            <textarea value={aiConfig.userPromptTemplate} onChange={(event) => setAiConfig({ ...aiConfig, userPromptTemplate: event.target.value })} />
          </label>
        </div>
        <div className="admin-prompt-actions">
          <button className="ghost-button" type="button" onClick={() => setAiConfig({ ...aiConfig, systemPrompt: DEFAULT_SYSTEM_PROMPT, userPromptTemplate: DEFAULT_USER_PROMPT_TEMPLATE })}>
            <RefreshCw size={16} />恢复默认 Prompt
          </button>
        </div>
        <p className="admin-hint">接口按 OpenAI-compatible 的 <code>/chat/completions</code> 调用。Prompt 模板支持 <code>{"{{question}}"}</code>、<code>{"{{cards}}"}</code>、<code>{"{{drawsJson}}"}</code> 占位符。请保留“只返回 JSON”的要求，并输出 <code>summary / cardReadings / analysis / insight / paywallRoasts</code> 这套结构，否则前台会自动回退到本地解读。</p>
      </section>

      <section className="admin-layout">
        <aside className="admin-list">
          <button className="ghost-button wide" onClick={() => { setDraft(emptyCard); setSelectedId(""); }}>新增卡牌</button>
          {cards.map((card) => (
            <button key={card.id} className={selectedId === card.id ? "admin-row active" : "admin-row"} onClick={() => setSelectedId(card.id)}>
              <span>{String(card.order).padStart(2, "0")} {card.name}</span>
              {!card.isPublished ? <EyeOff size={14} /> : null}
            </button>
          ))}
        </aside>

        <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void saveCard(); }}>
          <div className="admin-form-head">
            <div>
              <span className="eyebrow">Card Editor</span>
              <h1>{draft.id ? draft.name || "未命名卡牌" : "新增卡牌"}</h1>
            </div>
            <button className="primary-button" type="submit"><Save size={16} />保存</button>
          </div>

          <div className="form-grid">
            <label>ID<input value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} required /></label>
            <label>顺序<input type="number" value={draft.order} onChange={(event) => setDraft({ ...draft, order: Number(event.target.value) })} required /></label>
            <label>牌名<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label>
            <label>副标题<input value={draft.subtitle} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} /></label>
            <label>分类<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></label>
            <label>分组
              <input list="card-groups" value={draft.group} onChange={(event) => setDraft({ ...draft, group: event.target.value })} placeholder="ai / workplace / media ..." />
              <datalist id="card-groups">
                {knownGroups.map((item) => <option key={item} value={item} />)}
              </datalist>
            </label>
            <label>强调色<input value={draft.accentColor} onChange={(event) => setDraft({ ...draft, accentColor: event.target.value })} /></label>
            <label className="span-2">卡牌封面
              <div className="image-upload-row">
                <div className="image-preview">
                  {draft.imageUrl ? <img src={draft.imageUrl} alt={`${draft.name || "卡牌"}封面预览`} /> : <span>暂无封面</span>}
                </div>
                <div className="image-upload-controls">
                  <input value={draft.imageUrl} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })} placeholder="上传后自动生成，也可手动填 URL" />
                  <label className="upload-button">
                    <ImageUp size={16} />
                    {isUploadingImage ? "上传中" : "上传封面"}
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadCardImage(event.target.files?.[0])} disabled={isUploadingImage} />
                  </label>
                </div>
              </div>
            </label>
            <label className="span-2">正位<textarea value={draft.uprightMeaning} onChange={(event) => setDraft({ ...draft, uprightMeaning: event.target.value })} /></label>
            <label className="span-2">逆位<textarea value={draft.reversedMeaning} onChange={(event) => setDraft({ ...draft, reversedMeaning: event.target.value })} /></label>
            <label className="span-2">舞台一句话<textarea value={draft.stageLine} onChange={(event) => setDraft({ ...draft, stageLine: event.target.value })} /></label>
            <label className="span-2">描述<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
            <label>标签<input value={draft.tags.join("，")} onChange={(event) => setDraft({ ...draft, tags: toList(event.target.value) })} /></label>
            <label>AI 关键词<input value={draft.aiKeywords.join("，")} onChange={(event) => setDraft({ ...draft, aiKeywords: toList(event.target.value) })} /></label>
            <label className="span-2">图像元素<input value={draft.imageElements.join("，")} onChange={(event) => setDraft({ ...draft, imageElements: toList(event.target.value) })} /></label>
            <label className="span-2">视觉风格<textarea value={draft.visualStyle} onChange={(event) => setDraft({ ...draft, visualStyle: event.target.value })} /></label>
            <label className="check-line"><input type="checkbox" checked={draft.isPublished} onChange={(event) => setDraft({ ...draft, isPublished: event.target.checked })} />已发布</label>
          </div>
          {message ? <p className="admin-message">{message}</p> : null}
        </form>
      </section>
    </main>
  );
}
