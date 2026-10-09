// OpenAI-compatible chat/completions provider: OpenAI, Gemini (OpenAI endpoint), Ollama and similar.
import type { ChatMessage, ProviderId, ToolCall } from '../../shared/types.ts';
import { ProviderError, type Provider, type RunRequest, type TurnResult } from './types.ts';

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

interface RawAssistant {
  content: string;
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
}

export class OpenAICompatProvider implements Provider {
  readonly id: ProviderId;
  readonly model: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(id: ProviderId, baseUrl: string, apiKey: string, model: string) {
    this.id = id;
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.model = model;
  }

  private convert(system: string, messages: ChatMessage[]): Any[] {
    const out: Any[] = [{ role: 'system', content: system }];
    for (const m of messages) {
      if (m.role === 'user') out.push({ role: 'user', content: m.content });
      else if (m.role === 'assistant') {
        const raw = m.rawProvider === this.id ? (m.raw as RawAssistant | undefined) : undefined;
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

  async run(req: RunRequest): Promise<TurnResult> {
    const body: Any = {
      model: this.model,
      messages: this.convert(req.system, req.messages),
      stream: true,
    };
    if (req.tools.length) {
      body.tools = req.tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.input_schema } }));
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: req.signal,
      });
    } catch (err) {
      if (req.signal.aborted) throw err;
      throw new ProviderError(`Could not reach ${this.baseUrl} (${err instanceof Error ? err.message : String(err)})`);
    }
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      let msg = txt.slice(0, 400);
      try {
        msg = JSON.parse(txt)?.error?.message ?? msg;
      } catch {
        /* keep raw */
      }
      if (res.status === 401) throw new ProviderError(`${this.id}: invalid API key (${msg})`);
      throw new ProviderError(`${this.id} HTTP ${res.status}: ${msg}`, res.status === 429 || res.status >= 500);
    }
    if (!res.body) throw new ProviderError('Empty response body');

    let text = '';
    const calls = new Map<number, { id: string; name: string; args: string }>();
    let finish: string | undefined;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    const handle = (json: Any) => {
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
    };
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          handle(JSON.parse(data));
        } catch {
          /* ignore malformed line */
        }
      }
    }
    if (buf.trim().startsWith('{')) {
      try {
        handle(JSON.parse(buf));
      } catch {
        /* ignore */
      }
    }

    const toolCalls: ToolCall[] = [];
    const rawCalls: NonNullable<RawAssistant['tool_calls']> = [];
    let n = 0;
    for (const c of [...calls.values()]) {
      const id = c.id || `call_${Date.now()}_${n++}`;
      let input: unknown = {};
      try {
        input = c.args ? JSON.parse(c.args) : {};
      } catch {
        input = { __invalid_json: c.args };
      }
      toolCalls.push({ id, name: c.name, input });
      rawCalls.push({ id, type: 'function', function: { name: c.name, arguments: c.args || '{}' } });
    }
    let stop: TurnResult['stop'] = 'end';
    if (toolCalls.length || finish === 'tool_calls') stop = 'tool_use';
    else if (finish === 'length') stop = 'max_tokens';
    else if (finish === 'content_filter') stop = 'refusal';
    const raw: RawAssistant = { content: text, ...(rawCalls.length ? { tool_calls: rawCalls } : {}) };
    return { text, toolCalls, stop, raw, model: this.model };
  }
}
