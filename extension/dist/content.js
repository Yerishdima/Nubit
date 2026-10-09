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
    customProviders: [],
    activeCustomProviderId: "",
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
  function formatCompact(n) {
    if (n === void 0 || !isFinite(n)) return "\u2014";
    const abs = Math.abs(n);
    if (abs >= 1e9) return trim(n / 1e9) + (lang === "ru" ? " \u043C\u043B\u0440\u0434" : "B");
    if (abs >= 1e6) return trim(n / 1e6) + (lang === "ru" ? " \u043C\u043B\u043D" : "M");
    if (abs >= 1e3) return trim(n / 1e3) + (lang === "ru" ? " \u0442\u044B\u0441" : "K");
    return String(Math.round(n));
  }
  function trim(x) {
    return (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(/\.?0+$/, "");
  }
  function formatAge(hours) {
    if (hours === void 0 || !isFinite(hours)) return "\u2014";
    if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} ${t("t_min")}`;
    if (hours < 48) return `${Math.round(hours)} ${t("t_hour")}`;
    const days = hours / 24;
    if (days < 60) return `${Math.round(days)} ${t("t_day")}`;
    const months = days / 30.44;
    if (months < 24) return `${Math.round(months)} ${t("t_month")}`;
    return `${(days / 365.25).toFixed(1)} ${t("t_year")}`;
  }
  function formatPercent(x, digits = 1) {
    if (x === void 0 || !isFinite(x)) return "\u2014";
    return (x * 100).toFixed(digits) + "%";
  }
  function formatDuration(sec) {
    if (sec === void 0 || !isFinite(sec)) return "\u2014";
    const h = Math.floor(sec / 3600);
    const m = Math.floor(sec % 3600 / 60);
    const s = Math.floor(sec % 60);
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
  }

  // src/shared/metrics.ts
  var SUFFIX = {
    k: 1e3,
    m: 1e6,
    b: 1e9,
    \u0442\u044B\u0441: 1e3,
    \u043C\u043B\u043D: 1e6,
    \u043C\u043B\u0440\u0434: 1e9,
    \u0442\u0438\u0441: 1e3
  };
  function parseCompactNumber(text2) {
    if (!text2) return void 0;
    const t2 = text2.replace(/ | /g, " ").trim().toLowerCase();
    if (!t2) return void 0;
    if (new RegExp("^(no|\u043D\u0435\u0442|\u043D\u0435\u043C\u0430\u0454)(?!\\p{L})", "u").test(t2)) return 0;
    const m = t2.match(/(\d[\d\s.,]*)\s*(k|m|b|тыс|млн|млрд|тис)?(?![a-zа-яіїє])/);
    if (!m) return void 0;
    const numStr = m[1].replace(/\s/g, "").replace(/[.,]$/, "");
    const suffix = m[2];
    let num;
    if (suffix) {
      num = parseFloat(numStr.replace(",", "."));
    } else {
      num = parseInt(numStr.replace(/[.,]/g, ""), 10);
    }
    if (!isFinite(num)) return void 0;
    return Math.round(num * (suffix ? SUFFIX[suffix] : 1));
  }
  var UNIT_HOURS = [
    [/sec|сек/, 1 / 3600],
    [/min|мин|хв/, 1 / 60],
    [/hour|годин|час/, 1],
    [/day|дн|день|дні/, 24],
    [/week|нед|тиж/, 168],
    [/month|мес|міс/, 730],
    [/year|год|лет|рік|рок/, 8760]
  ];
  var COMPACT_HOURS = { s: 1 / 3600, m: 1 / 60, h: 1, d: 24, w: 168, mo: 730, y: 8760 };
  function parseRelativeTimeHours(text2) {
    if (!text2) return void 0;
    const t2 = text2.toLowerCase();
    const n = t2.match(/(\d+)/);
    if (!n) return void 0;
    for (const [re, h] of UNIT_HOURS) if (re.test(t2)) return parseInt(n[1], 10) * h;
    const c = t2.match(/(\d+)\s*(mo|s|m|h|d|w|y)(?![a-z])/);
    if (c) return parseInt(c[1], 10) * COMPACT_HOURS[c[2]];
    return void 0;
  }
  function parseDuration(text2) {
    if (!text2) return void 0;
    const parts = text2.trim().split(":").map((p) => parseInt(p, 10));
    if (parts.some((p) => !isFinite(p))) return void 0;
    return parts.reduce((acc, p) => acc * 60 + p, 0);
  }
  function isViewsText(text2) {
    return /view|просмотр|перегляд/i.test(text2) && !/watching|смотр[ия]т|дивляться/i.test(text2);
  }
  function isAgeText(text2) {
    return /\bago\b|назад|тому/i.test(text2) && /\d/.test(text2);
  }
  function ageHoursFromIso(iso, now = Date.now()) {
    if (!iso) return void 0;
    const t2 = Date.parse(iso);
    if (!isFinite(t2)) return void 0;
    return Math.max(0, (now - t2) / 36e5);
  }
  function computeVph(views, ageHours) {
    if (views === void 0 || ageHours === void 0) return void 0;
    return views / Math.max(ageHours, 1);
  }
  function median(values) {
    const v = values.filter((x) => isFinite(x)).sort((a, b) => a - b);
    if (v.length === 0) return void 0;
    const mid = Math.floor(v.length / 2);
    return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
  }
  function computeOutlier(views, channelViews, excludeSelf) {
    if (views === void 0) return void 0;
    const others = excludeSelf === void 0 ? channelViews : channelViews.filter((v) => v !== excludeSelf);
    if (others.length < 3) return void 0;
    const med = median(others);
    if (!med) return void 0;
    return views / med;
  }
  function hasChapters(description) {
    if (!description) return false;
    const lines = description.split("\n").filter((l) => /^\s*\(?\d{1,2}:\d{2}(?::\d{2})?\)?\s*[-–—:]?\s*\S/.test(l));
    return lines.length >= 3 && lines.some((l) => /^\s*\(?0?0:00/.test(l));
  }
  var STOP = new Set(
    "the a an and or of to in on for with at by from is are was were be this that it \u043A\u0430\u043A \u0438 \u0432 \u043D\u0430 \u0441 \u043F\u043E \u0434\u043B\u044F \u043E\u0442 \u0434\u043E \u0438\u0437 \u043D\u0435 \u0447\u0442\u043E \u044D\u0442\u043E \u0438\u043B\u0438 \u0443 \u043E \u0430 \u043D\u043E \u0437\u0430 \u0436\u0435 \u043A \u0442\u044B \u0432\u044B \u043C\u044B \u044F".split(" ")
  );
  function words(text2) {
    return text2.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
  }
  function overlap(a, b) {
    if (a.length === 0) return 0;
    const hay = b.toLowerCase();
    const hit = a.filter((w) => hay.includes(w)).length;
    return hit / a.length;
  }
  var SEO_LABELS = {
    title_len: {
      ru: ["\u0414\u043B\u0438\u043D\u0430 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F 30\u201370 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432", "\u041A\u043E\u0440\u043E\u0442\u043A\u0438\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F \u0445\u0443\u0436\u0435 \u043E\u0431\u044A\u044F\u0441\u043D\u044F\u044E\u0442 \u0442\u0435\u043C\u0443, \u0434\u043B\u0438\u043D\u043D\u044B\u0435 \u043E\u0431\u0440\u0435\u0437\u0430\u044E\u0442\u0441\u044F \u0432 \u0432\u044B\u0434\u0430\u0447\u0435."],
      en: ["Title is 30\u201370 characters", "Short titles under-explain; long ones get cut off in results."]
    },
    title_caps: {
      ru: ["\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043D\u0435 \u043A\u0430\u043F\u0441\u043E\u043C", "\u0421\u043F\u043B\u043E\u0448\u043D\u044B\u0435 \u0437\u0430\u0433\u043B\u0430\u0432\u043D\u044B\u0435 \u0441\u043D\u0438\u0436\u0430\u044E\u0442 \u0434\u043E\u0432\u0435\u0440\u0438\u0435 \u0438 CTR."],
      en: ["Title is not ALL CAPS", "All-caps titles reduce trust and CTR."]
    },
    desc_len: {
      ru: ["\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u2265 250 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432", "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0434\u0430\u0451\u0442 YouTube \u0431\u043E\u043B\u044C\u0448\u0435 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430 \u0434\u043B\u044F \u0440\u0430\u043D\u0436\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F."],
      en: ["Description \u2265 250 characters", "A fuller description gives YouTube more ranking context."]
    },
    desc_keywords: {
      ru: ["\u0421\u043B\u043E\u0432\u0430 \u0438\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F \u0435\u0441\u0442\u044C \u0432 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0438", "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043A\u043B\u044E\u0447\u0435\u0432\u044B\u0435 \u0441\u043B\u043E\u0432\u0430 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F \u0432 \u043F\u0435\u0440\u0432\u044B\u0445 \u0441\u0442\u0440\u043E\u043A\u0430\u0445 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044F."],
      en: ["Title keywords appear in the description", "Repeat the title keywords in the first lines of the description."]
    },
    tags_count: {
      ru: ["5\u201330 \u0442\u0435\u0433\u043E\u0432", "\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0442\u0435\u0433\u0438: \u0442\u043E\u0447\u043D\u044B\u0435, \u0448\u0438\u0440\u043E\u043A\u0438\u0435 \u0438 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u044B \u043D\u0430\u043F\u0438\u0441\u0430\u043D\u0438\u044F."],
      en: ["5\u201330 tags", "Add tags: exact, broad, and spelling variants."]
    },
    tags_keywords: {
      ru: ["\u0421\u043B\u043E\u0432\u0430 \u0438\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F \u0435\u0441\u0442\u044C \u0432 \u0442\u0435\u0433\u0430\u0445", "\u041F\u0435\u0440\u0432\u044B\u0435 \u0442\u0435\u0433\u0438 \u0434\u043E\u043B\u0436\u043D\u044B \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0442\u044C \u0433\u043B\u0430\u0432\u043D\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441 \u0438\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F."],
      en: ["Title keywords appear in tags", "The first tags should repeat the main query from the title."]
    },
    chapters: {
      ru: ["\u0415\u0441\u0442\u044C \u0433\u043B\u0430\u0432\u044B (\u0442\u0430\u0439\u043C\u043A\u043E\u0434\u044B)", "\u0413\u043B\u0430\u0432\u044B \u043F\u043E\u043F\u0430\u0434\u0430\u044E\u0442 \u0432 \u043F\u043E\u0438\u0441\u043A \u0438 \u0443\u043B\u0443\u0447\u0448\u0430\u044E\u0442 \u0443\u0434\u0435\u0440\u0436\u0430\u043D\u0438\u0435."],
      en: ["Has chapters (timestamps)", "Chapters surface in search and improve retention."]
    },
    hashtags: {
      ru: ["\u0415\u0441\u0442\u044C \u0445\u044D\u0448\u0442\u0435\u0433\u0438", "1\u20133 \u0445\u044D\u0448\u0442\u0435\u0433\u0430 \u0432 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0438 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u044E\u0442\u0441\u044F \u043D\u0430\u0434 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435\u043C."],
      en: ["Has hashtags", "1\u20133 hashtags in the description show above the title."]
    },
    duration: {
      ru: ["\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u2265 8 \u043C\u0438\u043D\u0443\u0442", "\u041E\u0442 8 \u043C\u0438\u043D\u0443\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B mid-roll \u0440\u0435\u043A\u043B\u0430\u043C\u043D\u044B\u0435 \u0432\u0441\u0442\u0430\u0432\u043A\u0438."],
      en: ["Duration \u2265 8 minutes", "From 8 minutes mid-roll ads become available."]
    },
    links: {
      ru: ["\u0415\u0441\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0438 / \u043F\u0440\u0438\u0437\u044B\u0432 \u043A \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044E", "\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0441\u0441\u044B\u043B\u043A\u0438 \u043D\u0430 \u043F\u043B\u0435\u0439\u043B\u0438\u0441\u0442\u044B, \u0441\u043E\u0446\u0441\u0435\u0442\u0438 \u0438\u043B\u0438 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0448\u0430\u0433 \u0434\u043B\u044F \u0437\u0440\u0438\u0442\u0435\u043B\u044F."],
      en: ["Has links / call to action", "Add links to playlists, socials or the next step for the viewer."]
    }
  };
  function seoScore(video, lang2 = "ru") {
    const title = video.title ?? "";
    const desc = video.description ?? "";
    const tags = video.tags ?? [];
    const tw = words(title);
    const letters = title.replace(/[^\p{L}]/gu, "");
    const capsRatio = letters.length ? letters.replace(/[^\p{Lu}]/gu, "").length / letters.length : 0;
    const raw = [
      ["title_len", title.length >= 30 && title.length <= 70, 12],
      ["title_caps", capsRatio < 0.6, 5],
      ["desc_len", desc.length >= 250, 13],
      ["desc_keywords", overlap(tw, desc) >= 0.5, 15],
      ["tags_count", tags.length >= 5 && tags.length <= 30, 12],
      ["tags_keywords", overlap(tw, tags.join(" ")) >= 0.5, 15],
      ["chapters", video.hasChapters ?? hasChapters(desc), 10],
      ["hashtags", new RegExp("#\\p{L}", "u").test(desc), 5],
      ["links", /https?:\/\//.test(desc), 8]
    ];
    if (video.durationSec !== void 0) raw.push(["duration", video.durationSec >= 480, 5]);
    const checks = raw.map(([id, ok, weight]) => ({
      id,
      ok,
      weight,
      label: SEO_LABELS[id][lang2][0],
      hint: SEO_LABELS[id][lang2][1]
    }));
    const total = checks.reduce((s, c) => s + c.weight, 0);
    const got = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
    return { score: Math.round(got / total * 100), checks };
  }
  function computeMetrics(video, lang2 = "ru", channelViews, now = Date.now()) {
    const ageHours = ageHoursFromIso(video.publishedAt, now);
    const vph = computeVph(video.views, ageHours);
    const views = video.views;
    const likeRate = views && video.likes !== void 0 ? video.likes / views : void 0;
    const commentRate = views && video.comments !== void 0 ? video.comments / views : void 0;
    const engagementRate = views && (video.likes !== void 0 || video.comments !== void 0) ? ((video.likes ?? 0) + (video.comments ?? 0)) / views : void 0;
    const m = { ageHours, vph, likeRate, commentRate, engagementRate, seo: seoScore(video, lang2) };
    if (channelViews && channelViews.length >= 3) {
      m.channelMedianViews = median(channelViews);
      m.channelSampleSize = channelViews.length;
      m.outlier = computeOutlier(views, channelViews);
    }
    return m;
  }
  function vphTier(vph) {
    if (vph >= 1e3) return "hot";
    if (vph >= 100) return "high";
    if (vph >= 10) return "mid";
    return "low";
  }
  function outlierTier(x) {
    if (x >= 5) return "hot";
    if (x >= 2) return "high";
    if (x >= 0.8) return "mid";
    return "low";
  }

  // src/background/ytparse.ts
  function deepFind(obj, key, maxDepth = 40, limit = 500) {
    const out = [];
    const stack = [[obj, 0]];
    while (stack.length && out.length < limit) {
      const [cur, d] = stack.pop();
      if (!cur || typeof cur !== "object" || d > maxDepth) continue;
      if (Array.isArray(cur)) {
        for (let i = cur.length - 1; i >= 0; i--) stack.push([cur[i], d + 1]);
        continue;
      }
      const rec = cur;
      if (key in rec) out.push(rec[key]);
      const keys = Object.keys(rec);
      for (let i = keys.length - 1; i >= 0; i--) stack.push([rec[keys[i]], d + 1]);
    }
    return out;
  }
  function deepFindFirst(obj, key) {
    return deepFind(obj, key, 40, 1)[0];
  }
  function collectStrings(obj, limit = 2e3) {
    const out = [];
    const stack = [obj];
    while (stack.length && out.length < limit) {
      const cur = stack.pop();
      if (typeof cur === "string") {
        out.push(cur);
        continue;
      }
      if (!cur || typeof cur !== "object") continue;
      if (Array.isArray(cur)) for (const v of cur) stack.push(v);
      else for (const v of Object.values(cur)) stack.push(v);
    }
    return out;
  }
  function runsText(x) {
    if (!x) return void 0;
    if (typeof x === "string") return x;
    if (typeof x.simpleText === "string") return x.simpleText;
    if (Array.isArray(x.runs)) return x.runs.map((r) => r.text ?? "").join("");
    if (typeof x.content === "string") return x.content;
    return void 0;
  }
  function videoFromPlayerResponse(pr, pageUrl) {
    const d = pr?.videoDetails;
    if (!d?.videoId) return void 0;
    const mf = pr?.microformat?.playerMicroformatRenderer;
    const thumbs = d.thumbnail?.thumbnails;
    const tracks = pr?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    const description = d.shortDescription ?? mf?.description?.simpleText;
    const video = {
      videoId: d.videoId,
      url: pageUrl ?? `https://www.youtube.com/watch?v=${d.videoId}`,
      title: d.title ?? "",
      channelId: d.channelId,
      channelName: d.author,
      views: d.viewCount !== void 0 ? Number(d.viewCount) : void 0,
      durationSec: d.lengthSeconds !== void 0 ? Number(d.lengthSeconds) : void 0,
      tags: Array.isArray(d.keywords) ? d.keywords : [],
      description,
      isLive: !!d.isLiveContent,
      publishedAt: mf?.publishDate ?? mf?.uploadDate,
      category: mf?.category,
      thumbnailUrl: Array.isArray(thumbs) && thumbs.length ? thumbs[thumbs.length - 1].url : void 0,
      hasChapters: hasChapters(description)
    };
    if (Array.isArray(tracks)) {
      video.captionTracks = tracks.filter((t2) => t2?.baseUrl).map((t2) => ({
        lang: t2.languageCode ?? "",
        name: runsText(t2.name) ?? t2.languageCode ?? "",
        url: t2.baseUrl,
        auto: t2.kind === "asr"
      }));
    }
    if (mf?.ownerProfileUrl) {
      const m = String(mf.ownerProfileUrl).match(/\/(@[^/?]+)/);
      if (m) video.channelHandle = m[1];
    }
    return video;
  }
  function listVideoFromVideoRenderer(r) {
    if (!r?.videoId) return void 0;
    const owner = r.ownerText?.runs?.[0] ?? r.longBylineText?.runs?.[0] ?? r.shortBylineText?.runs?.[0];
    const browse = owner?.navigationEndpoint?.browseEndpoint;
    const viewText = runsText(r.viewCountText) ?? runsText(r.shortViewCountText);
    const publishedText = runsText(r.publishedTimeText);
    const isLive = !!r.badges?.some((b) => /LIVE/.test(b?.metadataBadgeRenderer?.style ?? "")) || !!viewText && /watching|смотр|дивля/i.test(viewText);
    const v = {
      videoId: r.videoId,
      title: runsText(r.title) ?? "",
      channelName: owner?.text,
      channelId: browse?.browseId,
      channelHandle: browse?.canonicalBaseUrl ? String(browse.canonicalBaseUrl).replace(/^\//, "") : void 0,
      views: isLive ? void 0 : parseCompactNumber(viewText),
      publishedText,
      ageHours: parseRelativeTimeHours(publishedText),
      durationSec: parseDuration(runsText(r.lengthText)),
      isLive,
      verified: !!r.ownerBadges?.some((b) => /VERIFIED/.test(b?.metadataBadgeRenderer?.style ?? "")),
      description: r.detailedMetadataSnippets?.[0]?.snippetText ? runsText(r.detailedMetadataSnippets[0].snippetText) : void 0
    };
    if (v.views !== void 0 && v.ageHours !== void 0) v.vph = v.views / Math.max(v.ageHours, 1);
    return v;
  }
  function listVideoFromLockup(l) {
    if (!l?.contentId) return void 0;
    if (l.contentType && !/VIDEO|SHORTS/.test(l.contentType)) return void 0;
    const meta = l.metadata?.lockupMetadataViewModel;
    const title = runsText(meta?.title) ?? "";
    const rows = meta?.metadata?.contentMetadataViewModel?.metadataRows ?? [];
    const parts = rows.flatMap((row) => row?.metadataParts ?? []);
    const texts = parts.map((p) => p?.accessibilityLabel || runsText(p?.text) || "").filter(Boolean);
    const browseIds = deepFind(meta, "browseEndpoint", 24, 3);
    const viewText = texts.find((t2) => /view|просмотр|перегляд/i.test(t2));
    const ageText = texts.find((t2) => /ago|назад|тому/i.test(t2));
    const channelName = texts.find((t2) => t2 !== viewText && t2 !== ageText && !/view|просмотр|перегляд|ago|назад|тому/i.test(t2));
    const badges = deepFind(l.contentImage, "thumbnailBadgeViewModel", 12, 10);
    const lengthText = badges.map((b) => runsText(b?.text)).find((t2) => t2 && /^\d+:\d\d/.test(t2));
    const isLive = !!viewText && /watching|смотр|дивля/i.test(viewText);
    const v = {
      videoId: l.contentId,
      title,
      channelName,
      channelId: browseIds[0]?.browseId,
      channelHandle: browseIds[0]?.canonicalBaseUrl ? String(browseIds[0].canonicalBaseUrl).replace(/^\//, "") : void 0,
      views: isLive ? void 0 : parseCompactNumber(viewText),
      publishedText: ageText,
      ageHours: parseRelativeTimeHours(ageText),
      durationSec: parseDuration(lengthText),
      isLive,
      isShort: /SHORTS/.test(l.contentType ?? "")
    };
    if (v.views !== void 0 && v.ageHours !== void 0) v.vph = v.views / Math.max(v.ageHours, 1);
    return v;
  }
  function listVideoFromCompact(r) {
    if (!r?.videoId) return void 0;
    const owner = r.longBylineText?.runs?.[0] ?? r.shortBylineText?.runs?.[0];
    const browse = owner?.navigationEndpoint?.browseEndpoint;
    const viewText = runsText(r.viewCountText);
    const publishedText = runsText(r.publishedTimeText);
    const isLive = !!viewText && /watching|смотр|дивля/i.test(viewText);
    const v = {
      videoId: r.videoId,
      title: runsText(r.title) ?? "",
      channelName: owner?.text,
      channelId: browse?.browseId,
      channelHandle: browse?.canonicalBaseUrl ? String(browse.canonicalBaseUrl).replace(/^\//, "") : void 0,
      views: isLive ? void 0 : parseCompactNumber(viewText),
      publishedText,
      ageHours: parseRelativeTimeHours(publishedText),
      durationSec: parseDuration(runsText(r.lengthText)),
      isLive
    };
    if (v.views !== void 0 && v.ageHours !== void 0) v.vph = v.views / Math.max(v.ageHours, 1);
    return v;
  }
  function listVideosFromData(data) {
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    const push = (v) => {
      if (v && !seen.has(v.videoId)) {
        seen.add(v.videoId);
        out.push(v);
      }
    };
    for (const r of deepFind(data, "videoRenderer")) push(listVideoFromVideoRenderer(r));
    for (const r of deepFind(data, "gridVideoRenderer")) push(listVideoFromVideoRenderer(r));
    for (const r of deepFind(data, "compactVideoRenderer")) push(listVideoFromCompact(r));
    for (const r of deepFind(data, "lockupViewModel")) push(listVideoFromLockup(r));
    return out;
  }
  var LIKE_WORD = /like|нравится|лайк|подоба|вподоба/i;
  function parseLikesFromStrings(strings) {
    for (const s of strings) {
      if (s.length > 160 || !LIKE_WORD.test(s)) continue;
      const m = s.match(/(\d[\d,.\s ]*)/);
      if (!m) continue;
      const n = parseCompactNumber(m[1]);
      if (n !== void 0 && n > 0) return n;
    }
    return void 0;
  }
  function watchExtrasFromData(data) {
    const results = data?.contents?.twoColumnWatchNextResults?.results?.results ?? data;
    const primary = deepFindFirst(results, "videoPrimaryInfoRenderer");
    const secondary = deepFindFirst(results, "videoSecondaryInfoRenderer");
    const extras = { related: [] };
    if (primary) extras.likes = parseLikesFromStrings(collectStrings(primary, 600));
    const commentCount = deepFindFirst(data, "commentCount");
    if (commentCount) extras.comments = parseCompactNumber(runsText(commentCount));
    const subText = deepFindFirst(secondary ?? data, "subscriberCountText");
    if (subText) extras.subscribers = parseCompactNumber(runsText(subText));
    const owner = deepFindFirst(secondary ?? data, "videoOwnerRenderer");
    const base = owner?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl;
    if (base) extras.channelHandle = String(base).replace(/^\//, "");
    const sec = data?.contents?.twoColumnWatchNextResults?.secondaryResults;
    if (sec) extras.related = listVideosFromData(sec).slice(0, 30);
    return extras;
  }

  // src/content/bridge.ts
  var pending = /* @__PURE__ */ new Map();
  var seq = 0;
  window.addEventListener("message", (e) => {
    if (e.source !== window || !e.data || e.data.source !== "nubit-main") return;
    const cb = pending.get(e.data.id);
    if (cb) {
      pending.delete(e.data.id);
      cb(e.data.payload);
    }
  });
  function askMain(type, timeoutMs = 1500) {
    return new Promise((resolve) => {
      const id = `n${++seq}_${Date.now()}`;
      const timer = setTimeout(() => {
        pending.delete(id);
        resolve(null);
      }, timeoutMs);
      pending.set(id, (payload) => {
        clearTimeout(timer);
        resolve(payload);
      });
      window.postMessage({ source: "nubit-iso", id, type }, "*");
    });
  }

  // src/content/extract.ts
  function pageKind(url = location.href) {
    const u = new URL(url);
    if (u.hostname.startsWith("studio.")) return "studio";
    const p = u.pathname;
    if (p === "/watch") return "watch";
    if (p === "/results") return "search";
    if (p === "/" || p === "/feed/subscriptions" || p === "/feed/trending") return "home";
    if (p.startsWith("/shorts/")) return "shorts";
    if (/^\/(@[^/]+|channel\/[^/]+|c\/[^/]+|user\/[^/]+)/.test(p)) return "channel";
    return "other";
  }
  function currentVideoId(url = location.href) {
    const u = new URL(url);
    if (u.pathname === "/watch") return u.searchParams.get("v") ?? void 0;
    const m = u.pathname.match(/^\/shorts\/([\w-]{11})/);
    return m?.[1];
  }
  function searchQuery(url = location.href) {
    return new URL(url).searchParams.get("search_query") ?? void 0;
  }
  function text(el) {
    return (el?.textContent ?? "").replace(/\s+/g, " ").trim();
  }
  function channelFromHref(href) {
    if (!href) return {};
    const m1 = href.match(/\/channel\/(UC[\w-]{20,})/);
    if (m1) return { channelId: m1[1] };
    const m2 = href.match(/\/(@[^/?#]+)/);
    if (m2) return { channelHandle: m2[1] };
    return {};
  }
  function domWatchExtras() {
    const out = {};
    const likeBtn = document.querySelector("like-button-view-model button[aria-label], #segmented-like-button button[aria-label], ytd-toggle-button-renderer#like-button button[aria-label]");
    const label = likeBtn?.getAttribute("aria-label");
    if (label) out.likes = parseLikesFromStrings([label]);
    if (out.likes === void 0) {
      const short = text(document.querySelector("like-button-view-model .yt-spec-button-shape-next__button-text-content, #segmented-like-button .yt-spec-button-shape-next__button-text-content"));
      if (short && /\d/.test(short)) out.likes = parseCompactNumber(short);
    }
    const subs = text(document.querySelector("ytd-watch-metadata #owner-sub-count, #owner #owner-sub-count"));
    if (subs) out.subscribers = parseCompactNumber(subs);
    const ownerLink = document.querySelector("ytd-watch-metadata #owner ytd-channel-name a, #owner ytd-channel-name a, ytd-video-owner-renderer ytd-channel-name a");
    if (ownerLink) {
      out.channelName = text(ownerLink) || void 0;
      Object.assign(out, channelFromHref(ownerLink.getAttribute("href")));
    }
    const cc = text(document.querySelector("ytd-comments-header-renderer #count, ytd-comments-header-renderer h2"));
    if (cc && /\d/.test(cc)) out.comments = parseCompactNumber(cc);
    return out;
  }
  function domVisibleComments(max = 20) {
    const out = [];
    for (const el of document.querySelectorAll("ytd-comment-thread-renderer")) {
      const author = text(el.querySelector("#author-text"));
      const body = text(el.querySelector("#content-text"));
      if (!body) continue;
      const likes = parseCompactNumber(text(el.querySelector("#vote-count-middle")));
      const when = text(el.querySelector("#published-time-text, .published-time-text"));
      out.push({ author, text: body.slice(0, 500), likes, publishedText: when || void 0 });
      if (out.length >= max) break;
    }
    return out;
  }
  var LIST_SELECTOR = "ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-playlist-video-renderer, yt-lockup-view-model";
  function domListVideos(root = document, max = 200) {
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const el of root.querySelectorAll(LIST_SELECTOR)) {
      if (out.length >= max) break;
      if (el.tagName === "YT-LOCKUP-VIEW-MODEL" && el.closest("ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer")) continue;
      const v = domListVideo(el);
      if (!v || seen.has(v.videoId)) continue;
      seen.add(v.videoId);
      out.push({ el, video: v });
    }
    return out;
  }
  function domListVideo(el) {
    const link = el.querySelector('a#thumbnail[href*="/watch?v="], a[href*="/watch?v="], a[href*="/shorts/"]') ?? null;
    const href = link?.getAttribute("href") ?? "";
    const id = href.match(/[?&]v=([\w-]{11})/)?.[1] ?? href.match(/\/shorts\/([\w-]{11})/)?.[1];
    if (!id) return void 0;
    const isShort = /\/shorts\//.test(href);
    const titleEl = el.querySelector("#video-title, a.yt-lockup-metadata-view-model-wiz__title, h3 a, .yt-lockup-metadata-view-model__title, h3");
    const title = (titleEl?.getAttribute("title") || titleEl?.getAttribute("aria-label") || text(titleEl) || "").trim();
    const chanLink = el.querySelector(
      'ytd-channel-name a, #channel-name a, .yt-content-metadata-view-model-wiz__metadata-text a, .yt-content-metadata-view-model__metadata-text a, a[href^="/@"], a[href*="/channel/"]'
    );
    let channelName = text(el.querySelector("ytd-channel-name #text, #channel-name #text, ytd-channel-name a")) || (chanLink ? text(chanLink) : "");
    const spans = Array.from(
      el.querySelectorAll(
        "#metadata-line span, span.inline-metadata-item, yt-content-metadata-view-model span, .yt-content-metadata-view-model-wiz__metadata-text, .yt-content-metadata-view-model__metadata-text, #metadata span"
      )
    ).map((s) => text(s)).filter((s) => s && s !== "\u2022");
    const viewsText = spans.find(isViewsText);
    const ageText = spans.find(isAgeText);
    if (!channelName) {
      channelName = spans.find((s) => s !== viewsText && s !== ageText && !/view|просмотр|перегляд|ago|назад|тому|watching/i.test(s) && !/^\d/.test(s)) ?? "";
    }
    const durText = Array.from(el.querySelectorAll("ytd-thumbnail-overlay-time-status-renderer span, .yt-badge-shape__text, badge-shape .yt-badge-shape__text, .ytd-thumbnail-overlay-time-status-renderer")).map((s) => text(s)).find((s) => /^\d+:\d\d/.test(s));
    const live = !!el.querySelector('[overlay-style="LIVE"], .badge-style-type-live-now, ytd-badge-supported-renderer .badge-style-type-live-now') || /watching|смотр|дивля/i.test(viewsText ?? "");
    const v = {
      videoId: id,
      title,
      channelName: channelName || void 0,
      ...channelFromHref(chanLink?.getAttribute("href")),
      views: live ? void 0 : parseCompactNumber(viewsText),
      publishedText: ageText,
      ageHours: parseRelativeTimeHours(ageText),
      durationSec: parseDuration(durText),
      isLive: live,
      isShort
    };
    if (v.views !== void 0 && v.ageHours !== void 0) v.vph = v.views / Math.max(v.ageHours, 1);
    return v;
  }
  function domChannelHeader() {
    const ch = { url: location.href.split("?")[0] };
    const root = document.querySelector("#page-header, ytd-c4-tabbed-header-renderer, #channel-header, yt-page-header-renderer");
    const name = text(root?.querySelector("h1, #channel-name, yt-dynamic-text-view-model h1, .page-header-view-model-wiz__page-header-title"));
    if (name) ch.name = name;
    const m = location.pathname.match(/^\/(@[^/]+)/);
    if (m) ch.handle = m[1];
    const idm = location.pathname.match(/^\/channel\/(UC[\w-]{20,})/);
    if (idm) ch.channelId = idm[1];
    const metaLink = document.querySelector('link[rel="canonical"]');
    const canon = metaLink?.getAttribute("href");
    if (!ch.channelId && canon) Object.assign(ch, channelFromHref(canon));
    const strings = Array.from(root?.querySelectorAll("span, yt-formatted-string") ?? []).map((s) => text(s));
    for (const s of strings) {
      if (ch.subscribers === void 0 && /subscriber|подписчик|підписник/i.test(s) && /\d/.test(s)) ch.subscribers = parseCompactNumber(s);
      else if (ch.videoCount === void 0 && /\bvideos?\b|видео|відео/i.test(s) && /^\s*[\d.,\s]+\s*(k|m|тыс|млн)?\.?\s*\S+$/i.test(s)) ch.videoCount = parseCompactNumber(s);
      else if (!ch.handle && /^@[\w.-]+$/.test(s)) ch.handle = s;
    }
    const desc = text(document.querySelector("#page-header yt-description-preview-view-model, #channel-header #description, yt-description-preview-view-model"));
    if (desc) ch.description = desc.slice(0, 500);
    return ch;
  }

  // src/shared/markdown.ts
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // src/content/overlay.css
  var overlay_default = ':host {\n  all: initial;\n  display: block;\n  font-family: "Roboto", "YouTube Sans", Arial, sans-serif;\n  color: var(--nb-fg, #0f0f0f);\n  --nb-bg: #fff;\n  --nb-bg2: #f2f2f2;\n  --nb-fg: #0f0f0f;\n  --nb-fg2: #606060;\n  --nb-line: #e5e5e5;\n  --nb-accent: #4f46e5;\n  --nb-accent2: #8b5cf6;\n  --nb-good: #16a34a;\n  --nb-warn: #d97706;\n  --nb-bad: #dc2626;\n}\n:host([data-theme="dark"]) {\n  --nb-bg: #212121;\n  --nb-bg2: #2d2d2d;\n  --nb-fg: #f1f1f1;\n  --nb-fg2: #aaa;\n  --nb-line: #3a3a3a;\n}\n* { box-sizing: border-box; }\n.card {\n  background: var(--nb-bg);\n  border: 1px solid var(--nb-line);\n  border-radius: 12px;\n  padding: 12px 14px 12px;\n  margin: 0 0 12px;\n  color: var(--nb-fg);\n  font-size: 13px;\n  line-height: 1.35;\n}\n.head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }\n.logo { width: 22px; height: 22px; border-radius: 6px; background: linear-gradient(135deg, var(--nb-accent), var(--nb-accent2)); display: inline-flex; align-items: center; justify-content: center; }\n.logo::after { content: ""; border-left: 8px solid #fff; border-top: 5px solid transparent; border-bottom: 5px solid transparent; margin-left: 2px; }\n.title { font-weight: 600; font-size: 14px; flex: 1; }\n.pill { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: var(--nb-bg2); color: var(--nb-fg2); }\n.pill.good { background: rgba(22,163,74,.15); color: var(--nb-good); }\n.pill.warn { background: rgba(217,119,6,.15); color: var(--nb-warn); }\n.pill.bad { background: rgba(220,38,38,.15); color: var(--nb-bad); }\n.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }\n.tile { background: var(--nb-bg2); border-radius: 8px; padding: 7px 8px; min-width: 0; }\n.tile .v { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.tile .k { color: var(--nb-fg2); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.tile .s { color: var(--nb-fg2); font-size: 11px; }\n.tile.hot .v { color: #ea580c; }\n.tile.high .v { color: var(--nb-good); }\n.tile.low .v { color: var(--nb-fg2); }\n.row { display: flex; align-items: center; gap: 8px; margin-top: 10px; }\n.bar { flex: 1; height: 6px; background: var(--nb-bg2); border-radius: 3px; overflow: hidden; }\n.bar > i { display: block; height: 100%; background: linear-gradient(90deg, var(--nb-accent), var(--nb-accent2)); }\n.lbl { color: var(--nb-fg2); font-size: 12px; }\n.link { color: var(--nb-accent); cursor: pointer; font-size: 12px; background: none; border: 0; padding: 0; font-family: inherit; }\n.checks { margin: 6px 0 0; padding: 0; list-style: none; font-size: 12px; }\n.checks li { display: flex; gap: 6px; padding: 2px 0; color: var(--nb-fg2); }\n.checks li.ok { color: var(--nb-fg); }\n.checks li .ic { width: 14px; flex: none; }\n.checks li.ok .ic { color: var(--nb-good); }\n.checks li.no .ic { color: var(--nb-bad); }\n.checks li .hint { display: block; color: var(--nb-fg2); font-size: 11px; }\n.tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }\n.tag { background: var(--nb-bg2); border-radius: 999px; padding: 2px 8px; font-size: 11px; cursor: pointer; border: 0; color: var(--nb-fg); font-family: inherit; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.tag:hover { background: var(--nb-line); }\n.actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }\n.btn { border: 1px solid var(--nb-line); background: var(--nb-bg); color: var(--nb-fg); border-radius: 999px; padding: 6px 12px; font-size: 12px; cursor: pointer; font-family: inherit; }\n.btn:hover { background: var(--nb-bg2); }\n.btn.primary { background: var(--nb-accent); border-color: var(--nb-accent); color: #fff; }\n.btn.primary:hover { filter: brightness(1.1); }\n.muted { color: var(--nb-fg2); font-size: 12px; margin-top: 8px; }\n.small { font-size: 11px; color: var(--nb-fg2); }\n.hidden { display: none; }\n';

  // src/content/overlay.ts
  var HOST_ID = "nubit-overlay-host";
  function isDark() {
    return document.documentElement.hasAttribute("dark") || document.documentElement.getAttribute("data-theme") === "dark";
  }
  function createOverlay(onAction) {
    document.getElementById(HOST_ID)?.remove();
    const host = document.createElement("div");
    host.id = HOST_ID;
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = overlay_default;
    shadow.appendChild(style);
    const root = document.createElement("div");
    shadow.appendChild(root);
    let state = {};
    let showChecks = false;
    const render = () => {
      host.setAttribute("data-theme", isDark() ? "dark" : "light");
      root.innerHTML = html(state, showChecks);
    };
    root.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action],[data-tag],[data-toggle]");
      if (!target) return;
      if (target.dataset.action) {
        onAction(target.dataset.action);
      } else if (target.dataset.tag !== void 0) {
        const tag = target.dataset.tag === "*" ? (state.video?.tags ?? []).join(", ") : target.dataset.tag;
        navigator.clipboard.writeText(tag).then(() => {
          const prev = target.textContent;
          target.textContent = t("copied");
          setTimeout(() => target.textContent = prev, 900);
        });
      } else if (target.dataset.toggle === "checks") {
        showChecks = !showChecks;
        render();
      }
    });
    render();
    return {
      host,
      update(next) {
        state = next;
        render();
      },
      remove() {
        host.remove();
      }
    };
  }
  function tile(key, value, sub, tier, title) {
    return `<div class="tile ${tier ?? ""}" ${title ? `title="${escapeHtml(title)}"` : ""}><div class="v">${value}</div><div class="k">${key}${sub ? ` <span class="s">${sub}</span>` : ""}</div></div>`;
  }
  function html(s, showChecks) {
    const v = s.video;
    const m = s.metrics;
    if (!v) return `<div class="card"><div class="head"><span class="logo"></span><span class="title">${t("app_name")}</span><span class="pill">${t("loading")}</span></div></div>`;
    const seo = m?.seo;
    const seoClass = seo ? seo.score >= 75 ? "good" : seo.score >= 50 ? "warn" : "bad" : "";
    const tiles = [];
    tiles.push(tile(t("vph"), formatCompact(m?.vph), void 0, m?.vph !== void 0 ? vphTier(m.vph) : void 0, t("vph_full")));
    tiles.push(tile(t("vph_recent"), s.vphRecent !== void 0 ? formatCompact(s.vphRecent) + "/" + t("t_hour") : "\u2014", void 0, s.vphRecent !== void 0 ? vphTier(s.vphRecent) : "low", t("vph_recent_full")));
    tiles.push(tile(t("views"), formatCompact(v.views)));
    tiles.push(tile(t("age"), formatAge(m?.ageHours), v.durationSec ? formatDuration(v.durationSec) : void 0));
    tiles.push(tile(t("likes"), formatCompact(v.likes), m?.likeRate !== void 0 ? formatPercent(m.likeRate) : void 0));
    tiles.push(tile(t("comments"), formatCompact(v.comments), m?.commentRate !== void 0 ? formatPercent(m.commentRate, 2) : void 0));
    let outlierVal = "\u2014";
    let outlierTierCls;
    if (m?.outlier !== void 0) {
      outlierVal = (m.outlier >= 10 ? m.outlier.toFixed(0) : m.outlier.toFixed(1)) + "\xD7";
      outlierTierCls = outlierTier(m.outlier);
    } else if (s.outlierPending) outlierVal = "\u2026";
    tiles.push(
      tile(
        t("outlier"),
        outlierVal,
        m?.channelSampleSize ? `n=${m.channelSampleSize}` : void 0,
        outlierTierCls,
        s.outlierError ?? (m?.channelMedianViews ? `${t("outlier_full")} (${formatCompact(m.channelMedianViews)})` : t("outlier_full"))
      )
    );
    tiles.push(tile(t("subscribers"), formatCompact(v.subscribers), m?.engagementRate !== void 0 ? `${t("engagement").slice(0, 4)}. ${formatPercent(m.engagementRate)}` : void 0, void 0, t("engagement_full")));
    const checks = seo ? `<ul class="checks ${showChecks ? "" : "hidden"}">${seo.checks.map(
      (c) => `<li class="${c.ok ? "ok" : "no"}"><span class="ic">${c.ok ? "\u2713" : "\u2717"}</span><span>${escapeHtml(c.label)}${c.ok ? "" : `<span class="hint">${escapeHtml(c.hint)}</span>`}</span></li>`
    ).join("")}</ul>` : "";
    const tags = v.tags ?? [];
    const tagsHtml = tags.length ? `<div class="tags">${tags.slice(0, 40).map((tag) => `<button class="tag" data-tag="${escapeHtml(tag)}" title="${t("copy")}">${escapeHtml(tag)}</button>`).join("")}${tags.length > 40 ? `<span class="small">+${tags.length - 40}</span>` : ""}</div>
       <div class="row"><span class="small">${t("tags")}: ${tags.length}</span><button class="link" data-tag="*">${t("copy_all_tags")}</button></div>` : `<div class="muted">${t("no_tags")}</div>`;
    const caps = v.captionTracks?.length ? `<div class="small">${t("captions")}: ${escapeHtml(
      v.captionTracks.slice(0, 6).map((c) => `${c.lang}${c.auto ? ` (${t("auto")})` : ""}`).join(", ")
    )}${v.captionTracks.length > 6 ? ` +${v.captionTracks.length - 6}` : ""}</div>` : "";
    return `<div class="card">
    <div class="head"><span class="logo"></span><span class="title">${t("app_name")}</span>${seo ? `<span class="pill ${seoClass}" title="${t("seo_score")}">SEO ${seo.score}</span>` : ""}</div>
    <div class="grid">${tiles.join("")}</div>
    ${seo ? `<div class="row"><span class="lbl">${t("seo_score")}</span><div class="bar"><i style="width:${seo.score}%"></i></div><button class="link" data-toggle="checks">${showChecks ? t("hide_checks") : t("show_checks")}</button></div>${checks}` : ""}
    ${tagsHtml}
    ${caps}
    <div class="actions">
      <button class="btn primary" data-action="analyze_video">${t("ai_analyze")}</button>
      <button class="btn" data-action="why_performing">${t("act_why_performing")}</button>
      <button class="btn" data-action="titles">${t("act_titles")}</button>
      <button class="btn" data-action="tags_description">${t("act_tags_description")}</button>
      <button class="btn" data-action="chat">${t("open_chat")}</button>
    </div>
  </div>`;
  }

  // src/content/badges.css
  var badges_default = ".nubit-badges {\n  position: absolute;\n  top: 4px;\n  left: 4px;\n  z-index: 5;\n  display: flex;\n  gap: 4px;\n  pointer-events: none;\n  font-family: Roboto, Arial, sans-serif;\n}\n.nubit-badge {\n  pointer-events: auto;\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  padding: 2px 6px;\n  border-radius: 6px;\n  font-size: 11px;\n  font-weight: 600;\n  line-height: 1.2;\n  color: #fff;\n  background: rgba(0, 0, 0, 0.75);\n  backdrop-filter: blur(2px);\n  white-space: nowrap;\n  cursor: default;\n}\n.nubit-badge.tier-low { color: #d4d4d8; }\n.nubit-badge.tier-mid { color: #93c5fd; }\n.nubit-badge.tier-high { color: #86efac; }\n.nubit-badge.tier-hot { color: #fdba74; }\n.nubit-badge.outlier.tier-hot { background: rgba(234, 88, 12, 0.9); color: #fff; }\n.nubit-badge.outlier.tier-high { background: rgba(22, 163, 74, 0.9); color: #fff; }\n";

  // src/content/badges.ts
  var PROCESSED = "data-nubit";
  var channelMedians = /* @__PURE__ */ new Map();
  var outlierBudget = 0;
  function startBadges(opts) {
    const style = document.createElement("style");
    style.id = "nubit-badge-style";
    style.textContent = badges_default;
    document.documentElement.appendChild(style);
    let timer;
    const schedule = () => {
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = void 0;
        scan(opts);
      }, 400);
    };
    const mo = new MutationObserver(schedule);
    mo.observe(document.documentElement, { childList: true, subtree: true });
    schedule();
    return {
      rescan: () => {
        outlierBudget = 40;
        schedule();
      }
    };
  }
  function scan(opts) {
    if (!opts.enabled()) return;
    const kind = pageKind();
    const els = document.querySelectorAll(`${LIST_SELECTOR}:not([${PROCESSED}])`);
    let n = 0;
    for (const el of els) {
      if (n++ > 150) break;
      if (el.tagName === "YT-LOCKUP-VIEW-MODEL" && el.closest("ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer")) {
        el.setAttribute(PROCESSED, "skip");
        continue;
      }
      const v = domListVideo(el);
      if (!v) continue;
      el.setAttribute(PROCESSED, v.videoId);
      decorate(el, v, opts.outliers() && (kind === "search" || kind === "watch" || kind === "channel"));
    }
  }
  function thumbContainer(el) {
    const c = el.querySelector("ytd-thumbnail, yt-thumbnail-view-model, a#thumbnail, .yt-lockup-view-model-wiz__content-image, .yt-lockup-view-model__content-image");
    return c;
  }
  function decorate(el, v, withOutlier) {
    if (v.isLive || v.vph === void 0) return;
    const container = thumbContainer(el);
    if (!container) return;
    if (getComputedStyle(container).position === "static") container.style.position = "relative";
    container.querySelector(".nubit-badges")?.remove();
    const wrap = document.createElement("div");
    wrap.className = "nubit-badges";
    const vph = document.createElement("span");
    vph.className = `nubit-badge vph tier-${vphTier(v.vph)}`;
    vph.textContent = `${formatCompact(v.vph)}/${t("t_hour")}`;
    vph.title = `${t("vph_full")}: ${Math.round(v.vph)}`;
    wrap.appendChild(vph);
    container.appendChild(wrap);
    if (withOutlier && v.views !== void 0 && (v.channelId || v.channelHandle) && outlierBudget > 0) {
      outlierBudget--;
      const key = v.channelId ?? v.channelHandle;
      channelMedian(key).then((median2) => {
        if (!median2 || !wrap.isConnected) return;
        const x = v.views / median2;
        const o = document.createElement("span");
        o.className = `nubit-badge outlier tier-${outlierTier(x)}`;
        o.textContent = (x >= 10 ? x.toFixed(0) : x.toFixed(1)) + "\xD7";
        o.title = `${t("outlier_full")} (${formatCompact(median2)})`;
        wrap.appendChild(o);
      });
    }
  }
  function channelMedian(key) {
    let p = channelMedians.get(key);
    if (!p) {
      p = (async () => {
        try {
          const res = await chrome.runtime.sendMessage({ type: "getChannelStats", channel: key });
          if (!res || "error" in res) return void 0;
          return res.medianViews;
        } catch {
          return void 0;
        }
      })();
      channelMedians.set(key, p);
    }
    return p;
  }

  // src/content/index.ts
  var settings;
  var overlay = null;
  var overlayState = {};
  var currentUrl = "";
  var navToken = 0;
  var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function init() {
    settings = await loadSettings();
    setLang(settings.language);
    onSettingsChanged((s) => {
      settings = s;
      setLang(s.language);
      if (!s.showOverlay) {
        overlay?.remove();
        overlay = null;
      }
      handleNavigation(true);
    });
    const badges = startBadges({ enabled: () => settings.showBadges, outliers: () => settings.computeOutliers });
    const onNav = () => {
      badges.rescan();
      handleNavigation();
    };
    document.addEventListener("yt-navigate-finish", onNav);
    document.addEventListener("yt-page-data-updated", onNav);
    window.addEventListener("popstate", onNav);
    setInterval(() => {
      if (location.href !== currentUrl) onNav();
    }, 1e3);
    onNav();
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg.type === "getPageContext") {
        buildPageContext().then(sendResponse, () => sendResponse(null));
        return true;
      }
      return void 0;
    });
  }
  function openPanel(action) {
    chrome.runtime.sendMessage({ type: "openSidePanel", action }).catch(() => void 0);
  }
  async function handleNavigation(force = false) {
    if (!force && location.href === currentUrl) return;
    currentUrl = location.href;
    const token = ++navToken;
    const kind = pageKind();
    if (kind !== "watch") {
      overlay?.remove();
      overlay = null;
      overlayState = {};
      return;
    }
    if (!settings.showOverlay) return;
    await watchFlow(token);
  }
  async function watchFlow(token) {
    const videoId = currentVideoId();
    if (!videoId) return;
    overlayState = {};
    if (!overlay) overlay = createOverlay((a) => a === "chat" ? openPanel() : openPanel(a));
    overlay.update(overlayState);
    mountOverlay(token);
    let video;
    let data = null;
    for (let i = 0; i < 20 && token === navToken; i++) {
      const res = await askMain("watch");
      const v = res?.playerResponse ? videoFromPlayerResponse(res.playerResponse, location.href) : void 0;
      if (v && v.videoId === videoId) {
        video = v;
        data = res?.data;
        break;
      }
      await sleep(500);
    }
    if (token !== navToken) return;
    if (!video) {
      return;
    }
    const dataVideoId = data?.currentVideoEndpoint?.watchEndpoint?.videoId;
    if (data && (!dataVideoId || dataVideoId === videoId)) {
      const ex = watchExtrasFromData(data);
      if (ex.likes !== void 0) video.likes = ex.likes;
      if (ex.comments !== void 0) video.comments = ex.comments;
      if (ex.subscribers !== void 0) video.subscribers = ex.subscribers;
      if (ex.channelHandle) video.channelHandle = ex.channelHandle;
    }
    const applyDom = () => {
      const d = domWatchExtras();
      if (d.likes !== void 0) video.likes = d.likes;
      if (d.subscribers !== void 0) video.subscribers = d.subscribers;
      if (d.comments !== void 0) video.comments = d.comments;
      if (d.channelHandle) video.channelHandle = d.channelHandle;
      if (d.channelId && !video.channelId) video.channelId = d.channelId;
    };
    applyDom();
    const refresh = () => {
      overlayState.video = video;
      overlayState.metrics = computeMetrics(video, settings.language, channelViews);
      overlay?.update(overlayState);
    };
    let channelViews;
    refresh();
    if (video.views !== void 0) {
      chrome.runtime.sendMessage({ type: "getRecentVph", videoId, views: video.views }).then((r) => {
        if (token !== navToken || !r || r.vph === void 0) return;
        overlayState.vphRecent = r.vph;
        overlay?.update(overlayState);
      }).catch(() => void 0);
    }
    if (settings.computeOutliers && (video.channelId || video.channelHandle)) {
      overlayState.outlierPending = true;
      refresh();
      chrome.runtime.sendMessage({ type: "getChannelStats", channel: video.channelId ?? video.channelHandle }).then((res) => {
        if (token !== navToken) return;
        overlayState.outlierPending = false;
        if (!res || "error" in res) {
          overlayState.outlierError = res && "error" in res ? res.error : void 0;
        } else {
          channelViews = res.videos.filter((x) => x.videoId !== videoId).map((x) => x.views).filter((x) => x !== void 0);
          if (video.subscribers === void 0) video.subscribers = res.channel.subscribers;
        }
        refresh();
      }).catch(() => {
        overlayState.outlierPending = false;
        refresh();
      });
    }
    for (let i = 0; i < 12 && token === navToken; i++) {
      await sleep(1500);
      const before = JSON.stringify([video.likes, video.comments, video.subscribers]);
      applyDom();
      if (JSON.stringify([video.likes, video.comments, video.subscribers]) !== before) refresh();
      mountOverlay(token);
    }
  }
  function mountOverlay(token) {
    if (!overlay || token !== navToken) return;
    const host = overlay.host;
    const secondary = document.querySelector("#secondary-inner");
    const below = document.querySelector("#below");
    const target = secondary && secondary.clientWidth > 0 ? secondary : below;
    if (!target) {
      if (!host.isConnected) setTimeout(() => mountOverlay(token), 700);
      return;
    }
    if (host.parentElement !== target || target.firstElementChild !== host) target.prepend(host);
  }
  async function buildPageContext() {
    const kind = pageKind();
    const ctx = { kind, url: location.href, title: document.title.replace(/ - YouTube$/, ""), capturedAt: (/* @__PURE__ */ new Date()).toISOString() };
    if (kind === "watch") {
      if (overlayState.video && overlayState.video.videoId === currentVideoId()) {
        ctx.video = overlayState.video;
        const m = overlayState.metrics;
        ctx.metrics = m ? { ...m, vphRecent: overlayState.vphRecent } : void 0;
      } else {
        const res = await askMain("watch");
        const v = res?.playerResponse ? videoFromPlayerResponse(res.playerResponse, location.href) : void 0;
        if (v) {
          Object.assign(v, compact(domWatchExtras()));
          ctx.video = v;
          ctx.metrics = computeMetrics(v, settings.language);
        }
      }
      ctx.related = domListVideos(document.querySelector("#secondary") ?? document, 30).map((x) => x.video);
      ctx.comments = domVisibleComments(20);
    } else if (kind === "search") {
      ctx.query = searchQuery();
      ctx.results = domListVideos(document.querySelector("ytd-search, #contents") ?? document, 40).map((x) => x.video);
    } else if (kind === "channel") {
      ctx.channel = domChannelHeader();
      ctx.channelVideos = domListVideos(document, 60).map((x) => x.video);
    } else if (kind === "home") {
      ctx.results = domListVideos(document, 30).map((x) => x.video);
    } else if (kind === "shorts") {
      const id = currentVideoId();
      if (id) ctx.video = { videoId: id, url: `https://www.youtube.com/shorts/${id}`, title: ctx.title, isShort: true };
    }
    return ctx;
  }
  function compact(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) if (v !== void 0) out[k] = v;
    return out;
  }
  init().catch((err) => console.error("[Nubit] init failed", err));
})();
