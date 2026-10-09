import type { Settings, LocalTool } from './types.ts';

export const DEFAULT_LOCAL_TOOLS: LocalTool[] = [
  {
    name: 'yt-dlp',
    path: '',
    description: 'Downloads video metadata and subtitles. Used for transcripts when the page has no caption tracks.',
  },
  {
    name: 'ffmpeg',
    path: '',
    description: 'Audio/video processing (extract audio, cut clips, probe files).',
  },
];

export const ANTHROPIC_MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (recommended)' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (faster, cheaper)' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5 (cheapest)' },
  { id: 'claude-fable-5-1', label: 'Claude Fable 5.1 (most capable, slow)' },
];

export const DEFAULT_SETTINGS: Settings = {
  language: 'ru',
  provider: 'anthropic',
  anthropicApiKey: '',
  anthropicModel: 'claude-opus-5-5',
  openaiApiKey: '',
  openaiModel: 'gpt-5',
  openaiBaseUrl: 'https://api.openai.com/v1',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-pro',
  ollamaBaseUrl: 'http://localhost:11434/v1',
  ollamaModel: 'llama3.1',
  effort: 'medium',
  youtubeApiKey: '',
  showOverlay: true,
  showBadges: true,
  computeOutliers: true,
  customApis: [],
  localTools: DEFAULT_LOCAL_TOOLS,
  nativeHostName: 'com.nubit.host',
};

const KEY = 'settings';

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(KEY);
  const s = (stored[KEY] ?? {}) as Partial<Settings>;
  const merged: Settings = { ...DEFAULT_SETTINGS, ...s };
  // Make sure the default local tools always exist (user may have older settings).
  const names = new Set(merged.localTools.map((t) => t.name));
  for (const t of DEFAULT_LOCAL_TOOLS) if (!names.has(t.name)) merged.localTools.push({ ...t });
  return merged;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [KEY]: settings });
}

export function onSettingsChanged(cb: (s: Settings) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[KEY]) {
      cb({ ...DEFAULT_SETTINGS, ...(changes[KEY].newValue as Partial<Settings>) });
    }
  });
}

export function providerReady(s: Settings): boolean {
  switch (s.provider) {
    case 'anthropic':
      return !!s.anthropicApiKey;
    case 'openai':
      return !!s.openaiApiKey;
    case 'gemini':
      return !!s.geminiApiKey;
    case 'ollama':
      return !!s.ollamaBaseUrl;
  }
}

export function currentModel(s: Settings): string {
  switch (s.provider) {
    case 'anthropic':
      return s.anthropicModel;
    case 'openai':
      return s.openaiModel;
    case 'gemini':
      return s.geminiModel;
    case 'ollama':
      return s.ollamaModel;
  }
}
