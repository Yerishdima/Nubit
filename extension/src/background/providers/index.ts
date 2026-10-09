import type { Settings } from '../../shared/types.ts';
import { AnthropicProvider } from './anthropic.ts';
import { OpenAICompatProvider } from './openai.ts';
import { ProviderError, type Provider } from './types.ts';

export function createProvider(s: Settings): Provider {
  switch (s.provider) {
    case 'anthropic':
      if (!s.anthropicApiKey) throw new ProviderError('Claude API key is missing — add it in Settings.');
      return new AnthropicProvider(s.anthropicApiKey, s.anthropicModel || 'claude-opus-5-5', s.effort);
    case 'openai':
      if (!s.openaiApiKey) throw new ProviderError('OpenAI API key is missing — add it in Settings.');
      return new OpenAICompatProvider('openai', s.openaiBaseUrl || 'https://api.openai.com/v1', s.openaiApiKey, s.openaiModel);
    case 'gemini':
      if (!s.geminiApiKey) throw new ProviderError('Gemini API key is missing — add it in Settings.');
      return new OpenAICompatProvider('gemini', 'https://generativelanguage.googleapis.com/v1beta/openai', s.geminiApiKey, s.geminiModel);
    case 'ollama':
      return new OpenAICompatProvider('ollama', s.ollamaBaseUrl || 'http://localhost:11434/v1', '', s.ollamaModel);
  }
}

export { ProviderError } from './types.ts';
export type { Provider, RunRequest, TurnResult } from './types.ts';
