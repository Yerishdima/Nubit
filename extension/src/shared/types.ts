// Shared types used across background, content scripts, side panel and options.

export type Lang = 'ru' | 'en';
export type ProviderId = 'anthropic' | 'atlas' | 'openai' | 'gemini' | 'ollama' | 'custom';
export type Effort = 'low' | 'medium' | 'high' | 'xhigh';
/** Wire protocol of an OpenAI-compatible service. */
export type WireProtocol = 'chat' | 'responses';

/** A user-registered OpenAI-compatible model provider (Atlas, OpenRouter, ProxyAPI, …). */
export interface CustomProvider {
  id: string;
  name: string;
  /** Base URL ending with /v1 (the extension appends /chat/completions or /responses). */
  baseUrl: string;
  apiKey: string;
  model: string;
  protocol: WireProtocol;
}

/** A third-party HTTP API the user registered in settings; exposed to the model as `call_custom_api`. */
export interface CustomApi {
  id: string;
  /** Short identifier the model uses, e.g. "keywordtool". */
  name: string;
  /** What the API does and which endpoints exist — this is what the model reads. */
  description: string;
  baseUrl: string;
  headers: Record<string, string>;
}

/** A program on the user's computer (yt-dlp, ffmpeg, …) that the native host may run. */
export interface LocalTool {
  name: string;
  /** Absolute path to the executable. Empty = not configured. */
  path: string;
  description: string;
}

/** A saved group of tags the creator applies to many videos. */
export interface TagTemplate {
  name: string;
  tags: string[];
}

/** An image attached to a user message (base64, no data: prefix). */
export interface ImageAttachment {
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  data: string;
}

export interface Settings {
  language: Lang;
  provider: ProviderId;
  anthropicApiKey: string;
  anthropicModel: string;
  /** Atlas API (OpenAI-compatible proxy, preconfigured). */
  atlasApiKey: string;
  atlasModel: string;
  atlasProtocol: WireProtocol;
  openaiApiKey: string;
  openaiModel: string;
  openaiBaseUrl: string;
  geminiApiKey: string;
  geminiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  customProviders: CustomProvider[];
  /** Which entry of customProviders is active when provider === 'custom'. */
  activeCustomProviderId: string;
  effort: Effort;
  youtubeApiKey: string;
  showOverlay: boolean;
  showBadges: boolean;
  computeOutliers: boolean;
  customApis: CustomApi[];
  localTools: LocalTool[];
  nativeHostName: string;
  tagTemplates: TagTemplate[];
  competitors: Competitor[];
}

export interface CaptionTrack {
  lang: string;
  name: string;
  url: string;
  auto: boolean;
}

export interface VideoData {
  videoId: string;
  url: string;
  title: string;
  channelId?: string;
  channelName?: string;
  channelHandle?: string;
  views?: number;
  likes?: number;
  comments?: number;
  /** ISO date */
  publishedAt?: string;
  durationSec?: number;
  tags?: string[];
  description?: string;
  category?: string;
  isLive?: boolean;
  isShort?: boolean;
  subscribers?: number;
  channelVideoCount?: number;
  thumbnailUrl?: string;
  captionTracks?: CaptionTrack[];
  hasChapters?: boolean;
}

export interface SeoCheck {
  id: string;
  ok: boolean;
  weight: number;
  /** Localized label. */
  label: string;
  /** Localized hint shown when the check fails. */
  hint: string;
}

export interface SeoScore {
  score: number;
  checks: SeoCheck[];
}

export interface VideoMetrics {
  ageHours?: number;
  /** Lifetime average views per hour. */
  vph?: number;
  /** Views per hour measured between two snapshots taken by this extension (if available). */
  vphRecent?: number;
  engagementRate?: number;
  likeRate?: number;
  commentRate?: number;
  /** views / median views of the channel's recent uploads. */
  outlier?: number;
  channelMedianViews?: number;
  channelSampleSize?: number;
  seo?: SeoScore;
}

export interface ListVideo {
  videoId: string;
  title: string;
  channelName?: string;
  channelId?: string;
  channelHandle?: string;
  views?: number;
  publishedText?: string;
  publishedAt?: string;
  ageHours?: number;
  durationSec?: number;
  vph?: number;
  likes?: number;
  comments?: number;
  isLive?: boolean;
  isShort?: boolean;
  verified?: boolean;
  description?: string;
  subscribers?: number;
}

export interface ChannelData {
  channelId?: string;
  handle?: string;
  name?: string;
  subscribers?: number;
  videoCount?: number;
  description?: string;
  url?: string;
  /** Channel keywords set by the owner (vidIQ calls them "channel tags"). */
  keywords?: string[];
}

/** A tracked competitor channel. */
export interface Competitor {
  channelId?: string;
  handle?: string;
  name: string;
  addedAt: number;
}

export interface CompetitorSnapshot {
  key: string;
  name: string;
  channelId?: string;
  handle?: string;
  subscribers?: number;
  medianViews?: number;
  uploadsPerWeek?: number;
  lastUploadAgeHours?: number;
  topVideos: Array<{ videoId: string; title: string; views?: number; ageHours?: number; vph?: number; outlier?: number }>;
  fetchedAt: number;
}

export interface CompetitorAlert {
  channelKey: string;
  channelName: string;
  videoId: string;
  title: string;
  views?: number;
  ageHours?: number;
  vph?: number;
  outlier?: number;
  seenAt: number;
  unseen: boolean;
}

export interface TagRank {
  tag: string;
  /** 1-based position of the video in YouTube search for this tag, or null if not in the top results. */
  rank: number | null;
  /** How many results were checked. */
  checked: number;
}

export interface ChannelStats {
  channel: ChannelData;
  videos: ListVideo[];
  medianViews?: number;
  avgViews?: number;
  /** Uploads per week over the sampled videos. */
  uploadsPerWeek?: number;
  fetchedAt: number;
}

export interface CommentItem {
  author: string;
  text: string;
  likes?: number;
  publishedText?: string;
  replies?: number;
}

export type PageKind = 'watch' | 'search' | 'home' | 'channel' | 'shorts' | 'studio' | 'other';

/** What the creator is typing in the YouTube Studio upload / edit dialog. */
export interface StudioDraft {
  title: string;
  description: string;
  tags: string[];
  focusKeyword?: string;
  titleScore?: number;
  seoScore?: number;
}

export interface PageContext {
  kind: PageKind;
  url: string;
  title: string;
  draft?: StudioDraft;
  video?: VideoData;
  metrics?: VideoMetrics;
  query?: string;
  results?: ListVideo[];
  related?: ListVideo[];
  channel?: ChannelData;
  channelVideos?: ListVideo[];
  comments?: CommentItem[];
  capturedAt: string;
}

// ---- Chat / agent -------------------------------------------------------

export interface JsonSchema {
  type: 'object';
  properties: Record<string, JsonSchemaProp>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface JsonSchemaProp {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  items?: JsonSchemaProp;
  minimum?: number;
  maximum?: number;
  properties?: Record<string, JsonSchemaProp>;
}

export interface ToolDef {
  name: string;
  description: string;
  input_schema: JsonSchema;
}

export interface ToolCall {
  id: string;
  name: string;
  input: unknown;
}

export interface ToolResult {
  id: string;
  name: string;
  content: string;
  isError?: boolean;
}

export type ChatMessage =
  | { role: 'user'; content: string; /** Short label shown in the UI instead of the full content. */ display?: string; images?: ImageAttachment[] }
  | {
      role: 'assistant';
      content: string;
      toolCalls?: ToolCall[];
      /** Provider-native content blocks, replayed verbatim when a provider with the same wire format continues. */
      raw?: unknown;
      /** Wire format of `raw`: "anthropic", "openai-chat" or "openai-responses". */
      rawProvider?: string;
      rawModel?: string;
    }
  | { role: 'tool'; results: ToolResult[] };

export type QuickActionId =
  | 'analyze_video'
  | 'why_performing'
  | 'titles'
  | 'tags_description'
  | 'keyword_research'
  | 'channel_review'
  | 'competitors'
  | 'content_ideas'
  | 'summarize'
  | 'studio_titles'
  | 'studio_description'
  | 'studio_tags'
  | 'studio_compare'
  | 'studio_magic_fill'
  | 'studio_thumbnail'
  | 'daily_ideas';

// ---- Messaging ----------------------------------------------------------

/** Side panel → background (over the "chat" port). */
export type PanelRequest =
  | { type: 'send'; tabId: number | null; text: string; action?: QuickActionId; history: ChatMessage[]; includeContext: boolean; images?: ImageAttachment[] }
  | { type: 'abort' }
  | { type: 'hello'; tabId: number | null };

/** Background → side panel (over the "chat" port). */
export type PanelEvent =
  | { type: 'user'; message: ChatMessage }
  | { type: 'delta'; text: string }
  | { type: 'assistant'; message: ChatMessage }
  | { type: 'tool'; message: ChatMessage }
  | { type: 'tool_status'; id: string; name: string; status: 'running' | 'done' | 'error'; summary: string }
  | { type: 'notice'; text: string }
  | { type: 'error'; text: string }
  | { type: 'done' }
  | { type: 'run_action'; action: QuickActionId }
  | { type: 'context'; summary: string | null; kind: PageKind };

/** One-shot runtime messages. */
export type RuntimeMessage =
  | { type: 'openSidePanel'; action?: QuickActionId }
  | { type: 'getPageContext' }
  | { type: 'getChannelStats'; channel: string }
  | { type: 'snapshot'; videoId: string; views: number }
  | { type: 'getRecentVph'; videoId: string; views: number }
  | { type: 'getSettings' }
  | { type: 'nativePing' }
  | { type: 'nativeWhich'; name: string }
  | { type: 'testProvider' }
  | { type: 'fetchModels'; baseUrl: string; apiKey: string }
  | { type: 'analyzeKeyword'; query: string; lang: Lang }
  | { type: 'getVideoTags'; videoIds: string[] }
  | { type: 'studioInsert'; field: 'title' | 'description' | 'tags'; value: string | string[]; mode?: 'replace' | 'append' }
  | { type: 'fetchImage'; url: string }
  | { type: 'tagRanks'; videoId: string; tags: string[] }
  | { type: 'addCompetitor'; channel: string }
  | { type: 'removeCompetitor'; key: string }
  | { type: 'getCompetitors' }
  | { type: 'refreshCompetitors' }
  | { type: 'markAlertsSeen' }
  | { type: 'pageContextSummary'; tabId: number | null };
