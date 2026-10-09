import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage, Effort, ToolDef } from '../../shared/types.ts';
import { ProviderError, type Provider, type RunRequest, type TurnResult } from './types.ts';

type BetaMessageParam = Anthropic.Beta.BetaMessageParam;
type BetaContentBlockParam = Anthropic.Beta.BetaContentBlockParam;

/** Models that accept the server-side `fallbacks: "default"` parameter. */
function supportsFallbacks(model: string): boolean {
  return /^claude-(opus|sonnet|fable)-5/.test(model);
}

function isThinkingBlock(b: unknown): boolean {
  const t = (b as { type?: string })?.type;
  return t === 'thinking' || t === 'redacted_thinking';
}

export function toAnthropicMessages(messages: ChatMessage[], model: string): BetaMessageParam[] {
  const out: BetaMessageParam[] = [];
  for (const m of messages) {
    if (m.role === 'user') {
      if (m.images?.length) {
        out.push({
          role: 'user',
          content: [
            ...m.images.map((img) => ({ type: 'image' as const, source: { type: 'base64' as const, media_type: img.mediaType, data: img.data } })),
            { type: 'text' as const, text: m.content },
          ],
        });
      } else out.push({ role: 'user', content: m.content });
    } else if (m.role === 'assistant') {
      if (m.rawProvider === 'anthropic' && Array.isArray(m.raw) && m.raw.length) {
        let blocks = m.raw as BetaContentBlockParam[];
        // Thinking blocks are bound to the model that produced them; other models ignore them,
        // but we strip them anyway when the model changed to keep requests small.
        if (m.rawModel && m.rawModel !== model) blocks = blocks.filter((b) => !isThinkingBlock(b));
        if (blocks.length) {
          out.push({ role: 'assistant', content: blocks });
          continue;
        }
      }
      const blocks: BetaContentBlockParam[] = [];
      if (m.content.trim()) blocks.push({ type: 'text', text: m.content });
      for (const c of m.toolCalls ?? []) blocks.push({ type: 'tool_use', id: c.id, name: c.name, input: c.input ?? {} });
      if (!blocks.length) blocks.push({ type: 'text', text: '(empty)' });
      out.push({ role: 'assistant', content: blocks });
    } else {
      out.push({
        role: 'user',
        content: m.results.map((r) => ({
          type: 'tool_result' as const,
          tool_use_id: r.id,
          content: r.content,
          is_error: r.isError ?? false,
        })),
      });
    }
  }
  return out;
}

export class AnthropicProvider implements Provider {
  readonly id = 'anthropic' as const;
  readonly rawKey = 'anthropic';
  readonly model: string;
  private readonly effort: Effort;
  private readonly client: Anthropic;

  constructor(apiKey: string, model: string, effort: Effort) {
    this.model = model;
    this.effort = effort;
    this.client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
  }

  async run(req: RunRequest): Promise<TurnResult> {
    const tools: Anthropic.Beta.BetaToolUnion[] = req.tools.map((t: ToolDef) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema as Anthropic.Beta.BetaTool.InputSchema,
      // Stream large tool inputs as they are generated; inputs are validated client-side before running.
      eager_input_streaming: true,
    }));
    const betas: string[] = ['thinking-binding-controls-2026-08-01'];
    const fallbacks = supportsFallbacks(this.model);
    if (fallbacks) betas.push('server-side-fallback-2026-07-01');

    let message: Anthropic.Beta.BetaMessage | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      const stream = this.client.beta.messages.stream(
        {
          model: this.model,
          max_tokens: 32000,
          betas,
          system: [{ type: 'text', text: req.system, cache_control: { type: 'ephemeral' } }],
          messages: toAnthropicMessages(req.messages, this.model),
          tools,
          // Adaptive thinking; if replayed thinking blocks no longer match the history (e.g. settings changed
          // mid-chat), drop them instead of failing the request.
          thinking: { type: 'adaptive', block_binding: { prefix_mismatch_behavior: 'drop_block' } },
          output_config: { effort: this.effort },
          ...(fallbacks ? { fallbacks: 'default' as const } : {}),
        },
        { signal: req.signal },
      );
      stream.on('text', (delta) => req.onText(delta));
      try {
        message = await stream.finalMessage();
        break;
      } catch (err) {
        if (req.signal.aborted) throw err;
        if (err instanceof Anthropic.APIError) throw new ProviderError(describeApiError(err), err.status === 429 || (err.status ?? 0) >= 500);
        if (err instanceof Error && /abort/i.test(err.message)) throw err;
        // A tool input that could not be parsed at all (eager streaming): re-issue the turn once.
        if (attempt === 0) continue;
        throw new ProviderError(err instanceof Error ? err.message : String(err));
      }
    }
    if (!message) throw new ProviderError('No response from Claude');

    const text = message.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    const toolCalls = message.content
      .filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use')
      .map((b) => ({ id: b.id, name: b.name, input: b.input }));

    let stop: TurnResult['stop'] = 'end';
    let refusalReason: string | undefined;
    switch (message.stop_reason) {
      case 'tool_use':
        stop = 'tool_use';
        break;
      case 'max_tokens':
        stop = 'max_tokens';
        break;
      case 'refusal':
        stop = 'refusal';
        refusalReason = message.stop_details?.type === 'refusal' ? (message.stop_details.category ?? undefined) : undefined;
        break;
      default:
        stop = toolCalls.length ? 'tool_use' : 'end';
    }
    return { text, toolCalls, stop, raw: message.content, model: message.model, refusalReason };
  }
}

function describeApiError(err: InstanceType<typeof Anthropic.APIError>): string {
  if (err instanceof Anthropic.AuthenticationError) return 'Claude API: invalid API key (check Settings).';
  if (err instanceof Anthropic.PermissionDeniedError) return 'Claude API: permission denied for this key/model.';
  if (err instanceof Anthropic.RateLimitError) return 'Claude API: rate limit reached — wait a moment and retry.';
  if (err instanceof Anthropic.NotFoundError) return `Claude API: model not found (${err.message}).`;
  if (err instanceof Anthropic.BadRequestError) return `Claude API rejected the request: ${err.message}`;
  if (err instanceof Anthropic.APIConnectionError) return 'Could not reach api.anthropic.com (network, VPN or firewall?).';
  return `Claude API error${err.status ? ' ' + err.status : ''}: ${err.message}`;
}
