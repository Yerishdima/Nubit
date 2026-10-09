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
    const p = new OpenAICompatProvider({ id: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: 'k', model: 'gpt-test' });
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

test('OpenAICompatProvider (Responses API) streams text and collects function calls', async () => {
  const chunks = [
    'event: response.created\ndata: {"type":"response.created","response":{"id":"r1"}}\n\n',
    'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"Searching "}\n\n',
    'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"now."}\n\n',
    'event: response.output_item.added\ndata: {"type":"response.output_item.added","item":{"type":"function_call","id":"fc_1","call_id":"call_9","name":"search_youtube","arguments":""}}\n\n',
    'event: response.function_call_arguments.delta\ndata: {"type":"response.function_call_arguments.delta","item_id":"fc_1","delta":"{\\"query\\":\\"dogs\\"}"}\n\n',
    'event: response.completed\ndata: {"type":"response.completed","response":{"id":"r1","status":"completed","model":"atlas-model","output":[{"type":"reasoning","id":"rs_1","summary":[]},{"type":"message","id":"msg_1","role":"assistant","content":[{"type":"output_text","text":"Searching now."}]},{"type":"function_call","id":"fc_1","call_id":"call_9","name":"search_youtube","arguments":"{\\"query\\":\\"dogs\\"}"}]}}\n\n',
  ];
  const origFetch = globalThis.fetch;
  let sentUrl = '';
  let sentBody: string | undefined;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    sentUrl = String(url);
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
    const p = new OpenAICompatProvider({ id: 'custom', baseUrl: 'https://aiberloga.website/v1/', apiKey: 'k', model: 'atlas-model', protocol: 'responses', label: 'Atlas' });
    let streamed = '';
    const history: ChatMessage[] = [
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'ok', raw: [{ role: 'assistant', content: [{ type: 'output_text', text: 'ok' }] }], rawProvider: 'openai-responses' },
      { role: 'user', content: 'find dogs' },
    ];
    const r = await p.run({
      system: 'sys',
      messages: history,
      tools: [{ name: 'search_youtube', description: 'd', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } }],
      onText: (d) => (streamed += d),
      signal: new AbortController().signal,
    });
    assert.equal(sentUrl, 'https://aiberloga.website/v1/responses');
    assert.equal(streamed, 'Searching now.');
    assert.equal(r.text, 'Searching now.');
    assert.equal(r.stop, 'tool_use');
    assert.equal(r.model, 'atlas-model');
    assert.deepEqual(r.toolCalls, [{ id: 'call_9', name: 'search_youtube', input: { query: 'dogs' } }]);
    // raw replay items: message + function_call, no reasoning / ids
    assert.deepEqual(r.raw, [
      { role: 'assistant', content: [{ type: 'output_text', text: 'Searching now.' }] },
      { type: 'function_call', call_id: 'call_9', name: 'search_youtube', arguments: '{"query":"dogs"}' },
    ]);
    const body = JSON.parse(sentBody!);
    assert.equal(body.instructions, 'sys');
    assert.equal(body.tools[0].name, 'search_youtube');
    assert.deepEqual(body.input[1], { role: 'assistant', content: [{ type: 'output_text', text: 'ok' }] });
    // a tool result turn is converted into function_call_output
    const p2 = new OpenAICompatProvider({ id: 'custom', baseUrl: 'https://x/v1', apiKey: '', model: 'm', protocol: 'responses' });
    await p2.run({ system: 's', messages: [{ role: 'user', content: 'u' }, { role: 'assistant', content: '', toolCalls: r.toolCalls, raw: r.raw, rawProvider: 'openai-responses' }, { role: 'tool', results: [{ id: 'call_9', name: 'search_youtube', content: '{"ok":1}' }] }], tools: [], onText: () => undefined, signal: new AbortController().signal });
    const body2 = JSON.parse(sentBody!);
    assert.deepEqual(body2.input.at(-1), { type: 'function_call_output', call_id: 'call_9', output: '{"ok":1}' });
  } finally {
    globalThis.fetch = origFetch;
  }
});


test('image attachments are converted for Anthropic and OpenAI-compatible providers', async () => {
  const msgs: ChatMessage[] = [{ role: 'user', content: 'rate this', images: [{ mediaType: 'image/png', data: 'AAAA' }] }];
  const a = toAnthropicMessages(msgs, 'claude-opus-5-5');
  assert.deepEqual(a[0].content, [
    { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAA' } },
    { type: 'text', text: 'rate this' },
  ]);
  const origFetch = globalThis.fetch;
  const bodies: string[] = [];
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    bodies.push(String(init.body));
    return new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"ok"},"finish_reason":"stop"}]}\n')); c.close(); } }), { status: 200 });
  }) as typeof fetch;
  try {
    const chat = new OpenAICompatProvider({ id: 'openai', baseUrl: 'https://x/v1', apiKey: 'k', model: 'm' });
    await chat.run({ system: 's', messages: msgs, tools: [], onText: () => undefined, signal: new AbortController().signal });
    const b1 = JSON.parse(bodies[0]);
    assert.equal(b1.messages[1].content[0].type, 'image_url');
    assert.equal(b1.messages[1].content[0].image_url.url, 'data:image/png;base64,AAAA');
    const resp = new OpenAICompatProvider({ id: 'custom', baseUrl: 'https://x/v1', apiKey: 'k', model: 'm', protocol: 'responses' });
    await resp.run({ system: 's', messages: msgs, tools: [], onText: () => undefined, signal: new AbortController().signal });
    const b2 = JSON.parse(bodies[1]);
    assert.equal(b2.input[0].content[0].type, 'input_image');
    assert.equal(b2.input[0].content[1].text, 'rate this');
  } finally {
    globalThis.fetch = origFetch;
  }
});
