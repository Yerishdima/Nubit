import type { Settings } from '../../shared/types.ts';
import { activeCustomProvider } from '../../shared/settings.ts';
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
      return new OpenAICompatProvider({ id: 'openai', baseUrl: s.openaiBaseUrl || 'https://api.openai.com/v1', apiKey: s.openaiApiKey, model: s.openaiModel, label: 'OpenAI' });
    case 'gemini':
      if (!s.geminiApiKey) throw new ProviderError('Gemini API key is missing — add it in Settings.');
      return new OpenAICompatProvider({
        id: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        apiKey: s.geminiApiKey,
        model: s.geminiModel,
        label: 'Gemini',
      });
    case 'ollama':
      return new OpenAICompatProvider({ id: 'ollama', baseUrl: s.ollamaBaseUrl || 'http://localhost:11434/v1', apiKey: '', model: s.ollamaModel, label: 'Ollama' });
    case 'custom': {
      const p = activeCustomProvider(s);
      if (!p) throw new ProviderError('No custom provider is configured — add one in Settings → Custom providers.');
      if (!p.baseUrl) throw new ProviderError(`Custom provider "${p.name}": base URL is missing.`);
      if (!p.model) throw new ProviderError(`Custom provider "${p.name}": model name is missing.`);
      return new OpenAICompatProvider({ id: 'custom', baseUrl: p.baseUrl, apiKey: p.apiKey, model: p.model, protocol: p.protocol, label: p.name || 'Custom provider' });
    }
  }
}

export { ProviderError } from './types.ts';
export type { Provider, RunRequest, TurnResult } from './types.ts';
