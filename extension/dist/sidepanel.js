"use strict";
(() => {
  // src/shared/settings.ts
  var DEFAULT_LOCAL_TOOLS = [
    {
      name: "yt-dlp",
      path: "",
      description: "Downloads video metadata and subtitles. Used for transcripts when the page has no caption tracks."
    },
    {
      name: "ffmpeg",
      path: "",
      description: "Audio/video processing (extract audio, cut clips, probe files)."
    }
  ];
  var DEFAULT_SETTINGS = {
    language: "ru",
    provider: "anthropic",
    anthropicApiKey: "",
    anthropicModel: "claude-opus-5-5",
    openaiApiKey: "",
    openaiModel: "gpt-5",
    openaiBaseUrl: "https://api.openai.com/v1",
    geminiApiKey: "",
    geminiModel: "gemini-2.5-pro",
    ollamaBaseUrl: "http://localhost:11434/v1",
    ollamaModel: "llama3.1",
    effort: "medium",
    youtubeApiKey: "",
    showOverlay: true,
    showBadges: true,
    computeOutliers: true,
    customApis: [],
    localTools: DEFAULT_LOCAL_TOOLS,
    nativeHostName: "com.nubit.host"
  };
  var KEY = "settings";
  async function loadSettings() {
    const stored = await chrome.storage.local.get(KEY);
    const s = stored[KEY] ?? {};
    const merged = { ...DEFAULT_SETTINGS, ...s };
    const names = new Set(merged.localTools.map((t2) => t2.name));
    for (const t2 of DEFAULT_LOCAL_TOOLS) if (!names.has(t2.name)) merged.localTools.push({ ...t2 });
    return merged;
  }
  function onSettingsChanged(cb) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[KEY]) {
        cb({ ...DEFAULT_SETTINGS, ...changes[KEY].newValue });
      }
    });
  }
  function providerReady(s) {
    switch (s.provider) {
      case "anthropic":
        return !!s.anthropicApiKey;
      case "openai":
        return !!s.openaiApiKey;
      case "gemini":
        return !!s.geminiApiKey;
      case "ollama":
        return !!s.ollamaBaseUrl;
    }
  }

  // src/shared/i18n.ts
  var dict = {
    // generic
    app_name: { ru: "Nubit", en: "Nubit" },
    settings: { ru: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438", en: "Settings" },
    save: { ru: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C", en: "Save" },
    saved: { ru: "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E", en: "Saved" },
    cancel: { ru: "\u041E\u0442\u043C\u0435\u043D\u0430", en: "Cancel" },
    delete: { ru: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", en: "Delete" },
    add: { ru: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C", en: "Add" },
    copy: { ru: "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C", en: "Copy" },
    copied: { ru: "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E", en: "Copied" },
    loading: { ru: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026", en: "Loading\u2026" },
    error: { ru: "\u041E\u0448\u0438\u0431\u043A\u0430", en: "Error" },
    ok: { ru: "OK", en: "OK" },
    unknown: { ru: "\u2014", en: "\u2014" },
    // metrics
    vph: { ru: "\u041F\u0440\u043E\u0441\u043C./\u0447\u0430\u0441", en: "Views/hour" },
    vph_full: { ru: "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u043E\u0432 \u0432 \u0447\u0430\u0441 (\u0441\u0440\u0435\u0434\u043D\u0435\u0435 \u0441 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438)", en: "Views per hour (lifetime average)" },
    vph_recent: { ru: "\u0421\u0435\u0439\u0447\u0430\u0441", en: "Now" },
    vph_recent_full: { ru: "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u043E\u0432 \u0432 \u0447\u0430\u0441 \u0437\u0430 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0435 \u0432\u0440\u0435\u043C\u044F (\u043F\u043E \u043D\u0430\u0448\u0438\u043C \u0437\u0430\u043C\u0435\u0440\u0430\u043C)", en: "Recent views per hour (from our snapshots)" },
    views: { ru: "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u044B", en: "Views" },
    likes: { ru: "\u041B\u0430\u0439\u043A\u0438", en: "Likes" },
    comments: { ru: "\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0438", en: "Comments" },
    age: { ru: "\u0412\u043E\u0437\u0440\u0430\u0441\u0442", en: "Age" },
    outlier: { ru: "Outlier", en: "Outlier" },
    outlier_full: { ru: "\u0412\u043E \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0440\u0430\u0437 \u0431\u043E\u043B\u044C\u0448\u0435 \u043C\u0435\u0434\u0438\u0430\u043D\u044B \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u043E\u0432 \u043A\u0430\u043D\u0430\u043B\u0430", en: "Views vs the channel median" },
    subscribers: { ru: "\u041F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A\u0438", en: "Subscribers" },
    engagement: { ru: "\u0412\u043E\u0432\u043B\u0435\u0447\u0451\u043D\u043D\u043E\u0441\u0442\u044C", en: "Engagement" },
    engagement_full: { ru: "(\u043B\u0430\u0439\u043A\u0438 + \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0438) / \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u044B", en: "(likes + comments) / views" },
    seo_score: { ru: "SEO-\u043E\u0446\u0435\u043D\u043A\u0430", en: "SEO score" },
    tags: { ru: "\u0422\u0435\u0433\u0438", en: "Tags" },
    no_tags: { ru: "\u0422\u0435\u0433\u043E\u0432 \u043D\u0435\u0442", en: "No tags" },
    copy_all_tags: { ru: "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0432\u0441\u0435", en: "Copy all" },
    captions: { ru: "\u0421\u0443\u0431\u0442\u0438\u0442\u0440\u044B", en: "Captions" },
    auto: { ru: "\u0430\u0432\u0442\u043E", en: "auto" },
    duration: { ru: "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C", en: "Duration" },
    computing: { ru: "\u0441\u0447\u0438\u0442\u0430\u0435\u043C\u2026", en: "computing\u2026" },
    show_checks: { ru: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438", en: "Show checks" },
    hide_checks: { ru: "\u0421\u043A\u0440\u044B\u0442\u044C \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438", en: "Hide checks" },
    // time units
    t_min: { ru: "\u043C\u0438\u043D", en: "min" },
    t_hour: { ru: "\u0447", en: "h" },
    t_day: { ru: "\u0434", en: "d" },
    t_month: { ru: "\u043C\u0435\u0441", en: "mo" },
    t_year: { ru: "\u0433", en: "y" },
    // actions
    act_analyze_video: { ru: "\u0410\u043D\u0430\u043B\u0438\u0437 \u0432\u0438\u0434\u0435\u043E", en: "Analyze video" },
    act_why_performing: { ru: "\u041F\u043E\u0447\u0435\u043C\u0443 \u0442\u0430\u043A \u043D\u0430\u0431\u0438\u0440\u0430\u0435\u0442?", en: "Why is it performing?" },
    act_titles: { ru: "\u0412\u0430\u0440\u0438\u0430\u043D\u0442\u044B \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0439", en: "Title ideas" },
    act_tags_description: { ru: "\u0422\u0435\u0433\u0438 \u0438 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435", en: "Tags & description" },
    act_keyword_research: { ru: "\u0410\u043D\u0430\u043B\u0438\u0437 \u0437\u0430\u043F\u0440\u043E\u0441\u0430", en: "Keyword research" },
    act_channel_review: { ru: "\u0420\u0430\u0437\u0431\u043E\u0440 \u043A\u0430\u043D\u0430\u043B\u0430", en: "Channel review" },
    act_competitors: { ru: "\u041A\u043E\u043D\u043A\u0443\u0440\u0435\u043D\u0442\u044B", en: "Competitors" },
    act_content_ideas: { ru: "\u0418\u0434\u0435\u0438 \u0434\u043B\u044F \u0432\u0438\u0434\u0435\u043E", en: "Content ideas" },
    act_summarize: { ru: "\u041A\u0440\u0430\u0442\u043A\u043E \u043E \u0447\u0451\u043C \u0432\u0438\u0434\u0435\u043E", en: "Summarize video" },
    open_chat: { ru: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0447\u0430\u0442", en: "Open chat" },
    ai_analyze: { ru: "\u0410\u043D\u0430\u043B\u0438\u0437 \u0418\u0418", en: "AI analysis" },
    // side panel
    panel_placeholder: { ru: "\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u043E \u0432\u0438\u0434\u0435\u043E, \u043A\u0430\u043D\u0430\u043B\u0435 \u0438\u043B\u0438 \u0437\u0430\u043F\u0440\u043E\u0441\u0435\u2026", en: "Ask about this video, channel or search\u2026" },
    panel_send: { ru: "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C", en: "Send" },
    panel_stop: { ru: "\u0421\u0442\u043E\u043F", en: "Stop" },
    panel_clear: { ru: "\u041D\u043E\u0432\u044B\u0439 \u0447\u0430\u0442", en: "New chat" },
    panel_no_key: { ru: "\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 API-\u043A\u043B\u044E\u0447 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445, \u0447\u0442\u043E\u0431\u044B \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0418\u0418.", en: "Add an API key in settings to enable the AI." },
    panel_open_settings: { ru: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438", en: "Open settings" },
    panel_context_none: { ru: "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0432\u0438\u0434\u0435\u043E, \u043F\u043E\u0438\u0441\u043A \u0438\u043B\u0438 \u043A\u0430\u043D\u0430\u043B \u043D\u0430 YouTube", en: "Open a video, search or channel on YouTube" },
    panel_welcome: {
      ru: "\u042F Nubit \u2014 \u0418\u0418-\u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A YouTube. \u0412\u0438\u0436\u0443 \u043E\u0442\u043A\u0440\u044B\u0442\u0443\u044E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443, \u0443\u043C\u0435\u044E \u0438\u0441\u043A\u0430\u0442\u044C \u0432\u0438\u0434\u0435\u043E, \u0447\u0438\u0442\u0430\u0442\u044C \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u044B \u0438 \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0438, \u0441\u0440\u0430\u0432\u043D\u0438\u0432\u0430\u0442\u044C \u0441 \u043A\u0430\u043D\u0430\u043B\u043E\u043C \u0438 \u043F\u043E\u0434\u0431\u0438\u0440\u0430\u0442\u044C \u043A\u043B\u044E\u0447\u0435\u0432\u044B\u0435 \u0441\u043B\u043E\u0432\u0430.",
      en: "I am Nubit \u2014 an AI YouTube analyst. I see the open page, can search videos, read transcripts and comments, compare against the channel and research keywords."
    },
    tool_running: { ru: "\u0432\u044B\u043F\u043E\u043B\u043D\u044F\u044E", en: "running" },
    tool_done: { ru: "\u0433\u043E\u0442\u043E\u0432\u043E", en: "done" },
    tool_error: { ru: "\u043E\u0448\u0438\u0431\u043A\u0430", en: "error" },
    truncated_notice: { ru: "\u041E\u0442\u0432\u0435\u0442 \u0431\u044B\u043B \u043E\u0431\u0440\u0435\u0437\u0430\u043D \u043F\u043E \u043B\u0438\u043C\u0438\u0442\u0443 \u0442\u043E\u043A\u0435\u043D\u043E\u0432.", en: "The reply was cut off by the token limit." },
    refusal_notice: { ru: "\u041C\u043E\u0434\u0435\u043B\u044C \u043E\u0442\u043A\u0430\u0437\u0430\u043B\u0430\u0441\u044C \u043E\u0442\u0432\u0435\u0447\u0430\u0442\u044C \u043D\u0430 \u044D\u0442\u043E\u0442 \u0437\u0430\u043F\u0440\u043E\u0441.", en: "The model declined to answer this request." },
    aborted: { ru: "\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E.", en: "Stopped." }
  };
  var lang = "ru";
  function setLang(l) {
    lang = l;
  }
  function t(key) {
    return dict[key][lang];
  }

  // src/shared/markdown.ts
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function inline(s) {
    let out = escapeHtml(s);
    out = out.replace(/`([^`]+)`/g, (_m, c) => `<code>${c}</code>`);
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
    out = out.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    out = out.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
    return out;
  }
  function renderMarkdown(md) {
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let i = 0;
    let para = [];
    const flushPara = () => {
      if (para.length) {
        html.push(`<p>${para.map(inline).join("<br>")}</p>`);
        para = [];
      }
    };
    while (i < lines.length) {
      const line = lines[i];
      if (/^```/.test(line)) {
        flushPara();
        const buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
        i++;
        html.push(`<pre><code>${escapeHtml(buf.join("\n"))}</code></pre>`);
        continue;
      }
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        flushPara();
        const level = Math.min(h[1].length + 2, 6);
        html.push(`<h${level}>${inline(h[2])}</h${level}>`);
        i++;
        continue;
      }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
        flushPara();
        html.push("<hr>");
        i++;
        continue;
      }
      if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
        flushPara();
        const header = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(splitRow(lines[i++]));
        html.push(
          `<table><thead><tr>${header.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`
        );
        continue;
      }
      const li = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
      if (li) {
        flushPara();
        const ordered = /\d/.test(li[2]);
        const items = [];
        const baseIndent = li[1].length;
        while (i < lines.length) {
          const m = lines[i].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
          if (m && m[1].length === baseIndent) {
            items.push(m[3]);
            i++;
            while (i < lines.length && lines[i].trim() && !/^(\s*)([-*+]|\d+[.)])\s+/.test(lines[i]) && /^\s+/.test(lines[i])) {
              items[items.length - 1] += " " + lines[i].trim();
              i++;
            }
          } else if (m && m[1].length > baseIndent) {
            const sub = [];
            const subIndent = m[1].length;
            while (i < lines.length) {
              const mm = lines[i].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
              if (mm && mm[1].length >= subIndent) {
                sub.push(mm[3]);
                i++;
              } else break;
            }
            items[items.length - 1] += `<ul>${sub.map((s) => `<li>${inline(s)}</li>`).join("")}</ul>`;
          } else break;
        }
        const tag = ordered ? "ol" : "ul";
        html.push(
          `<${tag}>${items.map((it) => `<li>${it.includes("<ul>") ? inline(it.slice(0, it.indexOf("<ul>"))) + it.slice(it.indexOf("<ul>")) : inline(it)}</li>`).join("")}</${tag}>`
        );
        continue;
      }
      if (/^\s*>\s?/.test(line)) {
        flushPara();
        const buf = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ""));
        html.push(`<blockquote>${buf.map(inline).join("<br>")}</blockquote>`);
        continue;
      }
      if (!line.trim()) {
        flushPara();
        i++;
        continue;
      }
      para.push(line);
      i++;
    }
    flushPara();
    return html.join("\n");
  }
  function splitRow(line) {
    return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  }

  // src/sidepanel/index.ts
  var $ = (id) => document.getElementById(id);
  var messagesEl = $("messages");
  var inputEl = $("input");
  var sendBtn = $("send");
  var stopBtn = $("stop");
  var actionsEl = $("actions");
  var contextEl = $("context");
  var includeCtx = $("include-context");
  var settings;
  var history = [];
  var busy = false;
  var tabId = null;
  var pageKind = "other";
  var port = null;
  var streamEl = null;
  var streamText = "";
  var toolEls = /* @__PURE__ */ new Map();
  var ACTIONS = [
    { id: "analyze_video", key: "act_analyze_video", kinds: ["watch", "shorts"] },
    { id: "why_performing", key: "act_why_performing", kinds: ["watch"] },
    { id: "titles", key: "act_titles", kinds: ["watch", "shorts"] },
    { id: "tags_description", key: "act_tags_description", kinds: ["watch"] },
    { id: "summarize", key: "act_summarize", kinds: ["watch"] },
    { id: "competitors", key: "act_competitors", kinds: ["watch"] },
    { id: "keyword_research", key: "act_keyword_research", kinds: ["search"] },
    { id: "channel_review", key: "act_channel_review", kinds: ["channel"] },
    { id: "content_ideas", key: "act_content_ideas", kinds: ["channel", "search", "home", "watch", "other", "shorts", "studio"] }
  ];
  async function currentTabId() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0]?.id ?? null;
  }
  function connect() {
    port = chrome.runtime.connect({ name: "chat" });
    port.onMessage.addListener(onEvent);
    port.onDisconnect.addListener(() => {
      port = null;
      if (busy) finish();
      setTimeout(connect, 500);
    });
    port.postMessage({ type: "hello", tabId });
  }
  function applyTexts() {
    inputEl.placeholder = t("panel_placeholder");
    sendBtn.textContent = t("panel_send");
    stopBtn.textContent = t("panel_stop");
    $("clear").title = t("panel_clear");
    $("settings").title = t("settings");
    $("nokey-text").textContent = t("panel_no_key");
    $("nokey-open").textContent = t("panel_open_settings");
    $("ctx-label").textContent = settings.language === "ru" ? "\u041F\u0440\u0438\u043A\u0440\u0435\u043F\u0438\u0442\u044C \u043E\u0442\u043A\u0440\u044B\u0442\u0443\u044E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443" : "Attach the open page";
    renderActions();
  }
  function renderActions() {
    actionsEl.innerHTML = "";
    for (const a of ACTIONS.filter((x) => x.kinds.includes(pageKind))) {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = t(a.key);
      b.disabled = busy;
      b.addEventListener("click", () => send(inputEl.value, a.id));
      actionsEl.appendChild(b);
    }
  }
  function setContext(summary, kind) {
    pageKind = kind;
    contextEl.textContent = summary ?? t("panel_context_none");
    renderActions();
  }
  function addEl(cls, html) {
    const el = document.createElement("div");
    el.className = cls;
    if (html !== void 0) el.innerHTML = html;
    messagesEl.appendChild(el);
    scrollDown();
    return el;
  }
  function scrollDown() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function renderHistory() {
    messagesEl.innerHTML = "";
    if (!history.length) addEl("welcome", escapeHtml(t("panel_welcome")));
    for (const m of history) {
      if (m.role === "user") addEl("msg user", escapeHtml(m.display ?? stripContext(m.content)));
      else if (m.role === "assistant") {
        if (m.content.trim()) addEl("msg assistant", renderMarkdown(m.content));
      }
    }
  }
  function stripContext(s) {
    return s.replace(/\n*<page_context>[\s\S]*?<\/page_context>/g, "").trim();
  }
  function onEvent(ev) {
    switch (ev.type) {
      case "context":
        setContext(ev.summary, ev.kind);
        break;
      case "run_action":
        send("", ev.action);
        break;
      case "user":
        history.push(ev.message);
        if (!history.filter((m) => m.role === "user").length) messagesEl.innerHTML = "";
        addEl("msg user", escapeHtml(ev.message.role === "user" ? ev.message.display ?? stripContext(ev.message.content) : ""));
        break;
      case "delta":
        if (!streamEl) {
          streamEl = addEl("msg assistant streaming");
          streamText = "";
        }
        streamText += ev.text;
        streamEl.innerHTML = renderMarkdown(streamText);
        scrollDown();
        break;
      case "assistant":
        history.push(ev.message);
        if (streamEl) {
          streamEl.classList.remove("streaming");
          if (ev.message.role === "assistant") streamEl.innerHTML = renderMarkdown(ev.message.content);
          streamEl = null;
        } else if (ev.message.role === "assistant" && ev.message.content.trim()) {
          addEl("msg assistant", renderMarkdown(ev.message.content));
        }
        break;
      case "tool":
        history.push(ev.message);
        break;
      case "tool_status": {
        let el = toolEls.get(ev.id);
        if (!el) {
          el = addEl("tool");
          toolEls.set(ev.id, el);
        }
        el.className = `tool ${ev.status}`;
        const label = ev.status === "running" ? t("tool_running") : ev.status === "done" ? t("tool_done") : t("tool_error");
        el.innerHTML = `<span class="dot"></span><span>${escapeHtml(ev.summary)} \u2014 ${label}</span>`;
        scrollDown();
        break;
      }
      case "notice":
        addEl("msg notice", escapeHtml(ev.text === "max_tokens" ? t("truncated_notice") : ev.text === "refusal" ? t("refusal_notice") : ev.text === "aborted" ? t("aborted") : ev.text));
        break;
      case "error":
        addEl("msg error", escapeHtml(ev.text));
        break;
      case "done":
        finish();
        break;
    }
  }
  function finish() {
    busy = false;
    if (streamEl) {
      streamEl.classList.remove("streaming");
      streamEl = null;
    }
    sendBtn.classList.remove("hidden");
    stopBtn.classList.add("hidden");
    sendBtn.disabled = false;
    inputEl.disabled = false;
    renderActions();
    persist();
    inputEl.focus();
  }
  async function send(text, action) {
    if (busy || !port) return;
    if (!providerReady(settings)) {
      $("nokey").classList.remove("hidden");
      return;
    }
    if (!text.trim() && !action) return;
    busy = true;
    toolEls.clear();
    sendBtn.classList.add("hidden");
    stopBtn.classList.remove("hidden");
    inputEl.value = "";
    inputEl.disabled = true;
    renderActions();
    tabId = await currentTabId();
    port.postMessage({ type: "send", tabId, text, action, history, includeContext: includeCtx.checked });
  }
  function persist() {
    if (tabId === null) return;
    chrome.storage.session.set({ [`chat:${tabId}`]: history.slice(-60) }).catch(() => void 0);
  }
  async function restore() {
    if (tabId === null) return;
    const key = `chat:${tabId}`;
    const stored = (await chrome.storage.session.get(key))[key];
    if (stored?.length) history = stored;
    renderHistory();
  }
  async function main() {
    settings = await loadSettings();
    setLang(settings.language);
    document.documentElement.lang = settings.language;
    tabId = await currentTabId();
    applyTexts();
    if (!providerReady(settings)) $("nokey").classList.remove("hidden");
    await restore();
    connect();
    onSettingsChanged((s) => {
      settings = s;
      setLang(s.language);
      applyTexts();
      $("nokey").classList.toggle("hidden", providerReady(s));
    });
    sendBtn.addEventListener("click", () => send(inputEl.value));
    stopBtn.addEventListener("click", () => port?.postMessage({ type: "abort" }));
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send(inputEl.value);
      }
    });
    $("clear").addEventListener("click", () => {
      if (busy) port?.postMessage({ type: "abort" });
      history = [];
      toolEls.clear();
      persist();
      renderHistory();
    });
    $("settings").addEventListener("click", () => chrome.runtime.openOptionsPage());
    $("nokey-open").addEventListener("click", () => chrome.runtime.openOptionsPage());
    const refreshContext = async () => {
      const id = await currentTabId();
      if (id !== tabId) {
        tabId = id;
        history = [];
        await restore();
        port?.postMessage({ type: "hello", tabId });
        return;
      }
      const res = await chrome.runtime.sendMessage({ type: "pageContextSummary", tabId }).catch(() => null);
      if (res) setContext(res.summary, res.kind);
    };
    chrome.tabs.onActivated.addListener(refreshContext);
    chrome.tabs.onUpdated.addListener((id, info) => {
      if (id === tabId && (info.status === "complete" || info.url)) setTimeout(refreshContext, 1200);
    });
  }
  main().catch((err) => addEl("msg error", escapeHtml(String(err))));
})();
