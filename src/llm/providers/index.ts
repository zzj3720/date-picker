import type { LLMProvider, ProviderId } from '../types'
import { OllamaProvider } from './ollama'
import { LMStudioProvider } from './lmstudio'
import { ChromeAIProvider } from './chrome-ai'
import { CloudProvidersProvider } from './cloud-providers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const providers: Record<ProviderId, LLMProvider<any>> = {
  cloud: new CloudProvidersProvider(),
  lmstudio: new LMStudioProvider(),
  ollama: new OllamaProvider(),
  'chrome-ai': new ChromeAIProvider(),
}

export const providerList = Object.values(providers)
