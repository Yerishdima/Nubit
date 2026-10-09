// The agent loop: model turn → tool calls → tool results → model turn … until the model stops.
import type { ChatMessage, PanelEvent, Settings, ToolCall, ToolResult } from '../shared/types.ts';
import { createProvider, ProviderError } from './providers/index.ts';
import { buildSystemPrompt } from './prompts.ts';
import { buildTools, validateInput, type ToolContext } from './tools.ts';

const MAX_STEPS = 14;
const MAX_HISTORY = 40;

export interface AgentRun {
  settings: Settings;
  history: ChatMessage[];
  ctx: Omit<ToolContext, 'settings' | 'lang'>;
  signal: AbortSignal;
  emit: (ev: PanelEvent) => void;
}

/**
 * Runs the loop for the latest user message in `history` and returns the messages that were appended.
 * Streaming text and tool status go through `emit`.
 */
export async function runAgent(run: AgentRun): Promise<ChatMessage[]> {
  const { settings, signal, emit } = run;
  const provider = createProvider(settings);
  const tools = buildTools(settings);
  const toolMap = new Map(tools.map((t) => [t.def.name, t]));
  const system = buildSystemPrompt(settings, {
    nativeTools: settings.localTools.filter((t) => t.path).map((t) => t.name),
    customApis: settings.customApis.filter((a) => a.name && a.baseUrl).map((a) => a.name),
    youtubeApi: !!settings.youtubeApiKey,
  });
  const ctx: ToolContext = { ...run.ctx, settings, lang: settings.language };

  const messages = trimHistory(run.history);
  const appended: ChatMessage[] = [];

  for (let step = 0; step < MAX_STEPS; step++) {
    if (signal.aborted) break;
    const result = await provider.run({
      system,
      messages,
      tools: tools.map((t) => t.def),
      onText: (delta) => emit({ type: 'delta', text: delta }),
      signal,
    });
    const assistant: ChatMessage = {
      role: 'assistant',
      content: result.text,
      toolCalls: result.toolCalls.length ? result.toolCalls : undefined,
      raw: result.raw,
      rawProvider: provider.id,
      rawModel: result.model ?? provider.model,
    };
    messages.push(assistant);
    appended.push(assistant);
    emit({ type: 'assistant', message: assistant });

    if (result.stop === 'max_tokens') {
      emit({ type: 'notice', text: 'max_tokens' });
      break;
    }
    if (result.stop === 'refusal') {
      emit({ type: 'notice', text: 'refusal' });
      break;
    }
    if (result.stop !== 'tool_use' || !result.toolCalls.length) break;

    const results = await Promise.all(
      result.toolCalls.map(async (call): Promise<ToolResult> => {
        const tool = toolMap.get(call.name);
        const label = tool ? safeSummary(tool.summary, call, settings.language) : call.name;
        emit({ type: 'tool_status', id: call.id, name: call.name, status: 'running', summary: label });
        if (!tool) {
          emit({ type: 'tool_status', id: call.id, name: call.name, status: 'error', summary: label });
          return { id: call.id, name: call.name, content: `Error: unknown tool "${call.name}"`, isError: true };
        }
        const invalid = validateInput(tool.def.input_schema, call.input);
        if (invalid) {
          emit({ type: 'tool_status', id: call.id, name: call.name, status: 'error', summary: label });
          return {
            id: call.id,
            name: call.name,
            content: JSON.stringify({ INVALID_INPUT: invalid, received: safeJson(call.input) }),
            isError: true,
          };
        }
        try {
          const content = await tool.run(call.input, ctx);
          const isError = content.startsWith('Error:');
          emit({ type: 'tool_status', id: call.id, name: call.name, status: isError ? 'error' : 'done', summary: label });
          return { id: call.id, name: call.name, content, isError };
        } catch (err) {
          emit({ type: 'tool_status', id: call.id, name: call.name, status: 'error', summary: label });
          return { id: call.id, name: call.name, content: `Error: ${err instanceof Error ? err.message : String(err)}`, isError: true };
        }
      }),
    );
    const toolMsg: ChatMessage = { role: 'tool', results };
    messages.push(toolMsg);
    appended.push(toolMsg);
    emit({ type: 'tool', message: toolMsg });
  }
  return appended;
}

function safeSummary(fn: (input: unknown, lang: Settings['language']) => string, call: ToolCall, lang: Settings['language']): string {
  try {
    return fn(call.input ?? {}, lang);
  } catch {
    return call.name;
  }
}

function safeJson(x: unknown): string {
  try {
    return JSON.stringify(x).slice(0, 2000);
  } catch {
    return String(x);
  }
}

/**
 * Keeps the conversation bounded. Dropping old turns is a history edit, so when we do it we also strip
 * provider-native thinking blocks from the retained assistant turns (text and tool calls stay).
 */
export function trimHistory(history: ChatMessage[]): ChatMessage[] {
  if (history.length <= MAX_HISTORY) return [...history];
  let start = history.length - MAX_HISTORY;
  while (start < history.length && history[start].role !== 'user') start++;
  const kept = history.slice(start);
  return kept.map((m) => {
    if (m.role !== 'assistant' || !Array.isArray(m.raw)) return m;
    const raw = (m.raw as Array<{ type?: string }>).filter((b) => b?.type !== 'thinking' && b?.type !== 'redacted_thinking');
    return { ...m, raw };
  });
}

export { ProviderError };
