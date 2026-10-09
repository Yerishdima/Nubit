// Options page: API keys, models, display toggles, local tools (native host) and custom APIs.
import type { CustomApi, Lang, LocalTool, RuntimeMessage, Settings } from '../shared/types.ts';
import { ANTHROPIC_MODELS, DEFAULT_SETTINGS, loadSettings, saveSettings } from '../shared/settings.ts';
import { escapeHtml } from '../shared/markdown.ts';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const val = (id: string) => ($<HTMLInputElement>(id).value ?? '').trim();

let settings: Settings;
let localTools: LocalTool[] = [];
let customApis: CustomApi[] = [];

const TEXT: Record<string, Record<Lang, string>> = {
  subtitle: { ru: 'ИИ-аналитик YouTube. Работает на ваших ключах API.', en: 'AI YouTube analyst. Runs on your own API keys.' },
  'lbl-language': { ru: 'Язык', en: 'Language' },
  'h-ai': { ru: 'ИИ-модель', en: 'AI model' },
  'lbl-provider': { ru: 'Провайдер', en: 'Provider' },
  'lbl-model-a': { ru: 'Модель', en: 'Model' },
  'lbl-model-o': { ru: 'Модель', en: 'Model' },
  'lbl-model-g': { ru: 'Модель', en: 'Model' },
  'lbl-model-l': { ru: 'Модель', en: 'Model' },
  'hint-anthropic': {
    ru: 'Ключ создаётся на console.anthropic.com → API Keys. Ключ хранится только в этом браузере и отправляется только в api.anthropic.com.',
    en: 'Create a key at console.anthropic.com → API Keys. It is stored only in this browser and sent only to api.anthropic.com.',
  },
  'hint-ollama': {
    ru: 'Ollama должна быть запущена с разрешённым origin расширения: OLLAMA_ORIGINS=chrome-extension://* ollama serve',
    en: 'Ollama must allow the extension origin: OLLAMA_ORIGINS=chrome-extension://* ollama serve',
  },
  'lbl-effort': { ru: 'Глубина рассуждений', en: 'Reasoning effort' },
  'hint-effort': {
    ru: 'Для Claude: low — быстро и дёшево, medium — баланс, high/xhigh — глубокий анализ (дороже и медленнее).',
    en: 'For Claude: low — fast and cheap, medium — balanced, high/xhigh — deep analysis (slower, pricier).',
  },
  'test-provider': { ru: 'Проверить подключение', en: 'Test connection' },
  'h-yt': { ru: 'YouTube Data API (необязательно)', en: 'YouTube Data API (optional)' },
  'hint-yt': {
    ru: 'Без ключа расширение читает публичные данные со страниц YouTube. С ключом доступны точная статистика, комментарии и поиск через API (10 000 единиц квоты в день бесплатно). Ключ: console.cloud.google.com → APIs & Services → Credentials → API key, включите «YouTube Data API v3».',
    en: 'Without a key the extension reads public data from YouTube pages. With a key you get exact statistics, comments and API search (10,000 free quota units/day). Key: console.cloud.google.com → APIs & Services → Credentials → API key, enable "YouTube Data API v3".',
  },
  'h-display': { ru: 'Отображение на YouTube', en: 'Display on YouTube' },
  'lbl-overlay': { ru: 'Карточка аналитики на странице видео', en: 'Analytics card on the video page' },
  'lbl-badges': { ru: 'Значки «просмотров в час» на превью', en: '"Views per hour" badges on thumbnails' },
  'lbl-outliers': { ru: 'Считать outlier (сравнение с каналом) — делает дополнительные запросы к YouTube', en: 'Compute outliers (vs channel) — makes extra YouTube requests' },
  'h-local': { ru: 'Локальный помощник и программы на компьютере', en: 'Local helper and programs on this computer' },
  'hint-local': {
    ru: 'Чтобы ИИ мог запускать yt-dlp, ffmpeg и другие программы, установите локальный помощник: папка native-host → install.bat (нужен Node.js). Укажите ниже, где лежат программы.',
    en: 'To let the AI run yt-dlp, ffmpeg and other programs, install the local helper: folder native-host → install.bat (requires Node.js). Then point to the programs below.',
  },
  'native-ping': { ru: 'Проверить помощник', en: 'Check helper' },
  'lbl-extid': { ru: 'ID расширения (нужен при установке помощника):', en: 'Extension ID (needed by the installer):' },
  'copy-extid': { ru: 'Копировать', en: 'Copy' },
  'th-name': { ru: 'Название', en: 'Name' },
  'th-path': { ru: 'Путь к программе', en: 'Path to executable' },
  'th-desc': { ru: 'Что делает (для ИИ)', en: 'What it does (for the AI)' },
  'add-tool': { ru: '+ Добавить программу', en: '+ Add program' },
  'h-apis': { ru: 'Дополнительные API', en: 'Custom APIs' },
  'hint-apis': {
    ru: 'Любой HTTP API (сервис ключевых слов, ваша база, и т. п.). ИИ сможет вызывать его инструментом call_custom_api. Опишите, что умеет API и какие у него пути — это описание читает модель.',
    en: 'Any HTTP API (keyword service, your own backend, …). The AI can call it through call_custom_api. Describe what the API does and its paths — the model reads this description.',
  },
  'add-api': { ru: '+ Добавить API', en: '+ Add API' },
  save: { ru: 'Сохранить', en: 'Save' },
};

function applyTexts(lang: Lang): void {
  for (const [id, v] of Object.entries(TEXT)) {
    const el = document.getElementById(id);
    if (el) el.textContent = v[lang];
  }
  document.documentElement.lang = lang;
  renderTools(lang);
  renderApis(lang);
}

function lang(): Lang {
  return ($<HTMLSelectElement>('language').value as Lang) || 'ru';
}

function tr(ru: string, en: string): string {
  return lang() === 'ru' ? ru : en;
}

function showProvider(): void {
  const p = $<HTMLSelectElement>('provider').value;
  document.querySelectorAll<HTMLElement>('.prov').forEach((el) => el.classList.toggle('active', el.dataset.prov === p));
}

function fill(): void {
  $<HTMLSelectElement>('language').value = settings.language;
  $<HTMLSelectElement>('provider').value = settings.provider;
  const sel = $<HTMLSelectElement>('anthropicModel');
  sel.innerHTML = '';
  const known = ANTHROPIC_MODELS.some((m) => m.id === settings.anthropicModel);
  for (const m of ANTHROPIC_MODELS) sel.add(new Option(m.label, m.id));
  if (!known && settings.anthropicModel) sel.add(new Option(settings.anthropicModel, settings.anthropicModel));
  sel.value = settings.anthropicModel;
  for (const id of ['anthropicApiKey', 'openaiApiKey', 'openaiModel', 'openaiBaseUrl', 'geminiApiKey', 'geminiModel', 'ollamaBaseUrl', 'ollamaModel', 'youtubeApiKey'] as const) {
    $<HTMLInputElement>(id).value = settings[id];
  }
  $<HTMLSelectElement>('effort').value = settings.effort;
  for (const id of ['showOverlay', 'showBadges', 'computeOutliers'] as const) $<HTMLInputElement>(id).checked = settings[id];
  localTools = settings.localTools.map((t) => ({ ...t }));
  customApis = settings.customApis.map((a) => ({ ...a, headers: { ...a.headers } }));
  $('ext-id').textContent = chrome.runtime.id;
  showProvider();
  applyTexts(settings.language);
}

function renderTools(l: Lang): void {
  const tbody = $('local-tools').querySelector('tbody')!;
  tbody.innerHTML = '';
  localTools.forEach((tool, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input data-f="name" value="${escapeHtml(tool.name)}" /></td>
      <td><input data-f="path" value="${escapeHtml(tool.path)}" placeholder="C:\\Tools\\${escapeHtml(tool.name || 'program')}.exe" /> <button class="btn small" data-find="${i}">${l === 'ru' ? 'Найти' : 'Find'}</button></td>
      <td><input data-f="description" value="${escapeHtml(tool.description)}" /></td>
      <td><button class="btn small danger" data-del="${i}">✕</button></td>`;
    tr.querySelectorAll<HTMLInputElement>('input[data-f]').forEach((inp) => {
      inp.addEventListener('input', () => {
        (localTools[i] as unknown as Record<string, string>)[inp.dataset.f!] = inp.value;
      });
    });
    tr.querySelector<HTMLButtonElement>('[data-del]')!.addEventListener('click', () => {
      localTools.splice(i, 1);
      renderTools(l);
    });
    tr.querySelector<HTMLButtonElement>('[data-find]')!.addEventListener('click', async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      btn.disabled = true;
      const res = (await chrome.runtime.sendMessage({ type: 'nativeWhich', name: localTools[i].name } satisfies RuntimeMessage).catch((err) => ({ error: String(err) }))) as
        | { path: string | null }
        | { error: string };
      btn.disabled = false;
      if ('error' in res) alert(res.error);
      else if (res.path) {
        localTools[i].path = res.path;
        renderTools(l);
      } else alert(l === 'ru' ? 'Не найдено в PATH. Укажите путь вручную.' : 'Not found in PATH. Enter the path manually.');
    });
    tbody.appendChild(tr);
  });
}

function renderApis(l: Lang): void {
  const root = $('custom-apis');
  root.innerHTML = '';
  customApis.forEach((api, i) => {
    const div = document.createElement('div');
    div.className = 'api';
    const headersText = Object.entries(api.headers)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    div.innerHTML = `
      <div class="api-head"><strong>${escapeHtml(api.name || (l === 'ru' ? 'Новый API' : 'New API'))}</strong>
        <button class="btn small" data-grant="${i}">${l === 'ru' ? 'Разрешить доступ' : 'Grant access'}</button>
        <span class="result" data-grant-result="${i}"></span>
        <button class="btn small danger" data-del="${i}">✕</button></div>
      <div class="row"><label>${l === 'ru' ? 'Имя (латиницей)' : 'Name (latin)'}</label><input data-f="name" value="${escapeHtml(api.name)}" placeholder="keywordtool" /></div>
      <div class="row"><label>Base URL</label><input data-f="baseUrl" value="${escapeHtml(api.baseUrl)}" placeholder="https://api.example.com" /></div>
      <div class="row"><label>${l === 'ru' ? 'Заголовки (по одному в строке)' : 'Headers (one per line)'}</label><textarea data-f="headers" placeholder="Authorization: Bearer …">${escapeHtml(headersText)}</textarea></div>
      <div class="row"><label>${l === 'ru' ? 'Описание для ИИ' : 'Description for the AI'}</label><textarea data-f="description" placeholder="${l === 'ru' ? 'Что делает API, какие пути и параметры: GET /v1/search?q=… возвращает …' : 'What the API does, paths and params: GET /v1/search?q=… returns …'}">${escapeHtml(api.description)}</textarea></div>`;
    div.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-f]').forEach((inp) => {
      inp.addEventListener('input', () => {
        const f = inp.dataset.f!;
        if (f === 'headers') {
          const h: Record<string, string> = {};
          for (const line of inp.value.split('\n')) {
            const idx = line.indexOf(':');
            if (idx > 0) h[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
          }
          customApis[i].headers = h;
        } else (customApis[i] as unknown as Record<string, string>)[f] = inp.value;
        if (f === 'name') div.querySelector('strong')!.textContent = inp.value || (l === 'ru' ? 'Новый API' : 'New API');
      });
    });
    div.querySelector<HTMLButtonElement>('[data-del]')!.addEventListener('click', () => {
      customApis.splice(i, 1);
      renderApis(l);
    });
    div.querySelector<HTMLButtonElement>('[data-grant]')!.addEventListener('click', async () => {
      const out = div.querySelector<HTMLElement>('[data-grant-result]')!;
      try {
        const u = new URL(customApis[i].baseUrl);
        const ok = await chrome.permissions.request({ origins: [`${u.protocol}//${u.host}/*`] });
        out.textContent = ok ? (l === 'ru' ? 'доступ разрешён' : 'access granted') : l === 'ru' ? 'отклонено' : 'denied';
        out.className = `result ${ok ? 'ok' : 'bad'}`;
      } catch (err) {
        out.textContent = String(err instanceof Error ? err.message : err);
        out.className = 'result bad';
      }
    });
    root.appendChild(div);
  });
}

function collect(): Settings {
  return {
    ...DEFAULT_SETTINGS,
    language: lang(),
    provider: $<HTMLSelectElement>('provider').value as Settings['provider'],
    anthropicApiKey: val('anthropicApiKey'),
    anthropicModel: val('anthropicModel') || DEFAULT_SETTINGS.anthropicModel,
    openaiApiKey: val('openaiApiKey'),
    openaiModel: val('openaiModel') || DEFAULT_SETTINGS.openaiModel,
    openaiBaseUrl: val('openaiBaseUrl') || DEFAULT_SETTINGS.openaiBaseUrl,
    geminiApiKey: val('geminiApiKey'),
    geminiModel: val('geminiModel') || DEFAULT_SETTINGS.geminiModel,
    ollamaBaseUrl: val('ollamaBaseUrl') || DEFAULT_SETTINGS.ollamaBaseUrl,
    ollamaModel: val('ollamaModel') || DEFAULT_SETTINGS.ollamaModel,
    effort: $<HTMLSelectElement>('effort').value as Settings['effort'],
    youtubeApiKey: val('youtubeApiKey'),
    showOverlay: $<HTMLInputElement>('showOverlay').checked,
    showBadges: $<HTMLInputElement>('showBadges').checked,
    computeOutliers: $<HTMLInputElement>('computeOutliers').checked,
    localTools: localTools.map((t) => ({ name: t.name.trim(), path: t.path.trim(), description: t.description.trim() })).filter((t) => t.name),
    customApis: customApis
      .map((a) => ({ ...a, id: a.id || `api_${Date.now()}`, name: a.name.trim().replace(/\s+/g, '_'), baseUrl: a.baseUrl.trim(), description: a.description.trim() }))
      .filter((a) => a.name || a.baseUrl),
    nativeHostName: settings.nativeHostName || DEFAULT_SETTINGS.nativeHostName,
  };
}

async function save(): Promise<void> {
  settings = collect();
  await saveSettings(settings);
  const out = $('save-result');
  out.textContent = tr('Сохранено', 'Saved');
  out.className = 'result ok';
  setTimeout(() => (out.textContent = ''), 2000);
}

async function main(): Promise<void> {
  settings = await loadSettings();
  fill();
  $('provider').addEventListener('change', showProvider);
  $('language').addEventListener('change', () => applyTexts(lang()));
  $('save').addEventListener('click', save);
  $('add-tool').addEventListener('click', () => {
    localTools.push({ name: '', path: '', description: '' });
    renderTools(lang());
  });
  $('add-api').addEventListener('click', () => {
    customApis.push({ id: `api_${Date.now()}`, name: '', description: '', baseUrl: '', headers: {} });
    renderApis(lang());
  });
  $('copy-extid').addEventListener('click', () => navigator.clipboard.writeText(chrome.runtime.id));
  $('test-provider').addEventListener('click', async () => {
    const out = $('test-provider-result');
    out.textContent = tr('Проверяю…', 'Testing…');
    out.className = 'result';
    await save();
    const res = (await chrome.runtime.sendMessage({ type: 'testProvider' } satisfies RuntimeMessage).catch((err) => ({ ok: false, message: String(err) }))) as { ok: boolean; message: string };
    out.textContent = res.message;
    out.className = `result ${res.ok ? 'ok' : 'bad'}`;
  });
  $('native-ping').addEventListener('click', async () => {
    const out = $('native-result');
    out.textContent = tr('Проверяю…', 'Checking…');
    out.className = 'result';
    const res = (await chrome.runtime.sendMessage({ type: 'nativePing' } satisfies RuntimeMessage).catch((err) => ({ error: String(err) }))) as
      | { ok: boolean; version: string; node: string; platform: string }
      | { error: string };
    if ('error' in res) {
      out.textContent = res.error;
      out.className = 'result bad';
    } else {
      out.textContent = tr(`Помощник работает (v${res.version}, Node ${res.node}, ${res.platform})`, `Helper is running (v${res.version}, Node ${res.node}, ${res.platform})`);
      out.className = 'result ok';
    }
  });
}

main().catch((err) => alert(String(err)));
