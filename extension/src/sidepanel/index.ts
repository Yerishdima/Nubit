// Side panel: chat UI talking to the background over a long-lived port.
import type { ChatMessage, PageKind, PanelEvent, PanelRequest, QuickActionId, RuntimeMessage, Settings } from '../shared/types.ts';
import { loadSettings, onSettingsChanged, providerReady } from '../shared/settings.ts';
import { setLang, t, type I18nKey } from '../shared/i18n.ts';
import { renderMarkdown, escapeHtml } from '../shared/markdown.ts';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const messagesEl = $('messages');
const inputEl = $<HTMLTextAreaElement>('input');
const sendBtn = $<HTMLButtonElement>('send');
const stopBtn = $<HTMLButtonElement>('stop');
const actionsEl = $('actions');
const contextEl = $('context');
const includeCtx = $<HTMLInputElement>('include-context');

let settings: Settings;
let history: ChatMessage[] = [];
let busy = false;
let tabId: number | null = null;
let pageKind: PageKind = 'other';
let port: chrome.runtime.Port | null = null;
let streamEl: HTMLElement | null = null;
let streamText = '';
const toolEls = new Map<string, HTMLElement>();

const ACTIONS: Array<{ id: QuickActionId; key: I18nKey; kinds: PageKind[] }> = [
  { id: 'analyze_video', key: 'act_analyze_video', kinds: ['watch', 'shorts'] },
  { id: 'why_performing', key: 'act_why_performing', kinds: ['watch'] },
  { id: 'titles', key: 'act_titles', kinds: ['watch', 'shorts'] },
  { id: 'tags_description', key: 'act_tags_description', kinds: ['watch'] },
  { id: 'summarize', key: 'act_summarize', kinds: ['watch'] },
  { id: 'competitors', key: 'act_competitors', kinds: ['watch'] },
  { id: 'keyword_research', key: 'act_keyword_research', kinds: ['search'] },
  { id: 'channel_review', key: 'act_channel_review', kinds: ['channel'] },
  { id: 'content_ideas', key: 'act_content_ideas', kinds: ['channel', 'search', 'home', 'watch', 'other', 'shorts', 'studio'] },
  { id: 'titles', key: 'act_titles', kinds: ['studio'] },
  { id: 'tags_description', key: 'act_tags_description', kinds: ['studio'] },
];

async function currentTabId(): Promise<number | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id ?? null;
}

function connect(): void {
  port = chrome.runtime.connect({ name: 'chat' });
  port.onMessage.addListener(onEvent);
  port.onDisconnect.addListener(() => {
    port = null;
    if (busy) finish();
    setTimeout(connect, 500);
  });
  port.postMessage({ type: 'hello', tabId } satisfies PanelRequest);
}

function applyTexts(): void {
  inputEl.placeholder = t('panel_placeholder');
  sendBtn.textContent = t('panel_send');
  stopBtn.textContent = t('panel_stop');
  $('clear').title = t('panel_clear');
  $('settings').title = t('settings');
  $('nokey-text').textContent = t('panel_no_key');
  $('nokey-open').textContent = t('panel_open_settings');
  $('ctx-label').textContent = settings.language === 'ru' ? 'Прикрепить открытую страницу' : 'Attach the open page';
  renderActions();
}

function renderActions(): void {
  actionsEl.innerHTML = '';
  for (const a of ACTIONS.filter((x) => x.kinds.includes(pageKind))) {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = t(a.key);
    b.disabled = busy;
    b.addEventListener('click', () => send(inputEl.value, a.id));
    actionsEl.appendChild(b);
  }
}

function setContext(summary: string | null, kind: PageKind): void {
  pageKind = kind;
  contextEl.textContent = summary ?? t('panel_context_none');
  renderActions();
}

function addEl(cls: string, html?: string): HTMLElement {
  const el = document.createElement('div');
  el.className = cls;
  if (html !== undefined) el.innerHTML = html;
  messagesEl.appendChild(el);
  scrollDown();
  return el;
}

function scrollDown(): void {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderHistory(): void {
  messagesEl.innerHTML = '';
  if (!history.length) addEl('welcome', escapeHtml(t('panel_welcome')));
  for (const m of history) {
    if (m.role === 'user') addEl('msg user', escapeHtml(m.display ?? stripContext(m.content)));
    else if (m.role === 'assistant') {
      if (m.content.trim()) addEl('msg assistant', renderMarkdown(m.content));
    }
  }
}

function stripContext(s: string): string {
  return s.replace(/\n*<page_context>[\s\S]*?<\/page_context>/g, '').trim();
}

function onEvent(ev: PanelEvent): void {
  switch (ev.type) {
    case 'context':
      setContext(ev.summary, ev.kind);
      break;
    case 'run_action':
      send('', ev.action);
      break;
    case 'user':
      history.push(ev.message);
      if (!history.filter((m) => m.role === 'user').length) messagesEl.innerHTML = '';
      addEl('msg user', escapeHtml(ev.message.role === 'user' ? (ev.message.display ?? stripContext(ev.message.content)) : ''));
      break;
    case 'delta':
      if (!streamEl) {
        streamEl = addEl('msg assistant streaming');
        streamText = '';
      }
      streamText += ev.text;
      streamEl.innerHTML = renderMarkdown(streamText);
      scrollDown();
      break;
    case 'assistant':
      history.push(ev.message);
      if (streamEl) {
        streamEl.classList.remove('streaming');
        if (ev.message.role === 'assistant') streamEl.innerHTML = renderMarkdown(ev.message.content);
        streamEl = null;
      } else if (ev.message.role === 'assistant' && ev.message.content.trim()) {
        addEl('msg assistant', renderMarkdown(ev.message.content));
      }
      break;
    case 'tool':
      history.push(ev.message);
      break;
    case 'tool_status': {
      let el = toolEls.get(ev.id);
      if (!el) {
        el = addEl('tool');
        toolEls.set(ev.id, el);
      }
      el.className = `tool ${ev.status}`;
      const label = ev.status === 'running' ? t('tool_running') : ev.status === 'done' ? t('tool_done') : t('tool_error');
      el.innerHTML = `<span class="dot"></span><span>${escapeHtml(ev.summary)} — ${label}</span>`;
      scrollDown();
      break;
    }
    case 'notice':
      addEl('msg notice', escapeHtml(ev.text === 'max_tokens' ? t('truncated_notice') : ev.text === 'refusal' ? t('refusal_notice') : ev.text === 'aborted' ? t('aborted') : ev.text));
      break;
    case 'error':
      addEl('msg error', escapeHtml(ev.text));
      break;
    case 'done':
      finish();
      break;
  }
}

function finish(): void {
  busy = false;
  if (streamEl) {
    streamEl.classList.remove('streaming');
    streamEl = null;
  }
  sendBtn.classList.remove('hidden');
  stopBtn.classList.add('hidden');
  sendBtn.disabled = false;
  inputEl.disabled = false;
  renderActions();
  persist();
  inputEl.focus();
}

async function send(text: string, action?: QuickActionId): Promise<void> {
  if (busy || !port) return;
  if (!providerReady(settings)) {
    $('nokey').classList.remove('hidden');
    return;
  }
  if (!text.trim() && !action) return;
  busy = true;
  toolEls.clear();
  sendBtn.classList.add('hidden');
  stopBtn.classList.remove('hidden');
  inputEl.value = '';
  inputEl.disabled = true;
  renderActions();
  tabId = await currentTabId();
  port.postMessage({ type: 'send', tabId, text, action, history, includeContext: includeCtx.checked } satisfies PanelRequest);
}

function persist(): void {
  // Keep the conversation per tab for the current browser session.
  if (tabId === null) return;
  chrome.storage.session.set({ [`chat:${tabId}`]: history.slice(-60) }).catch(() => undefined);
}

async function restore(): Promise<void> {
  if (tabId === null) return;
  const key = `chat:${tabId}`;
  const stored = (await chrome.storage.session.get(key))[key] as ChatMessage[] | undefined;
  if (stored?.length) history = stored;
  renderHistory();
}

async function main(): Promise<void> {
  settings = await loadSettings();
  setLang(settings.language);
  document.documentElement.lang = settings.language;
  tabId = await currentTabId();
  applyTexts();
  if (!providerReady(settings)) $('nokey').classList.remove('hidden');
  await restore();
  connect();

  onSettingsChanged((s) => {
    settings = s;
    setLang(s.language);
    applyTexts();
    $('nokey').classList.toggle('hidden', providerReady(s));
  });

  sendBtn.addEventListener('click', () => send(inputEl.value));
  stopBtn.addEventListener('click', () => port?.postMessage({ type: 'abort' } satisfies PanelRequest));
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(inputEl.value);
    }
  });
  $('clear').addEventListener('click', () => {
    if (busy) port?.postMessage({ type: 'abort' } satisfies PanelRequest);
    history = [];
    toolEls.clear();
    persist();
    renderHistory();
  });
  $('settings').addEventListener('click', () => chrome.runtime.openOptionsPage());
  $('nokey-open').addEventListener('click', () => chrome.runtime.openOptionsPage());

  // Follow tab switches / navigations within this window.
  const refreshContext = async () => {
    const id = await currentTabId();
    if (id !== tabId) {
      tabId = id;
      history = [];
      await restore();
      port?.postMessage({ type: 'hello', tabId } satisfies PanelRequest);
      return;
    }
    const res = (await chrome.runtime.sendMessage({ type: 'pageContextSummary', tabId } satisfies RuntimeMessage).catch(() => null)) as
      | { summary: string | null; kind: PageKind }
      | null;
    if (res) setContext(res.summary, res.kind);
  };
  chrome.tabs.onActivated.addListener(refreshContext);
  chrome.tabs.onUpdated.addListener((id, info) => {
    if (id === tabId && (info.status === 'complete' || info.url)) setTimeout(refreshContext, 1200);
  });
}

main().catch((err) => addEl('msg error', escapeHtml(String(err))));
