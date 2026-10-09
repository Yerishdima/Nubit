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
  var ANTHROPIC_MODELS = [
    { id: "claude-opus-5-5", label: "Claude Opus 5.5 (recommended)" },
    { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (faster, cheaper)" },
    { id: "claude-haiku-5-5", label: "Claude Haiku 5.5 (cheapest)" },
    { id: "claude-fable-5-1", label: "Claude Fable 5.1 (most capable, slow)" }
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
    const names = new Set(merged.localTools.map((t) => t.name));
    for (const t of DEFAULT_LOCAL_TOOLS) if (!names.has(t.name)) merged.localTools.push({ ...t });
    return merged;
  }
  async function saveSettings(settings2) {
    await chrome.storage.local.set({ [KEY]: settings2 });
  }

  // src/shared/markdown.ts
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // src/options/index.ts
  var $ = (id) => document.getElementById(id);
  var val = (id) => ($(id).value ?? "").trim();
  var settings;
  var localTools = [];
  var customApis = [];
  var TEXT = {
    subtitle: { ru: "\u0418\u0418-\u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A YouTube. \u0420\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043D\u0430 \u0432\u0430\u0448\u0438\u0445 \u043A\u043B\u044E\u0447\u0430\u0445 API.", en: "AI YouTube analyst. Runs on your own API keys." },
    "lbl-language": { ru: "\u042F\u0437\u044B\u043A", en: "Language" },
    "h-ai": { ru: "\u0418\u0418-\u043C\u043E\u0434\u0435\u043B\u044C", en: "AI model" },
    "lbl-provider": { ru: "\u041F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440", en: "Provider" },
    "lbl-model-a": { ru: "\u041C\u043E\u0434\u0435\u043B\u044C", en: "Model" },
    "lbl-model-o": { ru: "\u041C\u043E\u0434\u0435\u043B\u044C", en: "Model" },
    "lbl-model-g": { ru: "\u041C\u043E\u0434\u0435\u043B\u044C", en: "Model" },
    "lbl-model-l": { ru: "\u041C\u043E\u0434\u0435\u043B\u044C", en: "Model" },
    "hint-anthropic": {
      ru: "\u041A\u043B\u044E\u0447 \u0441\u043E\u0437\u0434\u0430\u0451\u0442\u0441\u044F \u043D\u0430 console.anthropic.com \u2192 API Keys. \u041A\u043B\u044E\u0447 \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0432 \u044D\u0442\u043E\u043C \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435 \u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0432 api.anthropic.com.",
      en: "Create a key at console.anthropic.com \u2192 API Keys. It is stored only in this browser and sent only to api.anthropic.com."
    },
    "hint-ollama": {
      ru: "Ollama \u0434\u043E\u043B\u0436\u043D\u0430 \u0431\u044B\u0442\u044C \u0437\u0430\u043F\u0443\u0449\u0435\u043D\u0430 \u0441 \u0440\u0430\u0437\u0440\u0435\u0448\u0451\u043D\u043D\u044B\u043C origin \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u044F: OLLAMA_ORIGINS=chrome-extension://* ollama serve",
      en: "Ollama must allow the extension origin: OLLAMA_ORIGINS=chrome-extension://* ollama serve"
    },
    "lbl-effort": { ru: "\u0413\u043B\u0443\u0431\u0438\u043D\u0430 \u0440\u0430\u0441\u0441\u0443\u0436\u0434\u0435\u043D\u0438\u0439", en: "Reasoning effort" },
    "hint-effort": {
      ru: "\u0414\u043B\u044F Claude: low \u2014 \u0431\u044B\u0441\u0442\u0440\u043E \u0438 \u0434\u0451\u0448\u0435\u0432\u043E, medium \u2014 \u0431\u0430\u043B\u0430\u043D\u0441, high/xhigh \u2014 \u0433\u043B\u0443\u0431\u043E\u043A\u0438\u0439 \u0430\u043D\u0430\u043B\u0438\u0437 (\u0434\u043E\u0440\u043E\u0436\u0435 \u0438 \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u0435\u0435).",
      en: "For Claude: low \u2014 fast and cheap, medium \u2014 balanced, high/xhigh \u2014 deep analysis (slower, pricier)."
    },
    "test-provider": { ru: "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435", en: "Test connection" },
    "h-yt": { ru: "YouTube Data API (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)", en: "YouTube Data API (optional)" },
    "hint-yt": {
      ru: "\u0411\u0435\u0437 \u043A\u043B\u044E\u0447\u0430 \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435 \u0447\u0438\u0442\u0430\u0435\u0442 \u043F\u0443\u0431\u043B\u0438\u0447\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0441\u043E \u0441\u0442\u0440\u0430\u043D\u0438\u0446 YouTube. \u0421 \u043A\u043B\u044E\u0447\u043E\u043C \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u0442\u043E\u0447\u043D\u0430\u044F \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430, \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0438 \u0438 \u043F\u043E\u0438\u0441\u043A \u0447\u0435\u0440\u0435\u0437 API (10 000 \u0435\u0434\u0438\u043D\u0438\u0446 \u043A\u0432\u043E\u0442\u044B \u0432 \u0434\u0435\u043D\u044C \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E). \u041A\u043B\u044E\u0447: console.cloud.google.com \u2192 APIs & Services \u2192 Credentials \u2192 API key, \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \xABYouTube Data API v3\xBB.",
      en: 'Without a key the extension reads public data from YouTube pages. With a key you get exact statistics, comments and API search (10,000 free quota units/day). Key: console.cloud.google.com \u2192 APIs & Services \u2192 Credentials \u2192 API key, enable "YouTube Data API v3".'
    },
    "h-display": { ru: "\u041E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u043D\u0430 YouTube", en: "Display on YouTube" },
    "lbl-overlay": { ru: "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0438 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u0432\u0438\u0434\u0435\u043E", en: "Analytics card on the video page" },
    "lbl-badges": { ru: "\u0417\u043D\u0430\u0447\u043A\u0438 \xAB\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u043E\u0432 \u0432 \u0447\u0430\u0441\xBB \u043D\u0430 \u043F\u0440\u0435\u0432\u044C\u044E", en: '"Views per hour" badges on thumbnails' },
    "lbl-outliers": { ru: "\u0421\u0447\u0438\u0442\u0430\u0442\u044C outlier (\u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 \u0441 \u043A\u0430\u043D\u0430\u043B\u043E\u043C) \u2014 \u0434\u0435\u043B\u0430\u0435\u0442 \u0434\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0437\u0430\u043F\u0440\u043E\u0441\u044B \u043A YouTube", en: "Compute outliers (vs channel) \u2014 makes extra YouTube requests" },
    "h-local": { ru: "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A \u0438 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B \u043D\u0430 \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0435", en: "Local helper and programs on this computer" },
    "hint-local": {
      ru: "\u0427\u0442\u043E\u0431\u044B \u0418\u0418 \u043C\u043E\u0433 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0442\u044C yt-dlp, ffmpeg \u0438 \u0434\u0440\u0443\u0433\u0438\u0435 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B, \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0435 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A: \u043F\u0430\u043F\u043A\u0430 native-host \u2192 install.bat (\u043D\u0443\u0436\u0435\u043D Node.js). \u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043D\u0438\u0436\u0435, \u0433\u0434\u0435 \u043B\u0435\u0436\u0430\u0442 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B.",
      en: "To let the AI run yt-dlp, ffmpeg and other programs, install the local helper: folder native-host \u2192 install.bat (requires Node.js). Then point to the programs below."
    },
    "native-ping": { ru: "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A", en: "Check helper" },
    "lbl-extid": { ru: "ID \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u044F (\u043D\u0443\u0436\u0435\u043D \u043F\u0440\u0438 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0435 \u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A\u0430):", en: "Extension ID (needed by the installer):" },
    "copy-extid": { ru: "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C", en: "Copy" },
    "th-name": { ru: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", en: "Name" },
    "th-path": { ru: "\u041F\u0443\u0442\u044C \u043A \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0435", en: "Path to executable" },
    "th-desc": { ru: "\u0427\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 (\u0434\u043B\u044F \u0418\u0418)", en: "What it does (for the AI)" },
    "add-tool": { ru: "+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0443", en: "+ Add program" },
    "h-apis": { ru: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 API", en: "Custom APIs" },
    "hint-apis": {
      ru: "\u041B\u044E\u0431\u043E\u0439 HTTP API (\u0441\u0435\u0440\u0432\u0438\u0441 \u043A\u043B\u044E\u0447\u0435\u0432\u044B\u0445 \u0441\u043B\u043E\u0432, \u0432\u0430\u0448\u0430 \u0431\u0430\u0437\u0430, \u0438 \u0442. \u043F.). \u0418\u0418 \u0441\u043C\u043E\u0436\u0435\u0442 \u0432\u044B\u0437\u044B\u0432\u0430\u0442\u044C \u0435\u0433\u043E \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u043E\u043C call_custom_api. \u041E\u043F\u0438\u0448\u0438\u0442\u0435, \u0447\u0442\u043E \u0443\u043C\u0435\u0435\u0442 API \u0438 \u043A\u0430\u043A\u0438\u0435 \u0443 \u043D\u0435\u0433\u043E \u043F\u0443\u0442\u0438 \u2014 \u044D\u0442\u043E \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0447\u0438\u0442\u0430\u0435\u0442 \u043C\u043E\u0434\u0435\u043B\u044C.",
      en: "Any HTTP API (keyword service, your own backend, \u2026). The AI can call it through call_custom_api. Describe what the API does and its paths \u2014 the model reads this description."
    },
    "add-api": { ru: "+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C API", en: "+ Add API" },
    save: { ru: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C", en: "Save" }
  };
  function applyTexts(lang2) {
    for (const [id, v] of Object.entries(TEXT)) {
      const el = document.getElementById(id);
      if (el) el.textContent = v[lang2];
    }
    document.documentElement.lang = lang2;
    renderTools(lang2);
    renderApis(lang2);
  }
  function lang() {
    return $("language").value || "ru";
  }
  function tr(ru, en) {
    return lang() === "ru" ? ru : en;
  }
  function showProvider() {
    const p = $("provider").value;
    document.querySelectorAll(".prov").forEach((el) => el.classList.toggle("active", el.dataset.prov === p));
  }
  function fill() {
    $("language").value = settings.language;
    $("provider").value = settings.provider;
    const sel = $("anthropicModel");
    sel.innerHTML = "";
    const known = ANTHROPIC_MODELS.some((m) => m.id === settings.anthropicModel);
    for (const m of ANTHROPIC_MODELS) sel.add(new Option(m.label, m.id));
    if (!known && settings.anthropicModel) sel.add(new Option(settings.anthropicModel, settings.anthropicModel));
    sel.value = settings.anthropicModel;
    for (const id of ["anthropicApiKey", "openaiApiKey", "openaiModel", "openaiBaseUrl", "geminiApiKey", "geminiModel", "ollamaBaseUrl", "ollamaModel", "youtubeApiKey"]) {
      $(id).value = settings[id];
    }
    $("effort").value = settings.effort;
    for (const id of ["showOverlay", "showBadges", "computeOutliers"]) $(id).checked = settings[id];
    localTools = settings.localTools.map((t) => ({ ...t }));
    customApis = settings.customApis.map((a) => ({ ...a, headers: { ...a.headers } }));
    $("ext-id").textContent = chrome.runtime.id;
    showProvider();
    applyTexts(settings.language);
  }
  function renderTools(l) {
    const tbody = $("local-tools").querySelector("tbody");
    tbody.innerHTML = "";
    localTools.forEach((tool, i) => {
      const tr2 = document.createElement("tr");
      tr2.innerHTML = `
      <td><input data-f="name" value="${escapeHtml(tool.name)}" /></td>
      <td><input data-f="path" value="${escapeHtml(tool.path)}" placeholder="C:\\Tools\\${escapeHtml(tool.name || "program")}.exe" /> <button class="btn small" data-find="${i}">${l === "ru" ? "\u041D\u0430\u0439\u0442\u0438" : "Find"}</button></td>
      <td><input data-f="description" value="${escapeHtml(tool.description)}" /></td>
      <td><button class="btn small danger" data-del="${i}">\u2715</button></td>`;
      tr2.querySelectorAll("input[data-f]").forEach((inp) => {
        inp.addEventListener("input", () => {
          localTools[i][inp.dataset.f] = inp.value;
        });
      });
      tr2.querySelector("[data-del]").addEventListener("click", () => {
        localTools.splice(i, 1);
        renderTools(l);
      });
      tr2.querySelector("[data-find]").addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        const res = await chrome.runtime.sendMessage({ type: "nativeWhich", name: localTools[i].name }).catch((err) => ({ error: String(err) }));
        btn.disabled = false;
        if ("error" in res) alert(res.error);
        else if (res.path) {
          localTools[i].path = res.path;
          renderTools(l);
        } else alert(l === "ru" ? "\u041D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0432 PATH. \u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043F\u0443\u0442\u044C \u0432\u0440\u0443\u0447\u043D\u0443\u044E." : "Not found in PATH. Enter the path manually.");
      });
      tbody.appendChild(tr2);
    });
  }
  function renderApis(l) {
    const root = $("custom-apis");
    root.innerHTML = "";
    customApis.forEach((api, i) => {
      const div = document.createElement("div");
      div.className = "api";
      const headersText = Object.entries(api.headers).map(([k, v]) => `${k}: ${v}`).join("\n");
      div.innerHTML = `
      <div class="api-head"><strong>${escapeHtml(api.name || (l === "ru" ? "\u041D\u043E\u0432\u044B\u0439 API" : "New API"))}</strong>
        <button class="btn small" data-grant="${i}">${l === "ru" ? "\u0420\u0430\u0437\u0440\u0435\u0448\u0438\u0442\u044C \u0434\u043E\u0441\u0442\u0443\u043F" : "Grant access"}</button>
        <span class="result" data-grant-result="${i}"></span>
        <button class="btn small danger" data-del="${i}">\u2715</button></div>
      <div class="row"><label>${l === "ru" ? "\u0418\u043C\u044F (\u043B\u0430\u0442\u0438\u043D\u0438\u0446\u0435\u0439)" : "Name (latin)"}</label><input data-f="name" value="${escapeHtml(api.name)}" placeholder="keywordtool" /></div>
      <div class="row"><label>Base URL</label><input data-f="baseUrl" value="${escapeHtml(api.baseUrl)}" placeholder="https://api.example.com" /></div>
      <div class="row"><label>${l === "ru" ? "\u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0438 (\u043F\u043E \u043E\u0434\u043D\u043E\u043C\u0443 \u0432 \u0441\u0442\u0440\u043E\u043A\u0435)" : "Headers (one per line)"}</label><textarea data-f="headers" placeholder="Authorization: Bearer \u2026">${escapeHtml(headersText)}</textarea></div>
      <div class="row"><label>${l === "ru" ? "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0434\u043B\u044F \u0418\u0418" : "Description for the AI"}</label><textarea data-f="description" placeholder="${l === "ru" ? "\u0427\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 API, \u043A\u0430\u043A\u0438\u0435 \u043F\u0443\u0442\u0438 \u0438 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B: GET /v1/search?q=\u2026 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u2026" : "What the API does, paths and params: GET /v1/search?q=\u2026 returns \u2026"}">${escapeHtml(api.description)}</textarea></div>`;
      div.querySelectorAll("[data-f]").forEach((inp) => {
        inp.addEventListener("input", () => {
          const f = inp.dataset.f;
          if (f === "headers") {
            const h = {};
            for (const line of inp.value.split("\n")) {
              const idx = line.indexOf(":");
              if (idx > 0) h[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
            }
            customApis[i].headers = h;
          } else customApis[i][f] = inp.value;
          if (f === "name") div.querySelector("strong").textContent = inp.value || (l === "ru" ? "\u041D\u043E\u0432\u044B\u0439 API" : "New API");
        });
      });
      div.querySelector("[data-del]").addEventListener("click", () => {
        customApis.splice(i, 1);
        renderApis(l);
      });
      div.querySelector("[data-grant]").addEventListener("click", async () => {
        const out = div.querySelector("[data-grant-result]");
        try {
          const u = new URL(customApis[i].baseUrl);
          const ok = await chrome.permissions.request({ origins: [`${u.protocol}//${u.host}/*`] });
          out.textContent = ok ? l === "ru" ? "\u0434\u043E\u0441\u0442\u0443\u043F \u0440\u0430\u0437\u0440\u0435\u0448\u0451\u043D" : "access granted" : l === "ru" ? "\u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u043E" : "denied";
          out.className = `result ${ok ? "ok" : "bad"}`;
        } catch (err) {
          out.textContent = String(err instanceof Error ? err.message : err);
          out.className = "result bad";
        }
      });
      root.appendChild(div);
    });
  }
  function collect() {
    return {
      ...DEFAULT_SETTINGS,
      language: lang(),
      provider: $("provider").value,
      anthropicApiKey: val("anthropicApiKey"),
      anthropicModel: val("anthropicModel") || DEFAULT_SETTINGS.anthropicModel,
      openaiApiKey: val("openaiApiKey"),
      openaiModel: val("openaiModel") || DEFAULT_SETTINGS.openaiModel,
      openaiBaseUrl: val("openaiBaseUrl") || DEFAULT_SETTINGS.openaiBaseUrl,
      geminiApiKey: val("geminiApiKey"),
      geminiModel: val("geminiModel") || DEFAULT_SETTINGS.geminiModel,
      ollamaBaseUrl: val("ollamaBaseUrl") || DEFAULT_SETTINGS.ollamaBaseUrl,
      ollamaModel: val("ollamaModel") || DEFAULT_SETTINGS.ollamaModel,
      effort: $("effort").value,
      youtubeApiKey: val("youtubeApiKey"),
      showOverlay: $("showOverlay").checked,
      showBadges: $("showBadges").checked,
      computeOutliers: $("computeOutliers").checked,
      localTools: localTools.map((t) => ({ name: t.name.trim(), path: t.path.trim(), description: t.description.trim() })).filter((t) => t.name),
      customApis: customApis.map((a) => ({ ...a, id: a.id || `api_${Date.now()}`, name: a.name.trim().replace(/\s+/g, "_"), baseUrl: a.baseUrl.trim(), description: a.description.trim() })).filter((a) => a.name || a.baseUrl),
      nativeHostName: settings.nativeHostName || DEFAULT_SETTINGS.nativeHostName
    };
  }
  async function save() {
    settings = collect();
    await saveSettings(settings);
    const out = $("save-result");
    out.textContent = tr("\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E", "Saved");
    out.className = "result ok";
    setTimeout(() => out.textContent = "", 2e3);
  }
  async function main() {
    settings = await loadSettings();
    fill();
    $("provider").addEventListener("change", showProvider);
    $("language").addEventListener("change", () => applyTexts(lang()));
    $("save").addEventListener("click", save);
    $("add-tool").addEventListener("click", () => {
      localTools.push({ name: "", path: "", description: "" });
      renderTools(lang());
    });
    $("add-api").addEventListener("click", () => {
      customApis.push({ id: `api_${Date.now()}`, name: "", description: "", baseUrl: "", headers: {} });
      renderApis(lang());
    });
    $("copy-extid").addEventListener("click", () => navigator.clipboard.writeText(chrome.runtime.id));
    $("test-provider").addEventListener("click", async () => {
      const out = $("test-provider-result");
      out.textContent = tr("\u041F\u0440\u043E\u0432\u0435\u0440\u044F\u044E\u2026", "Testing\u2026");
      out.className = "result";
      await save();
      const res = await chrome.runtime.sendMessage({ type: "testProvider" }).catch((err) => ({ ok: false, message: String(err) }));
      out.textContent = res.message;
      out.className = `result ${res.ok ? "ok" : "bad"}`;
    });
    $("native-ping").addEventListener("click", async () => {
      const out = $("native-result");
      out.textContent = tr("\u041F\u0440\u043E\u0432\u0435\u0440\u044F\u044E\u2026", "Checking\u2026");
      out.className = "result";
      const res = await chrome.runtime.sendMessage({ type: "nativePing" }).catch((err) => ({ error: String(err) }));
      if ("error" in res) {
        out.textContent = res.error;
        out.className = "result bad";
      } else {
        out.textContent = tr(`\u041F\u043E\u043C\u043E\u0449\u043D\u0438\u043A \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 (v${res.version}, Node ${res.node}, ${res.platform})`, `Helper is running (v${res.version}, Node ${res.node}, ${res.platform})`);
        out.className = "result ok";
      }
    });
  }
  main().catch((err) => alert(String(err)));
})();
