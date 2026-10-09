import type { ChatMessage, ProviderId, ToolCall, ToolDef } from '../../shared/types.ts';

export interface RunRequest {
  system: string;
  messages: ChatMessage[];
  tools: ToolDef[];
  onText: (delta: string) => void;
  signal: AbortSignal;
}

export interface TurnResult {
  text: string;
  toolCalls: ToolCall[];
  stop: 'end' | 'tool_use' | 'max_tokens' | 'refusal';
  /** Provider-native assistant content for verbatim replay. */
  raw?: unknown;
  model?: string;
  refusalReason?: string;
}

export interface Provider {
  readonly id: ProviderId;
  /** Wire format key stored on assistant messages (`rawProvider`) so raw blocks are replayed only by compatible providers. */
  readonly rawKey: string;
  readonly model: string;
  run(req: RunRequest): Promise<TurnResult>;
}

export class ProviderError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable = false) {
    super(message);
    this.retryable = retryable;
  }
}
