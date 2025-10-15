/* eslint-disable react-refresh/only-export-components */
import type { JSX } from 'react'
import { z } from 'zod'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import type { DateInterpretation, InterpretDateRequest, ProviderId, ProviderConfigProps } from '../types'
import { BaseLLMProvider } from './base'

const lmStudioConfigSchema = z.object({
  baseUrl: z.url('Must be a valid URL').min(1, 'Base URL is required'),
  model: z.string().optional(),
})

type LMStudioConfig = z.infer<typeof lmStudioConfigSchema>

function LMStudioConfigComponent({ config, onChange }: ProviderConfigProps<LMStudioConfig>): JSX.Element {
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="llmstudio-base-url">
          Base URL <span className="text-destructive">*</span>
        </Label>
        <Input
          id="llmstudio-base-url"
          type="url"
          placeholder="http://localhost:1234/v1"
          value={config.baseUrl}
          onChange={(e) => onChange({ ...config, baseUrl: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Local self-hosted LLM endpoint</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lmstudio-model">Model</Label>
        <Input
          id="lmstudio-model"
          placeholder="openai/gpt-oss-20b"
          value={config.model ?? ''}
          onChange={(e) => onChange({ ...config, model: e.target.value })}
        />
      </div>
    </div>
  )
}

export class LMStudioProvider extends BaseLLMProvider<LMStudioConfig> {
  readonly id: ProviderId = 'lmstudio'
  readonly name = 'LMStudio'
  readonly shortName = 'LMStudio'
  readonly description = 'Self-hosted inference with OpenAI-compatible APIs.'
  readonly docsUrl = 'https://lmstudio.ai'
  readonly configSchema = lmStudioConfigSchema
  readonly defaultConfig: LMStudioConfig = { baseUrl: '', model: 'openai/gpt-oss-20b' }

  ConfigComponent = LMStudioConfigComponent

  async interpretDate(request: InterpretDateRequest<LMStudioConfig>): Promise<DateInterpretation> {
    const { prompt, timezone, now = new Date(), signal, config } = request

    const validation = this.configSchema.safeParse(config)
    if (!validation.success) {
      throw new Error(`Invalid config: ${validation.error.message}`)
    }

    const requestBody = {
      model: validation.data.model || this.defaultConfig.model,
      response_format: { type: 'json_schema' as const, json_schema: this.getResponseSchema() },
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt({ timezone, now }),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }

    const response = await fetch(`${validation.data.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal,
    })

    if (!response.ok) {
      throw new Error(`LLMStudio request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    return this.parseResponse(content, data)
  }
}
