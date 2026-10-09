// Options page: API keys, models, custom providers, display toggles, local tools (native host) and custom APIs.
import type { CustomApi, CustomProvider, Lang, LocalTool, RuntimeMessage, Settings } from '../shared/types.ts';
import { ANTHROPIC_MODELS, ATLAS_BASE_URL, DEFAULT_SETTINGS, loadSettings, providerReady, saveSettings } from '../shared/settings.ts';
import { escapeHtml } from '../shared/markdown.ts';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const val = (id: string) => ($<HTMLInputElement>(id).value ?? '').trim();

let settings: Settings;
let localTools: LocalTool[] = [];
let customApis: CustomApi[] = [];
let customProviders: CustomProvider[] = [];
const fetchedModels = new Map<string, string[]>();

const ATLAS_PRESET: Omit<CustomProvider, 'id'> = {
  name: 'Atlas API',
  baseUrl: 'https://aiberloga.website/v1',
  apiKey: '',
  model: '',
  protocol: 'responses',
};

const TEXT: Record<string, Record<Lang, string>> = {
  subtitle: { ru: 'ИИ-аналитик YouTube. Работает на ваших ключах API.', en: 'AI YouTube analyst. Runs on your own API keys.' },
  'lbl-language': { ru: 'Язык', en: 'Language' },
  'h-ai': { ru: 'ИИ-модель', en: 'AI model' },
  'step1-title': { ru: 'Шаг 1 из 1: подключите ИИ', en: 'Step 1 of 1: connect an AI' },
  'step1-text': {
    ru: 'Выберите провайдера ниже и вставьте ключ: Claude (console.anthropic.com → API Keys) или Atlas API (ключ из бота в Telegram, модель выберите из списка). Нажмите «Проверить подключение», затем «Сохранить». Всё остальное на этой странице — по желанию. Потом откройте любое видео на YouTube.',
    en: 'Pick a provider below and paste the key: Claude (console.anthropic.com → API Keys) or Atlas API (key from the Telegram bot, then pick a model from the list). Press "Test connection", then "Save". Everything else on this page is optional. Then open any YouTube video.',
  },
  'lbl-provider': { ru: 'Провайдер', en: 'Provider' },
  'lbl-model-a': { ru: 'Модель', en: 'Model' },
  'lbl-model-atlas': { ru: 'Модель', en: 'Model' },
  'atlas-load': { ru: 'Обновить список', en: 'Reload list' },
  'lbl-atlas-protocol': { ru: 'Протокол (авто)', en: 'Protocol (auto)' },
  'hint-atlas': {
    ru: 'Ключ выдаёт бот Atlas в Telegram: API → Пересоздать API key. Вставьте ключ — список моделей загрузится сам. Адрес сервиса уже настроен; если сервис не принимает один протокол, расширение само переключится на другой.',
    en: 'The key comes from the Atlas Telegram bot: API → Recreate API key. Paste it and the model list loads automatically. The service address is preconfigured; if one protocol is rejected, the extension switches to the other by itself.',
  },
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
  'hint-custom': {
    ru: 'Любой OpenAI-совместимый сервис (Atlas API, OpenRouter, ProxyAPI и т. п.). Укажите адрес с /v1 и ключ, нажмите «Доступ и модели» — список моделей подтянется автоматически. Протокол: Responses API — как у Codex; Chat Completions — классический. Если один не работает (ошибка 404), переключите на другой.',
    en: 'Any OpenAI-compatible service (Atlas API, OpenRouter, ProxyAPI, …). Enter the base URL ending with /v1 and the key, press "Access & models" to load the model list. Protocol: Responses API (what Codex uses) or Chat Completions; if one fails with 404, switch to the other.',
  },
  'add-provider': { ru: '+ Добавить провайдера', en: '+ Add provider' },
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
  'h-local': { ru: 'Локальный помощник и программы на компьютере (необязательно)', en: 'Local helper and programs on this computer (optional)' },
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
  'h-apis': { ru: 'Дополнительные API для инструментов (необязательно)', en: 'Custom APIs for tools (optional)' },
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
  renderProviderOptions();
  renderProviders(lang);
  renderTools(lang);
  renderApis(lang);
}

function lang(): Lang {
  return ($<HTMLSelectElement>('language').value as Lang) || 'ru';
}

function tr(ru: string, en: string): string {
  return lang() === 'ru' ? ru : en;
}

// ---- provider select ---------------------------------------------------------

function providerSelectValue(): string {
  return $<HTMLSelectElement>('provider').value;
}

function selectedProvider(): { provider: Settings['provider']; customId: string } {
  const v = providerSelectValue();
  if (v.startsWith('custom:')) return { provider: 'custom', customId: v.slice(7) };
  return { provider: v as Settings['provider'], customId: '' };
}

/** Rebuilds the provider dropdown (built-in providers + one entry per custom provider). */
function renderProviderOptions(selected?: string): void {
  const sel = $<HTMLSelectElement>('provider');
  const current = selected ?? sel.value;
  sel.innerHTML = '';
  sel.add(new Option('Claude (Anthropic)', 'anthropic'));
  sel.add(new Option('Atlas API', 'atlas'));
  sel.add(new Option('OpenAI (GPT)', 'openai'));
  sel.add(new Option('Google Gemini', 'gemini'));
  sel.add(new Option('Ollama (local)', 'ollama'));
  for (const p of customProviders) sel.add(new Option(`${p.name || tr('Свой провайдер', 'Custom provider')}${p.model ? ` — ${p.model}` : ''}`, `custom:${p.id}`));
  sel.add(new Option(tr('+ Свой провайдер (OpenAI-совместимый)…', '+ Custom provider (OpenAI-compatible)…'), 'custom:new'));
  sel.value = current && [...sel.options].some((o) => o.value === current) ? current : 'anthropic';
}

function showProvider(): void {
  const { provider, customId } = selectedProvider();
  document.querySelectorAll<HTMLElement>('.prov').forEach((el) => el.classList.toggle('active', el.dataset.prov === provider));
  document.querySelectorAll<HTMLElement>('.cp').forEach((el) => el.classList.toggle('active', el.dataset.id === customId));
}

function onProviderChange(): void {
  if (providerSelectValue() === 'custom:new') {
    addProvider({ name: '', baseUrl: '', apiKey: '', model: '', protocol: 'chat' });
    return;
  }
  showProvider();
}

function addProvider(preset: Omit<CustomProvider, 'id'>): void {
  const p: CustomProvider = { id: `cp_${Date.now()}`, ...preset };
  customProviders.push(p);
  renderProviderOptions(`custom:${p.id}`);
  renderProviders(lang());
  showProvider();
}

function renderProviders(l: Lang): void {
  const root = $('custom-providers');
  root.innerHTML = '';
  const { customId } = selectedProvider();
  customProviders.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = `cp${p.id === customId ? ' active' : ''}`;
    div.dataset.id = p.id;
    const models = fetchedModels.get(p.id) ?? [];
    div.innerHTML = `
      <div class="cp-head"><strong>${escapeHtml(p.name || (l === 'ru' ? 'Свой провайдер' : 'Custom provider'))}</strong>
        <button class="btn small" data-use="${i}">${l === 'ru' ? 'Использовать' : 'Use'}</button>
        <button class="btn small danger" data-del="${i}">✕</button></div>
      <div class="row"><label>${l === 'ru' ? 'Название' : 'Name'}</label><input data-f="name" value="${escapeHtml(p.name)}" placeholder="Atlas API" /></div>
      <div class="row"><label>Base URL</label><input data-f="baseUrl" value="${escapeHtml(p.baseUrl)}" placeholder="https://aiberloga.website/v1" /></div>
      <div class="row"><label>API key</label><input data-f="apiKey" type="password" value="${escapeHtml(p.apiKey)}" autocomplete="off" /></div>
      <div class="row"><label>${l === 'ru' ? 'Протокол' : 'Protocol'}</label>
        <select data-f="protocol">
          <option value="responses" ${p.protocol === 'responses' ? 'selected' : ''}>Responses API (${l === 'ru' ? 'как в Codex' : 'as in Codex'})</option>
          <option value="chat" ${p.protocol === 'chat' ? 'selected' : ''}>Chat Completions</option>
        </select></div>
      <div class="row"><label>${l === 'ru' ? 'Модель' : 'Model'}</label>
        <div class="models">
          <input data-f="model" value="${escapeHtml(p.model)}" placeholder="${l === 'ru' ? 'например gpt-5 или выберите из списка →' : 'e.g. gpt-5 or pick from the list →'}" list="models-${p.id}" />
          <datalist id="models-${p.id}">${models.map((m) => `<option value="${escapeHtml(m)}"></option>`).join('')}</datalist>
          <select data-pick="${i}" ${models.length ? '' : 'hidden'}><option value="">${l === 'ru' ? '— список моделей —' : '— model list —'}</option>${models.map((m) => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('')}</select>
        </div></div>
      <div class="row-actions">
        <button class="btn" data-fetch="${i}">${l === 'ru' ? 'Доступ и модели' : 'Access & models'}</button>
        <span class="result" data-fetch-result="${i}"></span>
      </div>`;
    div.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-f]').forEach((inp) => {
      inp.addEventListener('input', () => {
        (customProviders[i] as unknown as Record<string, string>)[inp.dataset.f!] = inp.value;
        if (inp.dataset.f === 'name' || inp.dataset.f === 'model') {
          div.querySelector('strong')!.textContent = customProviders[i].name || (l === 'ru' ? 'Свой провайдер' : 'Custom provider');
          renderProviderOptions();
        }
      });
    });
    div.querySelector<HTMLSelectElement>('[data-pick]')!.addEventListener('change', (e) => {
      const v = (e.currentTarget as HTMLSelectElement).value;
      if (!v) return;
      customProviders[i].model = v;
      div.querySelector<HTMLInputElement>('input[data-f="model"]')!.value = v;
      renderProviderOptions();
    });
    div.querySelector<HTMLButtonElement>('[data-use]')!.addEventListener('click', () => {
      renderProviderOptions(`custom:${p.id}`);
      showProvider();
    });
    div.querySelector<HTMLButtonElement>('[data-del]')!.addEventListener('click', () => {
      customProviders.splice(i, 1);
      renderProviderOptions(selectedProvider().customId === p.id ? 'anthropic' : undefined);
      renderProviders(l);
      showProvider();
    });
    div.querySelector<HTMLButtonElement>('[data-fetch]')!.addEventListener('click', async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const out = div.querySelector<HTMLElement>('[data-fetch-result]')!;
      const cp = customProviders[i];
      out.className = 'result';
      try {
        const u = new URL(cp.baseUrl.trim());
        btn.disabled = true;
        const granted = await chrome.permissions.request({ origins: [`${u.protocol}//${u.host}/*`] });
        if (!granted) throw new Error(l === 'ru' ? 'доступ к сайту не разрешён' : 'host access was denied');
        out.textContent = l === 'ru' ? 'доступ есть, загружаю модели…' : 'access granted, loading models…';
        const res = (await chrome.runtime.sendMessage({ type: 'fetchModels', baseUrl: cp.baseUrl.trim(), apiKey: cp.apiKey.trim() } satisfies RuntimeMessage)) as
          | { models: string[] }
          | { error: string };
        if ('error' in res) throw new Error(res.error);
        fetchedModels.set(cp.id, res.models);
        if (!cp.model && res.models.length === 1) cp.model = res.models[0];
        out.textContent = l === 'ru' ? `найдено моделей: ${res.models.length}` : `models found: ${res.models.length}`;
        out.className = 'result ok';
        renderProviders(l);
        div.remove();
      } catch (err) {
        out.textContent = err instanceof Error ? err.message : String(err);
        out.className = 'result bad';
      } finally {
        btn.disabled = false;
      }
    });
    root.appendChild(div);
  });
}

// ---- fill / collect ------------------------------------------------------------

function fill(): void {
  $<HTMLSelectElement>('language').value = settings.language;
  customProviders = settings.customProviders.map((p) => ({ ...p }));
  renderProviderOptions(settings.provider === 'custom' ? `custom:${settings.activeCustomProviderId || customProviders[0]?.id || ''}` : settings.provider);
  const sel = $<HTMLSelectElement>('anthropicModel');
  sel.innerHTML = '';
  const known = ANTHROPIC_MODELS.some((m) => m.id === settings.anthropicModel);
  for (const m of ANTHROPIC_MODELS) sel.add(new Option(m.label, m.id));
  if (!known && settings.anthropicModel) sel.add(new Option(settings.anthropicModel, settings.anthropicModel));
  sel.value = settings.anthropicModel;
  for (const id of ['anthropicApiKey', 'atlasApiKey', 'openaiApiKey', 'openaiModel', 'openaiBaseUrl', 'geminiApiKey', 'geminiModel', 'ollamaBaseUrl', 'ollamaModel', 'youtubeApiKey'] as const) {
    $<HTMLInputElement>(id).value = settings[id];
  }
  $<HTMLSelectElement>('atlasProtocol').value = settings.atlasProtocol || 'responses';
  fillAtlasModels(atlasModelsCache, settings.atlasModel);
  $<HTMLSelectElement>('effort').value = settings.effort;
  for (const id of ['showOverlay', 'showBadges', 'computeOutliers'] as const) $<HTMLInputElement>(id).checked = settings[id];
  localTools = settings.localTools.map((t) => ({ ...t }));
  customApis = settings.customApis.map((a) => ({ ...a, headers: { ...a.headers } }));
  $('ext-id').textContent = chrome.runtime.id;
  applyTexts(settings.language);
  showProvider();
  $('step1').classList.toggle('hidden', providerReady(settings));
}

// ---- Atlas: preconfigured provider, model list loads from the service ----

let atlasModelsCache: string[] = [];

function fillAtlasModels(models: string[], selected: string): void {
  const sel = $<HTMLSelectElement>('atlasModel');
  sel.innerHTML = '';
  const list = [...models];
  if (selected && !list.includes(selected)) list.unshift(selected);
  if (!list.length) sel.add(new Option(tr('— вставьте ключ, список загрузится —', '— paste the key to load models —'), ''));
  for (const m of list) sel.add(new Option(m, m));
  sel.value = selected && list.includes(selected) ? selected : list[0] ?? '';
}

async function loadAtlasModels(): Promise<void> {
  const key = val('atlasApiKey');
  const out = $('atlas-status');
  if (!key) {
    out.textContent = tr('Сначала вставьте ключ Atlas.', 'Paste the Atlas key first.');
    out.className = 'hint';
    return;
  }
  out.textContent = tr('Загружаю список моделей…', 'Loading the model list…');
  out.className = 'hint';
  const res = (await chrome.runtime.sendMessage({ type: 'fetchModels', baseUrl: ATLAS_BASE_URL, apiKey: key } satisfies RuntimeMessage).catch((err) => ({ error: String(err) }))) as
    | { models: string[] }
    | { error: string };
  if ('error' in res) {
    out.textContent = tr(`Не удалось получить модели: ${res.error}`, `Could not load models: ${res.error}`);
    out.className = 'hint';
    out.style.color = 'var(--bad)';
    return;
  }
  out.style.color = '';
  atlasModelsCache = res.models;
  await chrome.storage.local.set({ atlasModels: res.models }).catch(() => undefined);
  fillAtlasModels(res.models, val('atlasModel') || settings.atlasModel);
  out.textContent = tr(`Моделей доступно: ${res.models.length}. Выберите одну и нажмите «Сохранить».`, `${res.models.length} models available. Pick one and press "Save".`);
  out.className = 'hint';
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
  const { provider, customId } = selectedProvider();
  return {
    ...DEFAULT_SETTINGS,
    language: lang(),
    provider,
    activeCustomProviderId: customId,
    customProviders: customProviders
      .map((p) => ({ ...p, name: p.name.trim(), baseUrl: p.baseUrl.trim(), apiKey: p.apiKey.trim(), model: p.model.trim() }))
      .filter((p) => p.name || p.baseUrl),
    anthropicApiKey: val('anthropicApiKey'),
    anthropicModel: val('anthropicModel') || DEFAULT_SETTINGS.anthropicModel,
    atlasApiKey: val('atlasApiKey'),
    atlasModel: val('atlasModel'),
    atlasProtocol: ($<HTMLSelectElement>('atlasProtocol').value as Settings['atlasProtocol']) || 'responses',
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
    tagTemplates: settings.tagTemplates ?? [],
  };
}

async function save(): Promise<void> {
  settings = collect();
  await saveSettings(settings);
  $('step1').classList.toggle('hidden', providerReady(settings));
  const out = $('save-result');
  out.textContent = tr('Сохранено', 'Saved');
  out.className = 'result ok';
  setTimeout(() => (out.textContent = ''), 2000);
}

async function main(): Promise<void> {
  settings = await loadSettings();
  atlasModelsCache = ((await chrome.storage.local.get('atlasModels')).atlasModels as string[] | undefined) ?? [];
  fill();
  $('atlas-load').addEventListener('click', loadAtlasModels);
  let atlasTimer: number | undefined;
  $('atlasApiKey').addEventListener('input', () => {
    clearTimeout(atlasTimer);
    atlasTimer = window.setTimeout(() => {
      if (val('atlasApiKey').length >= 8) loadAtlasModels();
    }, 800);
  });
  $('provider').addEventListener('change', () => {
    if (providerSelectValue() === 'atlas' && val('atlasApiKey') && !atlasModelsCache.length) loadAtlasModels();
  });
  $('provider').addEventListener('change', onProviderChange);
  $('language').addEventListener('change', () => applyTexts(lang()));
  $('save').addEventListener('click', save);
  $('add-provider').addEventListener('click', () => addProvider({ name: '', baseUrl: '', apiKey: '', model: '', protocol: 'chat' }));
  $('add-atlas').addEventListener('click', () => addProvider({ ...ATLAS_PRESET }));
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
