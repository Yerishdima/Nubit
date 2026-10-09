// OpenAI-compatible providers: OpenAI, Gemini (OpenAI endpoint), Ollama, and user-registered services
// such as Atlas / OpenRouter / ProxyAPI. Two wire protocols are supported:
//   - "chat":      POST {base}/chat/completions  (classic Chat Completions API)
//   - "responses": POST {base}/responses         (OpenAI Responses API, the one Codex uses)
import type { ChatMessage, ProviderId, ToolCall, WireProtocol } from '../../shared/types.ts';
import { ProviderError, type Provider, type RunRequest, type TurnResult } from './types.ts';

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface OpenAICompatOptions {
  id: ProviderId;
  baseUrl: string;
  apiKey: string;
  model: string;
  protocol?: WireProtocol;
  /** Human-readable name for error messages. */
  label?: string;
}

interface RawChatAssistant {
  content: string;
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
}

/** Reads an SSE body and calls `onData` for every `data:` JSON payload. */
async function readSse(res: Response, onData: (json: Any) => void): Promise<void> {
  if (!res.body) throw new ProviderError('Empty response body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  const handleLine = (line: string) => {
    if (!line.startsWith('data:')) return;
    const data = line.slice(5).trim();
    if (!data || data === '[DONE]') return;
    try {
      onData(JSON.parse(data));
    } catch {
      /* ignore malformed line */
    }
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf('\n')) >= 0) {
      handleLine(buf.slice(0, nl).trim());
      buf = buf.slice(nl + 1);
    }
  }
  const rest = buf.trim();
  if (rest.startsWith('data:')) handleLine(rest);
  else if (rest.startsWith('{')) {
    try {
      onData(JSON.parse(rest));
    } catch {
      /* ignore */
    }
  }
}

async function describeHttpError(res: Response, label: string): Promise<ProviderError> {
  const txt = await res.text().catch(() => '');
  let msg = txt.slice(0, 400);
  try {
    msg = JSON.parse(txt)?.error?.message ?? msg;
  } catch {
    /* keep raw */
  }
  if (res.status === 401 || res.status === 403) return new ProviderError(`${label}: invalid API key or no access (${msg})`, false, res.status);
  if (res.status === 404) return new ProviderError(`${label}: endpoint not found (HTTP 404). Check the base URL (it should end with /v1) and the protocol (Chat Completions vs Responses API). ${msg}`, false, 404);
  return new ProviderError(`${label} HTTP ${res.status}: ${msg}`, res.status === 429 || res.status >= 500, res.status);
}

export class OpenAICompatProvider implements Provider {
  readonly id: ProviderId;
  readonly rawKey: string;
  readonly model: string;
  readonly protocol: WireProtocol;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly label: string;

  constructor(opts: OpenAICompatOptions) {
    this.id = opts.id;
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.apiKey = opts.apiKey;
    this.model = opts.model;
    this.protocol = opts.protocol ?? 'chat';
    this.label = opts.label ?? opts.id;
    this.rawKey = this.protocol === 'responses' ? 'openai-responses' : 'openai-chat';
  }

  private async post(path: string, body: unknown, signal: AbortSignal): Promise<Response> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, { method: 'POST', headers, body: JSON.stringify(body), signal });
    } catch (err) {
      if (signal.aborted) throw err;
      const m = err instanceof Error ? err.message : String(err);
      const hint = /Failed to fetch/i.test(m) ? ' (network error — if this is a custom provider, press "Grant access" for its host in Settings)' : '';
      throw new ProviderError(`Could not reach ${this.baseUrl}${hint}`);
    }
    if (!res.ok) throw await describeHttpError(res, this.label);
    return res;
  }

  run(req: RunRequest): Promise<TurnResult> {
    return this.protocol === 'responses' ? this.runResponses(req) : this.runChat(req);
  }

  // ---- Chat Completions -----------------------------------------------------

  private toChatMessages(system: string, messages: ChatMessage[]): Any[] {
    const out: Any[] = [{ role: 'system', content: system }];
    for (const m of messages) {
      if (m.role === 'user') {
        if (m.images?.length) {
          out.push({
            role: 'user',
            content: [...m.images.map((img) => ({ type: 'image_url', image_url: { url: `data:${img.mediaType};base64,${img.data}` } })), { type: 'text', text: m.content }],
          });
        } else out.push({ role: 'user', content: m.content });
      } else if (m.role === 'assistant') {
        const raw = m.rawProvider === 'openai-chat' ? (m.raw as RawChatAssistant | undefined) : undefined;
        const toolCalls =
          raw?.tool_calls ??
          (m.toolCalls ?? []).map((c) => ({ id: c.id, type: 'function' as const, function: { name: c.name, arguments: JSON.stringify(c.input ?? {}) } }));
        const msg: Any = { role: 'assistant', content: raw?.content ?? m.content ?? '' };
        if (toolCalls.length) msg.tool_calls = toolCalls;
        out.push(msg);
      } else {
        for (const r of m.results) out.push({ role: 'tool', tool_call_id: r.id, content: r.content });
      }
    }
    return out;
  }

  private async runChat(req: RunRequest): Promise<TurnResult> {
    const body: Any = { model: this.model, messages: this.toChatMessages(req.system, req.messages), stream: true };
    if (req.tools.length) {
      body.tools = req.tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.input_schema } }));
    }
    const res = await this.post('/chat/completions', body, req.signal);

    let text = '';
    const calls = new Map<number, { id: string; name: string; args: string }>();
    let finish: string | undefined;
    await readSse(res, (json) => {
      const choice = json?.choices?.[0];
      if (!choice) return;
      const delta = choice.delta ?? choice.message ?? {};
      if (typeof delta.content === 'string' && delta.content) {
        text += delta.content;
        req.onText(delta.content);
      }
      for (const tc of delta.tool_calls ?? []) {
        const idx = tc.index ?? calls.size;
        const cur = calls.get(idx) ?? { id: tc.id ?? '', name: '', args: '' };
        if (tc.id) cur.id = tc.id;
        if (tc.function?.name) cur.name += tc.function.name;
        if (tc.function?.arguments) cur.args += tc.function.arguments;
        calls.set(idx, cur);
      }
      if (choice.finish_reason) finish = choice.finish_reason;
    });

    const toolCalls: ToolCall[] = [];
    const rawCalls: NonNullable<RawChatAssistant['tool_calls']> = [];
    let n = 0;
    for (const c of calls.values()) {
      const id = c.id || `call_${Date.now()}_${n++}`;
      toolCalls.push({ id, name: c.name, input: parseArgs(c.args) });
      rawCalls.push({ id, type: 'function', function: { name: c.name, arguments: c.args || '{}' } });
    }
    const raw: RawChatAssistant = { content: text, ...(rawCalls.length ? { tool_calls: rawCalls } : {}) };
    return { text, toolCalls, stop: stopFromFinish(finish, toolCalls.length), raw, model: this.model };
  }

  // ---- Responses API ---------------------------------------------------------

  private toResponsesInput(messages: ChatMessage[]): Any[] {
    const out: Any[] = [];
    for (const m of messages) {
      if (m.role === 'user') {
        if (m.images?.length) {
          out.push({
            role: 'user',
            content: [...m.images.map((img) => ({ type: 'input_image', image_url: `data:${img.mediaType};base64,${img.data}` })), { type: 'input_text', text: m.content }],
          });
        } else out.push({ role: 'user', content: m.content });
      } else if (m.role === 'assistant') {
        const raw = m.rawProvider === 'openai-responses' && Array.isArray(m.raw) ? (m.raw as Any[]) : undefined;
        if (raw?.length) {
          out.push(...raw);
          continue;
        }
        if (m.content.trim()) out.push({ role: 'assistant', content: [{ type: 'output_text', text: m.content }] });
        for (const c of m.toolCalls ?? []) out.push({ type: 'function_call', call_id: c.id, name: c.name, arguments: JSON.stringify(c.input ?? {}) });
      } else {
        for (const r of m.results) out.push({ type: 'function_call_output', call_id: r.id, output: r.content });
      }
    }
    return out;
  }

  private async runResponses(req: RunRequest): Promise<TurnResult> {
    const body: Any = { model: this.model, instructions: req.system, input: this.toResponsesInput(req.messages), stream: true };
    if (req.tools.length) {
      body.tools = req.tools.map((t) => ({ type: 'function', name: t.name, description: t.description, parameters: t.input_schema }));
    }
    const res = await this.post('/responses', body, req.signal);

    let streamedText = '';
    let finalResponse: Any = null;
    let failure: string | undefined;
    await readSse(res, (ev) => {
      switch (ev?.type) {
        case 'response.output_text.delta':
          if (typeof ev.delta === 'string') {
            streamedText += ev.delta;
            req.onText(ev.delta);
          }
          break;
        case 'response.completed':
        case 'response.incomplete':
          finalResponse = ev.response ?? null;
          break;
        case 'response.failed':
          failure = ev.response?.error?.message ?? 'response failed';
          break;
        case 'error':
          failure = ev.error?.message ?? ev.message ?? 'stream error';
          break;
      }
    });
    if (failure) throw new ProviderError(`${this.label}: ${failure}`);

    // Prefer the final response object; fall back to what we streamed.
    const output: Any[] = Array.isArray(finalResponse?.output) ? finalResponse.output : [];
    let text = '';
    const toolCalls: ToolCall[] = [];
    const raw: Any[] = [];
    for (const item of output) {
      if (item?.type === 'message') {
        const t = (item.content ?? [])
          .filter((c: Any) => c?.type === 'output_text')
          .map((c: Any) => c.text ?? '')
          .join('');
        text += t;
        raw.push({ role: 'assistant', content: [{ type: 'output_text', text: t }] });
      } else if (item?.type === 'function_call') {
        const callId = item.call_id ?? item.id ?? `call_${Date.now()}_${toolCalls.length}`;
        toolCalls.push({ id: callId, name: item.name, input: parseArgs(item.arguments) });
        raw.push({ type: 'function_call', call_id: callId, name: item.name, arguments: item.arguments ?? '{}' });
      }
      // reasoning items etc. are not replayed (some proxies reject them)
    }
    if (!output.length) text = streamedText;
    let stop: TurnResult['stop'] = toolCalls.length ? 'tool_use' : 'end';
    if (finalResponse?.status === 'incomplete' && finalResponse?.incomplete_details?.reason === 'max_output_tokens') stop = 'max_tokens';
    if (finalResponse?.status === 'incomplete' && finalResponse?.incomplete_details?.reason === 'content_filter') stop = 'refusal';
    return { text, toolCalls, stop, raw, model: finalResponse?.model ?? this.model };
  }
}

function parseArgs(args: string | undefined): unknown {
  if (!args) return {};
  try {
    return JSON.parse(args);
  } catch {
    return { __invalid_json: args };
  }
}

function stopFromFinish(finish: string | undefined, calls: number): TurnResult['stop'] {
  if (calls || finish === 'tool_calls') return 'tool_use';
  if (finish === 'length') return 'max_tokens';
  if (finish === 'content_filter') return 'refusal';
  return 'end';
}
