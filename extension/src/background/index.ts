// Service worker: message router, chat port handling, native host and YouTube helpers.
import type { ChatMessage, PageContext, PanelEvent, PanelRequest, QuickActionId, RuntimeMessage, Settings } from '../shared/types.ts';
import { loadSettings } from '../shared/settings.ts';
import { YouTube } from './youtube.ts';
import { recordSnapshot } from './store.ts';
import { nativePing, nativeWhich } from './native.ts';
import { runAgent } from './agent.ts';
import { ProviderError, createProvider } from './providers/index.ts';
import { actionPrompt, renderPageContext } from './prompts.ts';
import { keywordReport, videoTags } from './keyword.ts';

const youtube = new YouTube(loadSettings);

chrome.runtime.onInstalled.addListener((details) => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);
  // First install: open the settings so the user can paste a key right away.
  if (details.reason === 'install') chrome.runtime.openOptionsPage().catch(() => undefined);
});

// ---- page context -----------------------------------------------------------

async function getPageContext(tabId: number | null): Promise<PageContext | null> {
  const id = tabId ?? (await activeYouTubeTabId());
  if (id === null) return null;
  try {
    const res = (await chrome.tabs.sendMessage(id, { type: 'getPageContext' } satisfies RuntimeMessage)) as PageContext | null;
    return res ?? null;
  } catch {
    return null; // tab is not a YouTube page or the content script is not loaded yet
  }
}

async function activeYouTubeTabId(): Promise<number | null> {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tab = tabs[0];
  if (tab?.id !== undefined && tab.url && /^https:\/\/(www|studio)\.youtube\.com\//.test(tab.url)) return tab.id;
  return null;
}

function contextSummary(ctx: PageContext | null, s: Settings): string | null {
  if (!ctx) return null;
  const ru = s.language === 'ru';
  switch (ctx.kind) {
    case 'watch':
      return ctx.video ? `${ru ? 'Видео' : 'Video'}: ${ctx.video.title}` : ru ? 'Видео (данные загружаются)' : 'Video (loading data)';
    case 'search':
      return `${ru ? 'Поиск' : 'Search'}: ${ctx.query ?? ''}`;
    case 'channel':
      return `${ru ? 'Канал' : 'Channel'}: ${ctx.channel?.name ?? ctx.channel?.handle ?? ''}`;
    case 'home':
      return ru ? 'Главная YouTube' : 'YouTube home';
    case 'shorts':
      return ru ? 'Shorts' : 'Shorts';
    case 'studio':
      return ctx.draft?.title ? `${ru ? 'Черновик' : 'Draft'}: ${ctx.draft.title}` : ru ? 'YouTube Studio' : 'YouTube Studio';
    default:
      return ctx.title || null;
  }
}

// ---- one-shot messages --------------------------------------------------------

chrome.runtime.onMessage.addListener((msg: RuntimeMessage, sender, sendResponse) => {
  const reply = (p: Promise<unknown>) => {
    p.then(
      (r) => sendResponse(r ?? null),
      (err) => sendResponse({ error: err instanceof Error ? err.message : String(err) }),
    );
    return true;
  };
  switch (msg.type) {
    case 'openSidePanel': {
      const tabId = sender.tab?.id;
      if (tabId === undefined) return;
      return reply(openPanel(tabId, msg.action));
    }
    case 'getChannelStats':
      return reply(youtube.channelStats(msg.channel, 25));
    case 'snapshot':
    case 'getRecentVph':
      return reply(recordSnapshot(msg.videoId, msg.views).then((vph) => ({ vph })));
    case 'getSettings':
      return reply(loadSettings());
    case 'nativePing':
      return reply(loadSettings().then((s) => nativePing(s.nativeHostName)));
    case 'nativeWhich':
      return reply(loadSettings().then((s) => nativeWhich(s.nativeHostName, msg.name)));
    case 'testProvider':
      return reply(testProvider());
    case 'fetchModels':
      return reply(fetchModels(msg.baseUrl, msg.apiKey));
    case 'analyzeKeyword':
      return reply(keywordReport(youtube, msg.query, msg.lang, 20));
    case 'getVideoTags':
      return reply(videoTags(youtube, msg.videoIds));
    case 'fetchImage':
      return reply(fetchImage(msg.url));
    case 'tagRanks':
      return reply(youtube.tagRanks(msg.videoId, msg.tags));
    case 'studioInsert': {
      // Relay from the side panel to the Studio tab's content script.
      return reply(activeYouTubeTabId().then((id) => (id === null ? { error: 'No YouTube Studio tab is active' } : chrome.tabs.sendMessage(id, msg))));
    }
    case 'pageContextSummary':
      return reply(Promise.all([getPageContext(msg.tabId), loadSettings()]).then(([ctx, s]) => ({ summary: contextSummary(ctx, s), kind: ctx?.kind ?? 'other' })));
  }
  return undefined;
});

const pendingActions = new Map<number, QuickActionId>();

async function openPanel(tabId: number, action?: QuickActionId): Promise<void> {
  if (action) pendingActions.set(tabId, action);
  const port = panelPorts.get(tabId);
  if (port && action) {
    pendingActions.delete(tabId);
    port.postMessage({ type: 'run_action', action } satisfies PanelEvent);
  }
  await chrome.sidePanel.open({ tabId });
}

/** Downloads an image (e.g. a Studio thumbnail on i.ytimg.com) and returns it as base64. */
async function fetchImage(url: string): Promise<{ mediaType: string; data: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} loading image`);
  const blob = await res.blob();
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  const mediaType = /^image\/(jpeg|png|webp|gif)$/.test(blob.type) ? blob.type : 'image/jpeg';
  return { mediaType, data: btoa(bin) };
}

/** Lists models of an OpenAI-compatible service (GET {base}/models). */
async function fetchModels(baseUrl: string, apiKey: string): Promise<{ models: string[] }> {
  const base = baseUrl.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//.test(base)) throw new Error('Base URL must start with http(s)://');
  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  let res: Response;
  try {
    res = await fetch(`${base}/models`, { headers });
  } catch (err) {
    throw new Error(`Could not reach ${base}/models (${err instanceof Error ? err.message : String(err)}). Press "Grant access" first.`);
  }
  const text = await res.text();
  if (!res.ok) {
    let msg = text.slice(0, 300);
    try {
      msg = JSON.parse(text)?.error?.message ?? msg;
    } catch {
      /* raw */
    }
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }
  let json: { data?: Array<{ id?: string }>; models?: Array<{ id?: string; name?: string }> } = {};
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('The /models endpoint did not return JSON — check the base URL (it should end with /v1).');
  }
  const list = (json.data ?? json.models ?? []).map((m) => m.id ?? (m as { name?: string }).name ?? '').filter(Boolean);
  return { models: [...new Set(list)].sort() };
}

async function testProvider(): Promise<{ ok: boolean; message: string }> {
  try {
    const s = await loadSettings();
    const provider = createProvider(s);
    const r = await provider.run({
      system: 'You are a connectivity test. Reply with the single word OK.',
      messages: [{ role: 'user', content: 'ping' }],
      tools: [],
      onText: () => undefined,
      signal: new AbortController().signal,
    });
    return { ok: true, message: `${provider.model}: ${r.text.trim().slice(0, 80) || '(empty reply)'}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}

// ---- chat port ---------------------------------------------------------------

const panelPorts = new Map<number, chrome.runtime.Port>();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'chat') return;
  let controller: AbortController | null = null;
  // Content-script ports (the Studio panel) carry their tab; the side panel announces its tab in `hello`.
  let tabId: number | null = port.sender?.tab?.id ?? null;
  const send = (ev: PanelEvent) => {
    try {
      port.postMessage(ev);
    } catch {
      /* panel closed */
    }
  };

  port.onMessage.addListener(async (msg: PanelRequest) => {
    if (msg.type === 'hello') {
      tabId = msg.tabId ?? tabId;
      if (tabId !== null) panelPorts.set(tabId, port);
      const [ctx, s] = await Promise.all([getPageContext(tabId), loadSettings()]);
      send({ type: 'context', summary: contextSummary(ctx, s), kind: ctx?.kind ?? 'other' });
      if (tabId !== null && pendingActions.has(tabId)) {
        const action = pendingActions.get(tabId)!;
        pendingActions.delete(tabId);
        send({ type: 'run_action', action });
      }
      return;
    }
    if (msg.type === 'abort') {
      controller?.abort();
      return;
    }
    if (msg.type === 'send') {
      if (controller) controller.abort();
      controller = new AbortController();
      const signal = controller.signal;
      try {
        const settings = await loadSettings();
        tabId = msg.tabId ?? tabId;
        let content = msg.text.trim();
        let display: string | undefined;
        if (msg.action) {
          content = actionPrompt(msg.action, settings.language) + (content ? `\n\nUser note: ${content}` : '');
          display = msg.text.trim() || undefined;
        }
        if (msg.includeContext) {
          const ctx = await getPageContext(tabId);
          content += `\n\n${renderPageContext(ctx)}`;
          send({ type: 'context', summary: contextSummary(ctx, settings), kind: ctx?.kind ?? 'other' });
        }
        const userMsg: ChatMessage = { role: 'user', content, display: display ?? (msg.action ? actionLabel(msg.action, settings) : undefined), images: msg.images?.length ? msg.images : undefined };
        send({ type: 'user', message: userMsg });
        const history = [...msg.history, userMsg];
        await runAgent({
          settings,
          history,
          ctx: { tabId, youtube, getPageContext },
          signal,
          emit: send,
        });
        send({ type: 'done' });
      } catch (err) {
        if (signal.aborted) send({ type: 'notice', text: 'aborted' });
        else if (err instanceof ProviderError) send({ type: 'error', text: err.message });
        else send({ type: 'error', text: err instanceof Error ? err.message : String(err) });
        send({ type: 'done' });
      } finally {
        controller = null;
      }
    }
  });

  port.onDisconnect.addListener(() => {
    controller?.abort();
    if (tabId !== null && panelPorts.get(tabId) === port) panelPorts.delete(tabId);
  });
});

function actionLabel(action: QuickActionId, s: Settings): string {
  const ru = s.language === 'ru';
  const labels: Record<QuickActionId, [string, string]> = {
    analyze_video: ['Анализ видео', 'Analyze video'],
    why_performing: ['Почему так набирает?', 'Why is it performing?'],
    titles: ['Варианты названий', 'Title ideas'],
    tags_description: ['Теги и описание', 'Tags & description'],
    keyword_research: ['Анализ запроса', 'Keyword research'],
    channel_review: ['Разбор канала', 'Channel review'],
    competitors: ['Конкуренты', 'Competitors'],
    content_ideas: ['Идеи для видео', 'Content ideas'],
    summarize: ['Кратко о чём видео', 'Summarize video'],
    studio_titles: ['Названия для черновика', 'Titles for the draft'],
    studio_description: ['Описание для черновика', 'Description for the draft'],
    studio_tags: ['Теги для черновика', 'Tags for the draft'],
    studio_compare: ['Сравнение названия с конкурентами', 'Title vs competitors'],
    studio_magic_fill: ['Заполнить всё', 'Magic fill'],
    studio_thumbnail: ['Оценка превью', 'Thumbnail review'],
  };
  return labels[action][ru ? 0 : 1];
}
