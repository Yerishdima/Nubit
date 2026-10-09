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
    atlasApiKey: "",
    atlasModel: "",
    atlasProtocol: "responses",
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
    nativeHostName: "com.nubit.host",
    tagTemplates: [],
    competitors: []
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
  async function saveSettings(settings2) {
    await chrome.storage.local.set({ [KEY]: settings2 });
  }
  function onSettingsChanged(cb) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[KEY]) {
        cb({ ...DEFAULT_SETTINGS, ...changes[KEY].newValue });
      }
    });
  }
  function activeCustomProvider(s) {
    return s.customProviders.find((p) => p.id === s.activeCustomProviderId) ?? s.customProviders[0];
  }
  function providerReady(s) {
    switch (s.provider) {
      case "anthropic":
        return !!s.anthropicApiKey;
      case "atlas":
        return !!s.atlasApiKey && !!s.atlasModel;
      case "openai":
        return !!s.openaiApiKey;
      case "gemini":
        return !!s.geminiApiKey;
      case "ollama":
        return !!s.ollamaBaseUrl;
      case "custom": {
        const p = activeCustomProvider(s);
        return !!p && !!p.baseUrl && !!p.model;
      }
    }
  }

  // src/shared/i18n.ts
  var lang = "ru";
  function setLang(l) {
    lang = l;
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

  // src/shared/markdown.ts
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // src/shared/metrics.ts
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
  function hasChapters(description) {
    if (!description) return false;
    const lines = description.split("\n").filter((l) => /^\s*\(?\d{1,2}:\d{2}(?::\d{2})?\)?\s*[-–—:]?\s*\S/.test(l));
    return lines.length >= 3 && lines.some((l) => /^\s*\(?0?0:00/.test(l));
  }
  var STOP = new Set(
    "the a an and or of to in on for with at by from is are was were be this that it \u043A\u0430\u043A \u0438 \u0432 \u043D\u0430 \u0441 \u043F\u043E \u0434\u043B\u044F \u043E\u0442 \u0434\u043E \u0438\u0437 \u043D\u0435 \u0447\u0442\u043E \u044D\u0442\u043E \u0438\u043B\u0438 \u0443 \u043E \u0430 \u043D\u043E \u0437\u0430 \u0436\u0435 \u043A \u0442\u044B \u0432\u044B \u043C\u044B \u044F".split(" ")
  );
  function words(text) {
    return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
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
  function seoScore(video, lang3 = "ru") {
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
      label: SEO_LABELS[id][lang3][0],
      hint: SEO_LABELS[id][lang3][1]
    }));
    const total = checks.reduce((s, c) => s + c.weight, 0);
    const got = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
    return { score: Math.round(got / total * 100), checks };
  }
  var TITLE_LABELS = {
    length: {
      ru: ["\u0414\u043B\u0438\u043D\u0430 30\u201370 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432", "\u0412 \u043F\u043E\u0438\u0441\u043A\u0435 \u0438 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u044F\u0445 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043E\u0431\u0440\u0435\u0437\u0430\u0435\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 ~60\u201370 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432."],
      en: ["30\u201370 characters long", "Titles get cut after ~60\u201370 characters in search and recommendations."]
    },
    keyword: {
      ru: ["\u041A\u043B\u044E\u0447\u0435\u0432\u043E\u0439 \u0437\u0430\u043F\u0440\u043E\u0441 \u0435\u0441\u0442\u044C \u0432 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0438", "\u041F\u043E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0433\u043B\u0430\u0432\u043D\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441 \u043A\u0430\u043A \u043C\u043E\u0436\u043D\u043E \u0431\u043B\u0438\u0436\u0435 \u043A \u043D\u0430\u0447\u0430\u043B\u0443."],
      en: ["Contains the focus keyword", "Put the main query as close to the start as possible."]
    },
    keyword_front: {
      ru: ["\u041A\u043B\u044E\u0447\u0435\u0432\u043E\u0439 \u0437\u0430\u043F\u0440\u043E\u0441 \u0432 \u043F\u0435\u0440\u0432\u044B\u0445 40 \u0441\u0438\u043C\u0432\u043E\u043B\u0430\u0445", "\u041F\u0435\u0440\u0432\u044B\u0435 \u0441\u043B\u043E\u0432\u0430 \u0432\u0438\u0434\u043D\u044B \u0432\u0441\u0435\u0433\u0434\u0430, \u0434\u0430\u0436\u0435 \u0435\u0441\u043B\u0438 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043E\u0431\u0440\u0435\u0437\u0430\u043D\u043E."],
      en: ["Keyword within the first 40 characters", "The first words are always visible, even when the title is cut."]
    },
    number: {
      ru: ["\u0415\u0441\u0442\u044C \u0447\u0438\u0441\u043B\u043E \u0438\u043B\u0438 \u0433\u043E\u0434", "\u041A\u043E\u043D\u043A\u0440\u0435\u0442\u0438\u043A\u0430 (\xAB7 \u0441\u043F\u043E\u0441\u043E\u0431\u043E\u0432\xBB, \xAB2026\xBB) \u043F\u043E\u0432\u044B\u0448\u0430\u0435\u0442 \u043A\u043B\u0438\u043A\u0430\u0431\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C."],
      en: ["Has a number or a year", 'Specifics ("7 ways", "2026") raise click-through.']
    },
    hook: {
      ru: ["\u0415\u0441\u0442\u044C \u043A\u0440\u044E\u0447\u043E\u043A (\u0432\u043E\u043F\u0440\u043E\u0441, \xAB\u043A\u0430\u043A\xBB, \xAB\u043F\u043E\u0447\u0435\u043C\u0443\xBB, \u043A\u043E\u043D\u0442\u0440\u0430\u0441\u0442, \u0441\u043A\u043E\u0431\u043A\u0438)", "\u0414\u0430\u0439\u0442\u0435 \u043F\u0440\u0438\u0447\u0438\u043D\u0443 \u043A\u043B\u0438\u043A\u043D\u0443\u0442\u044C: \u043E\u0431\u0435\u0449\u0430\u043D\u0438\u0435 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0430, \u0438\u043D\u0442\u0440\u0438\u0433\u0430, \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435."],
      en: ['Has a hook (question, "how", "why", contrast, brackets)', "Give a reason to click: a promised result, intrigue, a comparison."]
    },
    words: {
      ru: ["5\u201312 \u0441\u043B\u043E\u0432", "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043A\u043E\u0440\u043E\u0442\u043A\u043E\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043D\u0435 \u043E\u0431\u044A\u044F\u0441\u043D\u044F\u0435\u0442 \u0442\u0435\u043C\u0443, \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0434\u043B\u0438\u043D\u043D\u043E\u0435 \u0442\u0435\u0440\u044F\u0435\u0442 \u0444\u043E\u043A\u0443\u0441."],
      en: ["5\u201312 words", "Too short under-explains the topic; too long loses focus."]
    },
    style: {
      ru: ["\u0411\u0435\u0437 \u043A\u0430\u043F\u0441\u0430, \u0441\u043F\u0430\u043C\u0430 \u0438\u0437 \xAB!\xBB \u0438 \u044D\u043C\u043E\u0434\u0437\u0438", "\u041E\u0434\u0438\u043D \u0432\u043E\u0441\u043A\u043B\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0437\u043D\u0430\u043A \u0438 \u043D\u0435 \u0431\u043E\u043B\u0435\u0435 \u043E\u0434\u043D\u043E\u0433\u043E \u044D\u043C\u043E\u0434\u0437\u0438."],
      en: ["No ALL CAPS, exclamation spam or emoji spam", "At most one exclamation mark and one emoji."]
    },
    unique: {
      ru: ["\u0421\u043B\u043E\u0432\u0430 \u043D\u0435 \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u044E\u0442\u0441\u044F", "\u041F\u043E\u0432\u0442\u043E\u0440\u044B \u0437\u0430\u043D\u0438\u043C\u0430\u044E\u0442 \u043C\u0435\u0441\u0442\u043E, \u043A\u043E\u0442\u043E\u0440\u043E\u0435 \u043C\u043E\u0433\u043B\u0438 \u0431\u044B \u0437\u0430\u043D\u044F\u0442\u044C \u043D\u043E\u0432\u044B\u0435 \u0441\u043B\u043E\u0432\u0430 \u0434\u043B\u044F \u043F\u043E\u0438\u0441\u043A\u0430."],
      en: ["No repeated words", "Repeats waste space that could carry new search words."]
    }
  };
  var HOOK_RE = /\?|:|—|–| - |\(|\[|\bhow\b|\bwhy\b|\bwhat\b|\bbest\b|\btop\b|\bvs\.?\b|\bsecret|\bmistake|\bnever\b|\bstop\b|\bbefore\b|\bкак\b|\bпочему\b|\bчто\b|\bлучш|\bтоп\b|\bсекрет|\bошибк|\bникогда\b|\bпротив\b|\bvs\b|\bпрежде\b|\bбез\b|\bза \d/iu;
  function titleScore(title, focusKeyword = "", lang3 = "ru") {
    const t2 = title.trim();
    const kw = focusKeyword.trim().toLowerCase();
    const lower = t2.toLowerCase();
    const ws = t2.split(/\s+/).filter(Boolean);
    const letters = t2.replace(/[^\p{L}]/gu, "");
    const capsRatio = letters.length ? letters.replace(/[^\p{Lu}]/gu, "").length / letters.length : 0;
    const emojiCount = (t2.match(new RegExp("\\p{Extended_Pictographic}", "gu")) ?? []).length;
    const exclam = (t2.match(/!/g) ?? []).length;
    const normalized = ws.map((w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "")).filter((w) => w.length > 2);
    const hasKw = kw ? lower.includes(kw) || overlap(words(kw), lower) >= 0.75 : false;
    const raw = [
      ["length", t2.length >= 30 && t2.length <= 70, 20],
      ["keyword", hasKw, 15],
      ["keyword_front", hasKw && (lower.indexOf(kw) >= 0 ? lower.indexOf(kw) < 40 : overlap(words(kw), lower.slice(0, 40)) >= 0.75), 10],
      ["number", /\d/.test(t2), 10],
      ["hook", HOOK_RE.test(t2), 15],
      ["words", ws.length >= 5 && ws.length <= 12, 10],
      ["style", capsRatio < 0.6 && exclam <= 1 && emojiCount <= 1, 10],
      ["unique", new Set(normalized).size === normalized.length, 10]
    ];
    const applicable = kw ? raw : raw.filter(([id]) => !id.startsWith("keyword"));
    const checks = applicable.map(([id, ok, weight]) => ({ id, ok, weight, label: TITLE_LABELS[id][lang3][0], hint: TITLE_LABELS[id][lang3][1] }));
    const total = checks.reduce((s, c) => s + c.weight, 0);
    const got = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
    return { score: t2 ? Math.round(got / total * 100) : 0, checks };
  }
  function guessFocusKeyword(title) {
    const ws = title.replace(/[|:—–\-()[\]"«»]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w.toLowerCase()) && !/^[\d!?.,]+$/.test(w));
    return ws.slice(0, 3).join(" ").toLowerCase();
  }

  // src/content/studio.css
  var studio_default = ':host {\n  all: initial;\n  position: fixed;\n  right: 16px;\n  bottom: 16px;\n  z-index: 2147483000;\n  width: 360px;\n  max-height: calc(100vh - 32px);\n  display: block;\n  font-family: "Roboto", "YouTube Sans", Arial, sans-serif;\n  --nb-bg: #fff;\n  --nb-bg2: #f3f4f6;\n  --nb-fg: #0f0f0f;\n  --nb-fg2: #606060;\n  --nb-line: #e5e5e5;\n  --nb-accent: #4f46e5;\n  --nb-accent2: #8b5cf6;\n  --nb-good: #16a34a;\n  --nb-warn: #d97706;\n  --nb-bad: #dc2626;\n}\n:host([data-theme="dark"]) {\n  --nb-bg: #212121;\n  --nb-bg2: #2d2d2d;\n  --nb-fg: #f1f1f1;\n  --nb-fg2: #aaa;\n  --nb-line: #3a3a3a;\n}\n:host([data-collapsed="1"]) .body { display: none; }\n:host([data-collapsed="1"]) { width: auto; }\n* { box-sizing: border-box; }\n.panel {\n  background: var(--nb-bg);\n  color: var(--nb-fg);\n  border: 1px solid var(--nb-line);\n  border-radius: 14px;\n  box-shadow: 0 10px 30px rgba(0,0,0,.18);\n  font-size: 13px;\n  line-height: 1.4;\n  display: flex;\n  flex-direction: column;\n  max-height: calc(100vh - 32px);\n}\n.head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--nb-line); cursor: default; }\n.logo { width: 22px; height: 22px; border-radius: 6px; background: linear-gradient(135deg, var(--nb-accent), var(--nb-accent2)); position: relative; flex: none; }\n.logo::after { content: ""; position: absolute; left: 8px; top: 6px; border-left: 8px solid #fff; border-top: 5px solid transparent; border-bottom: 5px solid transparent; }\n.title { font-weight: 600; flex: 1; }\n.pill { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: var(--nb-bg2); color: var(--nb-fg2); white-space: nowrap; }\n.pill.good { background: rgba(22,163,74,.15); color: var(--nb-good); }\n.pill.warn { background: rgba(217,119,6,.15); color: var(--nb-warn); }\n.pill.bad { background: rgba(220,38,38,.15); color: var(--nb-bad); }\n.icon { border: 0; background: none; color: var(--nb-fg2); cursor: pointer; font-size: 16px; padding: 2px 6px; border-radius: 6px; font-family: inherit; }\n.icon:hover { background: var(--nb-bg2); color: var(--nb-fg); }\n.body { overflow-y: auto; padding: 10px 12px 12px; }\n.sec { margin-bottom: 12px; }\n.sec h4 { margin: 0 0 6px; font-size: 12px; color: var(--nb-fg2); text-transform: uppercase; letter-spacing: .04em; display: flex; align-items: center; gap: 6px; }\n.sec h4 .pill { margin-left: auto; }\n.row { display: flex; align-items: center; gap: 6px; }\ninput.kw { flex: 1; border: 1px solid var(--nb-line); border-radius: 8px; padding: 6px 8px; font: inherit; background: var(--nb-bg); color: var(--nb-fg); min-width: 0; }\ninput.kw:focus { outline: 2px solid var(--nb-accent); outline-offset: -1px; }\n.btn { border: 1px solid var(--nb-line); background: var(--nb-bg); color: var(--nb-fg); border-radius: 999px; padding: 5px 10px; font-size: 12px; cursor: pointer; font-family: inherit; white-space: nowrap; }\n.btn:hover { background: var(--nb-bg2); }\n.btn:disabled { opacity: .5; cursor: default; }\n.btn.primary { background: var(--nb-accent); border-color: var(--nb-accent); color: #fff; }\n.btn.small { padding: 2px 8px; font-size: 11px; }\n.bar { height: 6px; background: var(--nb-bg2); border-radius: 3px; overflow: hidden; flex: 1; }\n.bar > i { display: block; height: 100%; background: linear-gradient(90deg, var(--nb-accent), var(--nb-accent2)); }\n.meter { display: grid; grid-template-columns: 90px 1fr 36px; gap: 8px; align-items: center; font-size: 12px; margin: 4px 0; }\n.meter .v { text-align: right; font-weight: 600; }\n.checks { margin: 4px 0 0; padding: 0; list-style: none; font-size: 12px; }\n.checks li { display: flex; gap: 6px; padding: 1px 0; color: var(--nb-fg2); }\n.checks li.ok { color: var(--nb-fg); }\n.checks li .ic { width: 14px; flex: none; }\n.checks li.ok .ic { color: var(--nb-good); }\n.checks li.no .ic { color: var(--nb-bad); }\n.checks li .hint { display: block; font-size: 11px; color: var(--nb-fg2); }\n.chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }\n.chip { background: var(--nb-bg2); border: 0; border-radius: 999px; padding: 2px 9px; font-size: 11px; cursor: pointer; color: var(--nb-fg); font-family: inherit; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.chip:hover { background: var(--nb-line); }\n.chip.added { opacity: .5; cursor: default; }\n.chip b { font-weight: 600; color: var(--nb-fg2); }\n.muted { color: var(--nb-fg2); font-size: 12px; }\n.preview { background: var(--nb-bg2); border-radius: 8px; padding: 8px 10px; margin-top: 6px; }\n.preview .pt { color: #065fd4; font-size: 13px; font-weight: 500; }\n:host([data-theme="dark"]) .preview .pt { color: #3ea6ff; }\n.preview .pd { color: var(--nb-fg2); font-size: 11px; margin-top: 2px; white-space: pre-wrap; }\n.actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }\n.result { border: 1px solid var(--nb-line); border-radius: 10px; padding: 8px 10px; margin-top: 8px; }\n.result .status { font-size: 12px; color: var(--nb-fg2); display: flex; align-items: center; gap: 6px; }\n.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--nb-accent); animation: blink 1s infinite; flex: none; }\n@keyframes blink { 50% { opacity: .2; } }\n.item { display: flex; gap: 8px; align-items: flex-start; padding: 6px 0; border-top: 1px solid var(--nb-line); }\n.item:first-of-type { border-top: 0; }\n.item .t { flex: 1; min-width: 0; }\n.item .t .a { color: var(--nb-fg2); font-size: 11px; }\n.item .t .n { color: var(--nb-fg2); font-size: 11px; }\npre.desc { white-space: pre-wrap; font: inherit; margin: 6px 0; max-height: 220px; overflow-y: auto; background: var(--nb-bg2); border-radius: 8px; padding: 8px; }\ntable.cmp { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }\ntable.cmp td { padding: 3px 4px; border-top: 1px solid var(--nb-line); vertical-align: top; }\ntable.cmp td.num { text-align: right; white-space: nowrap; color: var(--nb-fg2); }\n.err { color: var(--nb-bad); font-size: 12px; }\n.toast { position: absolute; left: 12px; right: 12px; bottom: 12px; background: var(--nb-fg); color: var(--nb-bg); padding: 6px 10px; border-radius: 8px; font-size: 12px; opacity: 0; transition: opacity .2s; pointer-events: none; }\n.toast.show { opacity: .95; }\nol.fixes { margin: 4px 0; padding-left: 18px; }\n';

  // src/content/studio.ts
  var SEL = {
    title: ["#title-textarea #textbox", '#title-textarea [contenteditable="true"]', "ytcp-video-title #textbox", "#title-wrapper #textbox"],
    description: ["#description-textarea #textbox", '#description-textarea [contenteditable="true"]', "#description-wrapper #textbox"],
    tagsInput: ["#tags-container #text-input", "#tags-container input", "ytcp-free-text-chip-bar #text-input", "ytcp-free-text-chip-bar input"],
    tagsChips: ["#tags-container ytcp-chip", "ytcp-free-text-chip-bar ytcp-chip", "#tags-container .chip"]
  };
  var L = {
    ru: {
      title: "Nubit \xB7 \u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F",
      kw: "\u041A\u043B\u044E\u0447\u0435\u0432\u043E\u0439 \u0437\u0430\u043F\u0440\u043E\u0441",
      check: "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0441\u043F\u0440\u043E\u0441",
      checking: "\u043F\u0440\u043E\u0432\u0435\u0440\u044F\u044E\u2026",
      demand: "\u0421\u043F\u0440\u043E\u0441",
      competition: "\u041A\u043E\u043D\u043A\u0443\u0440\u0435\u043D\u0446\u0438\u044F",
      exact: "\u0442\u043E\u0447\u043D\u044B\u0445 \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0439 \u0432 \u0442\u043E\u043F\u0435",
      suggestions: "\u041B\u044E\u0434\u0438 \u0438\u0449\u0443\u0442",
      compTags: "\u0422\u0435\u0433\u0438 \u043A\u043E\u043D\u043A\u0443\u0440\u0435\u043D\u0442\u043E\u0432",
      loadTags: "\u0422\u0435\u0433\u0438 \u0438\u0437 \u0442\u043E\u043F-\u0432\u0438\u0434\u0435\u043E",
      addAll: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432\u0441\u0435",
      titleSec: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435",
      descSec: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435",
      tagsSec: "\u0422\u0435\u0433\u0438",
      chars: "\u0441\u0438\u043C\u0432.",
      words: "\u0441\u043B\u043E\u0432",
      preview: "\u0422\u0430\u043A \u0443\u0432\u0438\u0434\u044F\u0442 \u0432 \u043F\u043E\u0438\u0441\u043A\u0435",
      show: "\u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438",
      ai: "\u0418\u0418",
      gen_titles: "\u2728 \u041D\u0430\u0437\u0432\u0430\u043D\u0438\u044F",
      gen_description: "\u2728 \u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435",
      gen_tags: "\u2728 \u0422\u0435\u0433\u0438",
      gen_compare: "\u2694 \u0421\u0440\u0430\u0432\u043D\u0438\u0442\u044C \u0441 \u043A\u043E\u043D\u043A\u0443\u0440\u0435\u043D\u0442\u0430\u043C\u0438",
      insert: "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C",
      append: "\u0412 \u043A\u043E\u043D\u0435\u0446",
      stop: "\u0421\u0442\u043E\u043F",
      chat: "\u0427\u0430\u0442",
      noKey: "\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 API-\u043A\u043B\u044E\u0447 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 Nubit, \u0447\u0442\u043E\u0431\u044B \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0418\u0418.",
      settings: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
      running: "\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u0443\u044E\u2026",
      inserted: "\u0412\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E",
      copied: "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E \u0432 \u0431\u0443\u0444\u0435\u0440 \u043E\u0431\u043C\u0435\u043D\u0430",
      noTagsField: "\u041F\u043E\u043B\u0435 \u0442\u0435\u0433\u043E\u0432 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E: \u043E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \xAB\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0435\u0449\u0451\xBB \u2192 \u0422\u0435\u0433\u0438. \u0422\u0435\u0433\u0438 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u044B \u0432 \u0431\u0443\u0444\u0435\u0440.",
      standout: "\u0412\u044B\u0434\u0435\u043B\u044F\u0435\u043C\u043E\u0441\u0442\u044C",
      fixes: "\u0427\u0442\u043E \u043F\u043E\u043F\u0440\u0430\u0432\u0438\u0442\u044C",
      alternatives: "\u0410\u043B\u044C\u0442\u0435\u0440\u043D\u0430\u0442\u0438\u0432\u044B",
      competitors: "\u0422\u043E\u043F \u043F\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0443",
      tagsCount: "\u0442\u0435\u0433\u043E\u0432",
      noTitle: "\u041D\u0430\u0447\u043D\u0438\u0442\u0435 \u0432\u0432\u043E\u0434\u0438\u0442\u044C \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u2014 \u043E\u0446\u0435\u043D\u043A\u0430 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C.",
      openSettings: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
      gen_magic: "\u{1FA84} \u0417\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u044C \u0432\u0441\u0451",
      gen_thumb: "\u{1F5BC} \u041E\u0446\u0435\u043D\u0438\u0442\u044C \u043F\u0440\u0435\u0432\u044C\u044E",
      templates: "\u0428\u0430\u0431\u043B\u043E\u043D\u044B \u0442\u0435\u0433\u043E\u0432",
      tpl_apply: "\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C",
      tpl_save: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0438\u0435 \u0442\u0435\u0433\u0438 \u043A\u0430\u043A \u0448\u0430\u0431\u043B\u043E\u043D",
      tpl_name: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0448\u0430\u0431\u043B\u043E\u043D\u0430:",
      tpl_del: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D",
      noThumb: "\u041F\u0440\u0435\u0432\u044C\u044E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E: \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0443 \u0432 \u043F\u043E\u043B\u0435 \xAB\u0417\u043D\u0430\u0447\u043E\u043A\xBB \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435.",
      thumbLoading: "\u0447\u0438\u0442\u0430\u044E \u043F\u0440\u0435\u0432\u044C\u044E\u2026",
      magicDone: "\u0417\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u043E: \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435, \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0438 \u0442\u0435\u0433\u0438. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0438 \u043E\u0442\u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u0443\u0439\u0442\u0435.",
      thumbText: "\u0422\u0435\u043A\u0441\u0442 \u043D\u0430 \u043F\u0440\u0435\u0432\u044C\u044E",
      strengths: "\u0421\u0438\u043B\u044C\u043D\u044B\u0435 \u0441\u0442\u043E\u0440\u043E\u043D\u044B",
      issues: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u044B",
      textIdeas: "\u0418\u0434\u0435\u0438 \u0442\u0435\u043A\u0441\u0442\u0430"
    },
    en: {
      title: "Nubit \xB7 optimization",
      kw: "Focus keyword",
      check: "Check demand",
      checking: "checking\u2026",
      demand: "Demand",
      competition: "Competition",
      exact: "exact matches in the top results",
      suggestions: "People search for",
      compTags: "Competitor tags",
      loadTags: "Tags from top videos",
      addAll: "Add all",
      titleSec: "Title",
      descSec: "Description",
      tagsSec: "Tags",
      chars: "chars",
      words: "words",
      preview: "Search preview",
      show: "checks",
      ai: "AI",
      gen_titles: "\u2728 Titles",
      gen_description: "\u2728 Description",
      gen_tags: "\u2728 Tags",
      gen_compare: "\u2694 Compare with competitors",
      insert: "Insert",
      append: "Append",
      stop: "Stop",
      chat: "Chat",
      noKey: "Add an API key in Nubit settings to enable the AI.",
      settings: "Settings",
      running: "generating\u2026",
      inserted: "Inserted",
      copied: "Copied to clipboard",
      noTagsField: 'Tags field not found: open "Show more" \u2192 Tags. The tags were copied to the clipboard.',
      standout: "Stand-out score",
      fixes: "What to fix",
      alternatives: "Alternatives",
      competitors: "Top results",
      tagsCount: "tags",
      noTitle: "Start typing a title \u2014 the score will appear here.",
      openSettings: "Open settings",
      gen_magic: "\u{1FA84} Magic fill",
      gen_thumb: "\u{1F5BC} Review thumbnail",
      templates: "Tag templates",
      tpl_apply: "Apply",
      tpl_save: "Save current tags as a template",
      tpl_name: "Template name:",
      tpl_del: "Delete template",
      noThumb: "No thumbnail found: upload one in the Thumbnail field and retry.",
      thumbLoading: "reading the thumbnail\u2026",
      magicDone: "Filled in: title, description and tags. Review and edit.",
      thumbText: "Text on thumbnail",
      strengths: "Strengths",
      issues: "Issues",
      textIdeas: "Text ideas"
    }
  };
  var settings;
  var lang2 = "ru";
  var host = null;
  var root = null;
  var toastEl = null;
  var port = null;
  var kwInputFocused = false;
  var collapsed = false;
  var state = {
    draft: { title: "", description: "", tags: [] },
    focusKeyword: "",
    focusEdited: false,
    showTitleChecks: false,
    showSeoChecks: false,
    ai: {}
  };
  var t = (k) => L[lang2][k];
  var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function q(list) {
    for (const s of list) {
      const el = document.querySelector(s);
      if (el) return el;
    }
    return null;
  }
  function readEditable(el) {
    if (!el) return "";
    return (el.innerText ?? el.textContent ?? "").replace(/ /g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }
  function readTags() {
    for (const s of SEL.tagsChips) {
      const chips = document.querySelectorAll(s);
      if (chips.length) {
        return Array.from(chips).map((c) => (c.querySelector("#chip-text, .chip-text, span")?.textContent ?? c.textContent ?? "").trim()).filter(Boolean);
      }
    }
    return [];
  }
  function readDraft() {
    const titleEl = q(SEL.title);
    if (!titleEl) return null;
    const title = readEditable(titleEl);
    const description = readEditable(q(SEL.description));
    const tags = readTags();
    return { title, description, tags };
  }
  function setEditable(el, text) {
    el.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    sel?.removeAllRanges();
    sel?.addRange(range);
    let ok = false;
    try {
      ok = document.execCommand("insertText", false, text);
    } catch {
      ok = false;
    }
    if (!ok || readEditable(el) !== text.trim()) {
      el.textContent = text;
      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    }
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.blur();
  }
  async function addTags(tags) {
    const input = q(SEL.tagsInput);
    const seen = new Set(readTags().map((x) => x.toLowerCase()));
    const fresh = [];
    for (const raw of tags) {
      const x = raw.trim();
      if (!x || seen.has(x.toLowerCase())) continue;
      seen.add(x.toLowerCase());
      fresh.push(x);
    }
    if (!input) {
      await navigator.clipboard.writeText(fresh.join(", ")).catch(() => void 0);
      toast(t("noTagsField"));
      return 0;
    }
    let added = 0;
    for (const tag of fresh) {
      const before = readTags().length;
      input.focus();
      input.value = tag;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      const press = (type) => input.dispatchEvent(new KeyboardEvent(type, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true }));
      press("keydown");
      press("keypress");
      press("keyup");
      await sleep(80);
      if (readTags().length === before) {
        input.value = tag + ",";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(80);
      }
      if (readTags().length > before) added++;
    }
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return added;
  }
  async function insert(field, value, mode = "replace") {
    if (field === "tags") {
      const n = await addTags(Array.isArray(value) ? value : String(value).split(/[,\n]/));
      if (n) toast(`${t("inserted")}: ${n}`);
      return n > 0;
    }
    const el = q(field === "title" ? SEL.title : SEL.description);
    if (!el) {
      await navigator.clipboard.writeText(String(value)).catch(() => void 0);
      toast(t("copied"));
      return false;
    }
    const text = Array.isArray(value) ? value.join("\n") : value;
    setEditable(el, mode === "append" && readEditable(el) ? `${readEditable(el)}

${text}` : text);
    toast(t("inserted"));
    refreshDraft();
    return true;
  }
  function isDark() {
    return document.documentElement.hasAttribute("dark") || getComputedStyle(document.body).backgroundColor === "rgb(31, 31, 31)" || getComputedStyle(document.body).colorScheme === "dark";
  }
  function pillClass(score) {
    return score >= 75 ? "good" : score >= 50 ? "warn" : "bad";
  }
  function meter(label, value) {
    const v = value ?? 0;
    return `<div class="meter"><span>${label}</span><div class="bar"><i style="width:${Math.max(2, Math.min(100, v))}%"></i></div><span class="v">${value === void 0 ? "\u2014" : Math.round(v)}</span></div>`;
  }
  function checksHtml(checks) {
    return `<ul class="checks">${checks.map((c) => `<li class="${c.ok ? "ok" : "no"}"><span class="ic">${c.ok ? "\u2713" : "\u2717"}</span><span>${escapeHtml(c.label)}${c.ok ? "" : `<span class="hint">${escapeHtml(c.hint)}</span>`}</span></li>`).join("")}</ul>`;
  }
  function chip(text, action, extra = "", added = false) {
    return `<button class="chip ${added ? "added" : ""}" data-act="${action}" data-val="${escapeHtml(text)}" ${added ? "disabled" : ""}>${escapeHtml(text)}${extra}</button>`;
  }
  function render() {
    if (!root || !host) return;
    host.setAttribute("data-theme", isDark() ? "dark" : "light");
    host.setAttribute("data-collapsed", collapsed ? "1" : "0");
    const d = state.draft;
    const kw = state.focusKeyword;
    const ts = titleScore(d.title, kw, lang2);
    const seo = seoScore({ videoId: "draft", url: "", title: d.title, description: d.description, tags: d.tags }, lang2);
    const existing = new Set(d.tags.map((x) => x.toLowerCase()));
    const ready = providerReady(settings);
    const parts = [];
    parts.push(`<div class="head"><span class="logo"></span><span class="title">${t("title")}</span>
    ${d.title ? `<span class="pill ${pillClass(ts.score)}" title="${t("titleSec")}">${t("titleSec")} ${ts.score}</span><span class="pill ${pillClass(seo.score)}" title="SEO">SEO ${seo.score}</span>` : ""}
    <button class="icon" data-act="chat" title="${t("chat")}">\u{1F4AC}</button>
    <button class="icon" data-act="collapse" title="${collapsed ? "\u25B2" : "\u25BC"}">${collapsed ? "\u25B2" : "\u25BC"}</button></div>`);
    const body = [];
    const r = state.report && state.reportFor === kw ? state.report : void 0;
    body.push(`<div class="sec"><h4>${t("kw")}</h4>
    <div class="row"><input class="kw" id="kw" value="${escapeHtml(kw)}" placeholder="${escapeHtml(guessFocusKeyword(d.title) || "\u2026")}" />
      <button class="btn" data-act="check" ${!kw || state.reportLoading ? "disabled" : ""}>${state.reportLoading ? t("checking") : t("check")}</button></div>
    ${state.reportError ? `<div class="err">${escapeHtml(state.reportError)}</div>` : ""}
    ${r ? `${meter(t("demand"), r.demand)}${meter(t("competition"), r.competition)}
           <div class="muted">${r.exactInTitle}/${r.resultCount} ${t("exact")}${r.medianViews ? ` \xB7 ${formatCompact(r.medianViews)} views median` : ""}</div>
           ${r.suggestions.length ? `<div class="muted" style="margin-top:6px">${t("suggestions")}:</div><div class="chips">${r.suggestions.slice(0, 12).map((s) => chip(s, "addtag", "", existing.has(s.toLowerCase()))).join("")}</div>` : ""}
           <div class="row" style="margin-top:6px"><button class="btn small" data-act="comptags" ${state.compTagsLoading ? "disabled" : ""}>${state.compTagsLoading ? t("checking") : t("loadTags")}</button>
             ${state.compTags?.length ? `<button class="btn small" data-act="addfreq">${t("addAll")} (\u22652)</button>` : ""}</div>
           ${state.compTags?.length ? `<div class="chips">${state.compTags.slice(0, 24).map((x) => chip(x.tag, "addtag", ` <b>${x.n}</b>`, existing.has(x.tag.toLowerCase()))).join("")}</div>` : ""}` : ""}
  </div>`);
    const titleWords = d.title.split(/\s+/).filter(Boolean).length;
    body.push(`<div class="sec"><h4>${t("titleSec")} <span class="muted">${d.title.length} ${t("chars")} \xB7 ${titleWords} ${t("words")}</span>${d.title ? `<span class="pill ${pillClass(ts.score)}">${ts.score}</span>` : ""}</h4>
    ${d.title ? `<div class="row"><div class="bar"><i style="width:${ts.score}%"></i></div><button class="btn small" data-act="toggleTitle">${t("show")}</button></div>
           ${state.showTitleChecks ? checksHtml(ts.checks) : ""}
           <div class="preview"><div class="muted">${t("preview")}</div><div class="pt">${escapeHtml(d.title.length > 60 ? d.title.slice(0, 57).trimEnd() + "\u2026" : d.title)}</div>${d.description ? `<div class="pd">${escapeHtml(d.description.split("\n").slice(0, 2).join("\n").slice(0, 150))}</div>` : ""}</div>` : `<div class="muted">${t("noTitle")}</div>`}
  </div>`);
    const tpls = settings.tagTemplates ?? [];
    body.push(`<div class="sec"><h4>${t("descSec")} <span class="muted">${d.description.length} ${t("chars")}</span> \xB7 ${t("tagsSec")} <span class="muted">${d.tags.length}</span><span class="pill ${pillClass(seo.score)}">SEO ${seo.score}</span></h4>
    <div class="row"><div class="bar"><i style="width:${seo.score}%"></i></div><button class="btn small" data-act="toggleSeo">${t("show")}</button></div>
    ${state.showSeoChecks ? checksHtml(seo.checks) : ""}
    <div class="row" style="margin-top:6px">
      <select class="kw" id="tpl" title="${t("templates")}"><option value="">${t("templates")}\u2026</option>${tpls.map((x, i) => `<option value="${i}">${escapeHtml(x.name)} (${x.tags.length})</option>`).join("")}</select>
      <button class="btn small" data-act="tpl-apply">${t("tpl_apply")}</button>
      <button class="btn small" data-act="tpl-del" title="${t("tpl_del")}">\u2715</button>
    </div>
    ${d.tags.length ? `<div class="row" style="margin-top:4px"><button class="btn small" data-act="tpl-save">${t("tpl_save")}</button></div>` : ""}
  </div>`);
    const acts = [
      ["studio_magic_fill", "gen_magic"],
      ["studio_titles", "gen_titles"],
      ["studio_description", "gen_description"],
      ["studio_tags", "gen_tags"],
      ["studio_compare", "gen_compare"],
      ["studio_thumbnail", "gen_thumb"]
    ];
    body.push(`<div class="sec"><h4>${t("ai")}</h4>
    ${ready ? "" : `<div class="muted">${t("noKey")} <button class="btn small" data-act="settings">${t("openSettings")}</button></div>`}
    <div class="actions">${acts.map(([a, k]) => `<button class="btn ${a === "studio_compare" || a === "studio_thumbnail" ? "" : "primary"}" data-act="ai" data-val="${a}" ${!ready || state.running ? "disabled" : ""}>${t(k)}</button>`).join("")}
      ${state.running ? `<button class="btn" data-act="stop">${t("stop")}</button>` : ""}</div>
    ${acts.map(([a]) => resultHtml(a, state.ai[a], existing)).join("")}
  </div>`);
    parts.push(`<div class="body">${body.join("")}</div><div class="toast" id="toast"></div>`);
    root.innerHTML = `<div class="panel">${parts.join("")}</div>`;
    toastEl = root.querySelector("#toast");
    const kwInput = root.querySelector("#kw");
    if (kwInput) {
      kwInput.addEventListener("input", () => {
        state.focusKeyword = kwInput.value.trim().toLowerCase();
        state.focusEdited = true;
      });
      kwInput.addEventListener("focus", () => kwInputFocused = true);
      kwInput.addEventListener("blur", () => {
        kwInputFocused = false;
        render();
      });
      kwInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          checkKeyword();
        }
      });
    }
  }
  function resultHtml(action, r, existing) {
    if (!r || r.status === "idle") return "";
    if (r.status === "running") return `<div class="result"><div class="status"><span class="dot"></span>${escapeHtml(r.progress ?? t("running"))}</div>${r.text ? `<div class="muted" style="margin-top:4px">${escapeHtml(r.text.slice(-160))}</div>` : ""}</div>`;
    if (r.status === "error") return `<div class="result"><div class="err">${escapeHtml(r.error ?? "error")}</div></div>`;
    const p = r.parsed;
    if (!p) return `<div class="result"><pre class="desc">${escapeHtml(r.text)}</pre></div>`;
    if (action === "studio_titles" && Array.isArray(p.titles)) {
      return `<div class="result">${p.titles.map((x) => {
        const title = typeof x === "string" ? x : String(x.title ?? "");
        const sc = titleScore(title, state.focusKeyword, lang2).score;
        return `<div class="item"><div class="t">${escapeHtml(title)}<div class="a">${escapeHtml(String(x.angle ?? ""))}</div><div class="n">${title.length} ${t("chars")} \xB7 ${sc}</div></div><button class="btn small" data-act="insert" data-field="title" data-val="${escapeHtml(title)}">${t("insert")}</button></div>`;
      }).join("")}</div>`;
    }
    if (action === "studio_description" && typeof p.description === "string") {
      return `<div class="result"><pre class="desc">${escapeHtml(p.description)}</pre><div class="actions"><button class="btn small primary" data-act="insert" data-field="description" data-mode="replace">${t("insert")}</button><button class="btn small" data-act="insert" data-field="description" data-mode="append">${t("append")}</button></div></div>`;
    }
    if (action === "studio_tags" && Array.isArray(p.tags)) {
      const tags = p.tags.map((x) => String(x)).filter(Boolean);
      return `<div class="result"><div class="row"><span class="muted">${tags.length} ${t("tagsCount")} \xB7 ${tags.join(", ").length} ${t("chars")}</span><span style="flex:1"></span><button class="btn small primary" data-act="addtags" data-val="${escapeHtml(JSON.stringify(tags))}">${t("addAll")}</button></div>
      <div class="chips">${tags.map((x) => chip(x, "addtag", "", existing.has(x.toLowerCase()))).join("")}</div></div>`;
    }
    if (action === "studio_magic_fill" && (p.title || p.description || p.tags)) {
      return `<div class="result"><div class="muted">${t("magicDone")}</div>${p.title ? `<div class="item"><div class="t">${escapeHtml(String(p.title))}</div><button class="btn small" data-act="insert" data-field="title" data-val="${escapeHtml(String(p.title))}">${t("insert")}</button></div>` : ""}</div>`;
    }
    if (action === "studio_thumbnail" && (typeof p.score === "number" || p.verdict)) {
      const score = Number(p.score ?? 0);
      const list = (title, arr) => Array.isArray(arr) && arr.length ? `<div class="muted" style="margin-top:6px">${title}:</div><ol class="fixes">${arr.map((x) => `<li>${escapeHtml(String(x))}</li>`).join("")}</ol>` : "";
      return `<div class="result"><div class="row"><span class="pill ${pillClass(score)}">${t("gen_thumb").replace(/^\S+\s/, "")} ${score}</span></div>
      <div style="margin-top:6px">${escapeHtml(String(p.verdict ?? ""))}</div>
      ${p.text_on_thumbnail ? `<div class="muted" style="margin-top:4px">${t("thumbText")}: \xAB${escapeHtml(String(p.text_on_thumbnail))}\xBB</div>` : ""}
      ${list(t("strengths"), p.strengths)}${list(t("issues"), p.issues)}${list(t("fixes"), p.suggestions)}${list(t("textIdeas"), p.text_ideas)}
    </div>`;
    }
    if (action === "studio_compare" && (typeof p.score === "number" || p.verdict)) {
      const score = Number(p.score ?? 0);
      return `<div class="result"><div class="row"><span class="pill ${pillClass(score)}">${t("standout")} ${score}</span></div>
      <div style="margin-top:6px">${escapeHtml(String(p.verdict ?? ""))}</div>
      ${Array.isArray(p.fixes) && p.fixes.length ? `<div class="muted" style="margin-top:6px">${t("fixes")}:</div><ol class="fixes">${p.fixes.map((f) => `<li>${escapeHtml(String(f))}</li>`).join("")}</ol>` : ""}
      ${Array.isArray(p.alternatives) && p.alternatives.length ? `<div class="muted">${t("alternatives")}:</div>${p.alternatives.map((a) => `<div class="item"><div class="t">${escapeHtml(String(a))}</div><button class="btn small" data-act="insert" data-field="title" data-val="${escapeHtml(String(a))}">${t("insert")}</button></div>`).join("")}` : ""}
      ${Array.isArray(p.competitors) && p.competitors.length ? `<div class="muted" style="margin-top:6px">${t("competitors")}:</div><table class="cmp">${p.competitors.slice(0, 10).map((c) => `<tr><td>${escapeHtml(String(c.title ?? ""))}<div class="muted">${escapeHtml(String(c.channel ?? ""))}</div></td><td class="num">${formatCompact(Number(c.views) || void 0)}<br>${c.vph ? formatCompact(Number(c.vph)) + "/h" : ""}</td></tr>`).join("")}</table>` : ""}
    </div>`;
    }
    return `<div class="result"><pre class="desc">${escapeHtml(r.text)}</pre></div>`;
  }
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl?.classList.remove("show"), 1800);
  }
  async function checkKeyword() {
    const kw = state.focusKeyword.trim();
    if (!kw) return;
    state.reportLoading = true;
    state.reportError = void 0;
    render();
    try {
      const res = await chrome.runtime.sendMessage({ type: "analyzeKeyword", query: kw, lang: lang2 });
      if (!res || "error" in res) throw new Error(res && "error" in res ? res.error : "no response");
      state.report = res;
      state.reportFor = kw;
      state.compTags = void 0;
    } catch (err) {
      state.reportError = err instanceof Error ? err.message : String(err);
    } finally {
      state.reportLoading = false;
      render();
    }
  }
  async function loadCompetitorTags() {
    const r = state.report;
    if (!r) return;
    state.compTagsLoading = true;
    render();
    try {
      const ids = r.topResults.slice(0, 6).map((v) => v.videoId);
      const res = await chrome.runtime.sendMessage({ type: "getVideoTags", videoIds: ids });
      if (!res) throw new Error("no response");
      if (typeof res.error === "string") throw new Error(res.error);
      const freq = /* @__PURE__ */ new Map();
      for (const tags of Object.values(res)) {
        for (const tag of new Set(tags.map((x) => x.trim()).filter(Boolean))) {
          const key = tag.toLowerCase();
          const cur = freq.get(key) ?? { tag, n: 0 };
          cur.n++;
          freq.set(key, cur);
        }
      }
      state.compTags = [...freq.values()].sort((a, b) => b.n - a.n || a.tag.length - b.tag.length);
    } catch (err) {
      state.reportError = err instanceof Error ? err.message : String(err);
    } finally {
      state.compTagsLoading = false;
      render();
    }
  }
  function ensurePort() {
    if (port) return port;
    port = chrome.runtime.connect({ name: "chat" });
    port.onMessage.addListener(onPanelEvent);
    port.onDisconnect.addListener(() => {
      port = null;
      if (state.running) {
        const r = state.ai[state.running];
        if (r && r.status === "running") {
          r.status = "error";
          r.error = "disconnected";
        }
        state.running = void 0;
        render();
      }
    });
    port.postMessage({ type: "hello", tabId: null });
    return port;
  }
  function runAi(action, images) {
    if (state.running) return;
    state.ai[action] = { status: "running", text: "" };
    state.running = action;
    render();
    ensurePort().postMessage({ type: "send", tabId: null, text: "", action, history: [], includeContext: true, images });
  }
  var THUMB_SEL = [
    "ytcp-thumbnail-uploader img",
    "ytcp-thumbnails-compact-editor-uploader img",
    "ytcp-video-thumbnail-with-info img",
    "#thumbnail-editor img",
    "ytcp-thumbnail-editor img",
    "#still-picture img",
    'ytcp-uploads-dialog img[src*="ytimg"]',
    'img[src^="blob:"]'
  ];
  async function captureThumbnail() {
    const imgs = THUMB_SEL.flatMap((s) => Array.from(document.querySelectorAll(s))).filter((i) => i.src && !/data:image\/svg/.test(i.src));
    if (!imgs.length) return null;
    imgs.sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight);
    const src = imgs[0].src;
    const toB64 = async (blob) => {
      const buf = new Uint8Array(await blob.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 32768) bin += String.fromCharCode(...buf.subarray(i, i + 32768));
      const mediaType = /^image\/(jpeg|png|webp|gif)$/.test(blob.type) ? blob.type : "image/jpeg";
      return { mediaType, data: btoa(bin) };
    };
    try {
      const res = await fetch(src);
      if (res.ok) return await toB64(await res.blob());
    } catch {
    }
    if (/^https?:/.test(src)) {
      const r = await chrome.runtime.sendMessage({ type: "fetchImage", url: src }).catch(() => null);
      if (r && "data" in r) return { mediaType: r.mediaType, data: r.data };
    }
    try {
      const c = document.createElement("canvas");
      c.width = imgs[0].naturalWidth || imgs[0].width;
      c.height = imgs[0].naturalHeight || imgs[0].height;
      c.getContext("2d").drawImage(imgs[0], 0, 0);
      const dataUrl = c.toDataURL("image/jpeg", 0.9);
      return { mediaType: "image/jpeg", data: dataUrl.split(",")[1] };
    } catch {
      return null;
    }
  }
  async function runThumbnailReview() {
    if (state.running) return;
    state.ai.studio_thumbnail = { status: "running", text: "", progress: t("thumbLoading") };
    state.running = "studio_thumbnail";
    render();
    const img = await captureThumbnail();
    if (!img) {
      state.ai.studio_thumbnail = { status: "error", text: "", error: t("noThumb") };
      state.running = void 0;
      render();
      return;
    }
    state.running = void 0;
    runAi("studio_thumbnail", [img]);
  }
  function onPanelEvent(ev) {
    const action = state.running;
    if (!action) return;
    const r = state.ai[action];
    switch (ev.type) {
      case "delta":
        r.text += ev.text;
        render();
        break;
      case "tool_status":
        r.progress = ev.summary;
        render();
        break;
      case "assistant":
        if (ev.message.role === "assistant" && ev.message.content.trim()) r.text = ev.message.content;
        break;
      case "error":
        r.status = "error";
        r.error = ev.text;
        break;
      case "notice":
        if (ev.text === "aborted") {
          r.status = "error";
          r.error = t("stop");
        }
        break;
      case "done":
        if (r.status === "running") {
          r.status = "done";
          r.parsed = parseJson(r.text);
        }
        state.running = void 0;
        render();
        if (action === "studio_magic_fill" && r.status === "done" && r.parsed) void applyMagicFill(r.parsed);
        break;
    }
  }
  async function applyMagicFill(p) {
    if (typeof p.title === "string" && p.title.trim()) await insert("title", p.title.trim());
    if (typeof p.description === "string" && p.description.trim()) await insert("description", p.description.trim());
    if (Array.isArray(p.tags) && p.tags.length) await insert("tags", p.tags.map((x) => String(x)));
    refreshDraft();
  }
  function parseJson(text) {
    const cleaned = text.replace(/```(?:json)?/gi, "");
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return void 0;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return void 0;
    }
  }
  async function onClick(e) {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const val = el.dataset.val ?? "";
    switch (el.dataset.act) {
      case "collapse":
        collapsed = !collapsed;
        chrome.storage.local.set({ studioCollapsed: collapsed }).catch(() => void 0);
        render();
        break;
      case "chat":
        chrome.runtime.sendMessage({ type: "openSidePanel" }).catch(() => void 0);
        break;
      case "settings":
        chrome.runtime.openOptionsPage();
        break;
      case "check":
        checkKeyword();
        break;
      case "comptags":
        loadCompetitorTags();
        break;
      case "addfreq":
        await insert("tags", (state.compTags ?? []).filter((x) => x.n >= 2).map((x) => x.tag));
        refreshDraft();
        break;
      case "addtag":
        await insert("tags", [val]);
        refreshDraft();
        break;
      case "addtags":
        await insert("tags", JSON.parse(val));
        refreshDraft();
        break;
      case "insert": {
        const field = el.dataset.field;
        const mode = el.dataset.mode ?? "replace";
        const value = field === "description" ? state.ai.studio_description?.parsed?.description ?? "" : val;
        await insert(field, value, mode);
        break;
      }
      case "toggleTitle":
        state.showTitleChecks = !state.showTitleChecks;
        render();
        break;
      case "toggleSeo":
        state.showSeoChecks = !state.showSeoChecks;
        render();
        break;
      case "ai":
        if (val === "studio_thumbnail") void runThumbnailReview();
        else runAi(val);
        break;
      case "tpl-apply": {
        const idx = Number(root?.querySelector("#tpl")?.value ?? "");
        const tpl = settings.tagTemplates?.[idx];
        if (tpl) {
          await insert("tags", tpl.tags);
          refreshDraft();
        }
        break;
      }
      case "tpl-save": {
        const name = window.prompt(t("tpl_name"), state.focusKeyword || "")?.trim();
        if (!name) break;
        const list = (settings.tagTemplates ?? []).filter((x) => x.name !== name);
        list.push({ name, tags: [...state.draft.tags] });
        settings = { ...settings, tagTemplates: list };
        await saveSettings(settings);
        render();
        break;
      }
      case "tpl-del": {
        const idx = Number(root?.querySelector("#tpl")?.value ?? "");
        if (!Number.isFinite(idx) || !settings.tagTemplates?.[idx]) break;
        const list = settings.tagTemplates.filter((_x, i) => i !== idx);
        settings = { ...settings, tagTemplates: list };
        await saveSettings(settings);
        render();
        break;
      }
      case "stop":
        port?.postMessage({ type: "abort" });
        break;
    }
  }
  var lastDraftKey = "";
  function refreshDraft() {
    const d = readDraft();
    if (!d) {
      if (host?.isConnected) host.remove();
      return;
    }
    if (!host?.isConnected) mount();
    const key = JSON.stringify(d);
    if (key === lastDraftKey) return;
    lastDraftKey = key;
    state.draft = d;
    if (!state.focusEdited) state.focusKeyword = guessFocusKeyword(d.title);
    if (!kwInputFocused) render();
  }
  function mount() {
    if (!host) {
      host = document.createElement("div");
      host.id = "nubit-studio-host";
      const shadow = host.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = studio_default;
      shadow.appendChild(style);
      root = document.createElement("div");
      shadow.appendChild(root);
      root.addEventListener("click", (e) => void onClick(e));
    }
    document.body.appendChild(host);
    render();
  }
  async function init() {
    settings = await loadSettings();
    lang2 = settings.language;
    setLang(lang2);
    collapsed = !!(await chrome.storage.local.get("studioCollapsed")).studioCollapsed;
    onSettingsChanged((s) => {
      settings = s;
      lang2 = s.language;
      setLang(lang2);
      render();
    });
    document.addEventListener("input", () => setTimeout(refreshDraft, 50), true);
    setInterval(refreshDraft, 1200);
    refreshDraft();
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg.type === "getPageContext") {
        const d = readDraft();
        const ctx = { kind: "studio", url: location.href, title: document.title, capturedAt: (/* @__PURE__ */ new Date()).toISOString() };
        if (d) {
          ctx.draft = {
            ...d,
            focusKeyword: state.focusKeyword || guessFocusKeyword(d.title) || void 0,
            titleScore: titleScore(d.title, state.focusKeyword, lang2).score,
            seoScore: seoScore({ videoId: "draft", url: "", title: d.title, description: d.description, tags: d.tags }, lang2).score
          };
        }
        sendResponse(ctx);
        return true;
      }
      if (msg.type === "studioInsert") {
        insert(msg.field, msg.value, msg.mode ?? "replace").then((ok) => sendResponse({ ok }), (err) => sendResponse({ error: String(err) }));
        return true;
      }
      return void 0;
    });
  }
  init().catch((err) => console.error("[Nubit] studio init failed", err));
})();
