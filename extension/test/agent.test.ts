import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../src/shared/markdown.ts';
import { validateInput } from '../src/background/tools.ts';
import { trimHistory } from '../src/background/agent.ts';
import { toAnthropicMessages } from '../src/background/providers/anthropic.ts';
import { OpenAICompatProvider } from '../src/background/providers/openai.ts';
import type { ChatMessage } from '../src/shared/types.ts';

test('renderMarkdown escapes html and renders lists/tables/code', () => {
  const html = renderMarkdown('# Title\n\n<b>x</b> **bold** `code`\n\n- a\n- b\n\n| h1 | h2 |\n|---|---|\n| 1 | 2 |\n\n```\nraw <tag>\n```');
  assert.ok(html.includes('<h3>Title</h3>'));
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'));
  assert.ok(html.includes('<strong>bold</strong>'));
  assert.ok(html.includes('<code>code</code>'));
  assert.ok(html.includes('<ul><li>a</li><li>b</li></ul>'));
  assert.ok(html.includes('<th>h1</th>'));
  assert.ok(html.includes('<pre><code>raw &lt;tag&gt;</code></pre>'));
});

test('validateInput checks required fields, types and enums', () => {
  const schema = {
    type: 'object' as const,
    properties: { q: { type: 'string' as const }, n: { type: 'integer' as const }, order: { type: 'string' as const, enum: ['a', 'b'] }, tags: { type: 'array' as const, items: { type: 'string' as const } } },
    required: ['q'],
  };
  assert.equal(validateInput(schema, { q: 'x' }), null);
  assert.match(validateInput(schema, {}) ?? '', /missing required/);
  assert.match(validateInput(schema, { q: 1 }) ?? '', /type string/);
  assert.match(validateInput(schema, { q: 'x', order: 'c' }) ?? '', /one of/);
  assert.match(validateInput(schema, { q: 'x', tags: [1] }) ?? '', /items/);
  assert.match(validateInput(schema, 'str') ?? '', /object/);
});

test('trimHistory keeps a user-first tail and strips thinking blocks from retained turns', () => {
  const history: ChatMessage[] = [];
  for (let i = 0; i < 30; i++) {
    history.push({ role: 'user', content: `u${i}` });
    history.push({ role: 'assistant', content: `a${i}`, raw: [{ type: 'thinking', thinking: 't' }, { type: 'text', text: `a${i}` }], rawProvider: 'anthropic' });
  }
  const trimmed = trimHistory(history);
  assert.ok(trimmed.length <= 40);
  assert.equal(trimmed[0].role, 'user');
  const assistant = trimmed.find((m) => m.role === 'assistant');
  assert.deepEqual((assistant as { raw: unknown }).raw, [{ type: 'text', text: (assistant as { content: string }).content }]);
  assert.equal(trimHistory(history.slice(0, 4)).length, 4);
});

test('toAnthropicMessages replays raw blocks and reconstructs others', () => {
  const msgs: ChatMessage[] = [
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'calling', toolCalls: [{ id: 't1', name: 'search_youtube', input: { query: 'x' } }], rawProvider: 'openai', raw: { content: 'calling' } },
    { role: 'tool', results: [{ id: 't1', name: 'search_youtube', content: '{}' }] },
    { role: 'assistant', content: 'done', raw: [{ type: 'thinking', thinking: 'hmm' }, { type: 'text', text: 'done' }], rawProvider: 'anthropic', rawModel: 'claude-opus-5-5' },
  ];
  const out = toAnthropicMessages(msgs, 'claude-opus-5-5');
  assert.equal(out.length, 4);
  assert.deepEqual(out[1].content, [
    { type: 'text', text: 'calling' },
    { type: 'tool_use', id: 't1', name: 'search_youtube', input: { query: 'x' } },
  ]);
  assert.deepEqual(out[2], { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: '{}', is_error: false }] });
  assert.equal((out[3].content as unknown[]).length, 2);
  // Different model → thinking blocks stripped
  const other = toAnthropicMessages(msgs, 'claude-sonnet-5-5');
  assert.deepEqual(other[3].content, [{ type: 'text', text: 'done' }]);
});

test('OpenAICompatProvider parses a streamed tool call', async () => {
  const chunks = [
    'data: {"choices":[{"delta":{"content":"Let me "}}]}\n',
    'data: {"choices":[{"delta":{"content":"search."}}]}\n',
    'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","function":{"name":"search_youtube","arguments":"{\\"qu"}}]}}]}\n',
    'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"ery\\":\\"cats\\"}"}}]},"finish_reason":"tool_calls"}]}\n',
    'data: [DONE]\n',
  ];
  const origFetch = globalThis.fetch;
  let sentBody: string | undefined;
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    sentBody = String(init.body);
    const stream = new ReadableStream({
      start(controller) {
        for (const c of chunks) controller.enqueue(new TextEncoder().encode(c));
        controller.close();
      },
    });
    return new Response(stream, { status: 200 });
  }) as typeof fetch;
  try {
    const p = new OpenAICompatProvider('openai', 'https://api.openai.com/v1', 'k', 'gpt-test');
    let streamed = '';
    const r = await p.run({
      system: 'sys',
      messages: [{ role: 'user', content: 'find cats' }],
      tools: [{ name: 'search_youtube', description: 'd', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } }],
      onText: (d) => (streamed += d),
      signal: new AbortController().signal,
    });
    assert.equal(streamed, 'Let me search.');
    assert.equal(r.stop, 'tool_use');
    assert.deepEqual(r.toolCalls, [{ id: 'call_1', name: 'search_youtube', input: { query: 'cats' } }]);
    const body = JSON.parse(sentBody!);
    assert.equal(body.messages[0].role, 'system');
    assert.equal(body.tools[0].function.name, 'search_youtube');
  } finally {
    globalThis.fetch = origFetch;
  }
});
