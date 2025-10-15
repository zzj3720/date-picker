import type { JSX } from 'react'
import type { z } from 'zod'

export type ProviderId =
  | 'ollama'
  | 'lmstudio'
  | 'chrome-ai'
  | 'cloud'
export type DateInputPreset = {
  label: string
  value: string
}

export type DateInterpretation = {
  value: string
  providerId: ProviderId | 'fallback'
  timezone?: string
  confidence?: number
  reasoning?: string
  rawResponse?: unknown
}

export type BaseInterpretRequest = {
  prompt: string
  locale?: string
  timezone?: string
  now?: Date
  signal?: AbortSignal
}

export type InterpretDateRequest<TConfig = unknown> = BaseInterpretRequest & {
  config: TConfig
}

export type ProviderConfigProps<TConfig = unknown> = {
  config: TConfig
  onChange: (config: TConfig) => void
}

export interface LLMProvider<TConfig = unknown> {
  readonly id: ProviderId
  readonly name: string
  readonly description: string
  readonly icon?: JSX.Element
  readonly shortName?: string
  readonly docsUrl?: string
  readonly configSchema: z.ZodType<TConfig>
  readonly defaultConfig: TConfig

  ConfigComponent: (props: ProviderConfigProps<TConfig>) => JSX.Element

  interpretDate(request: InterpretDateRequest<TConfig>): Promise<DateInterpretation>
}

export type ProviderConfig = {
  id: ProviderId
  name: string
  description: string
  docsUrl?: string
}

export type FallbackInterpreter = (payload: {
  prompt: string
  locale?: string
  timezone?: string
  now?: Date
}) => Promise<DateInterpretation | null>
