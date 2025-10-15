/* eslint-disable react-refresh/only-export-components */
import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Loader2Icon } from 'lucide-react'
import type { DateInterpretation, InterpretDateRequest, ProviderId, ProviderConfigProps } from '../types'
import { BaseLLMProvider } from './base'

const ollamaConfigSchema = z.object({
  baseUrl: z.url('Must be a valid URL').min(1, 'Base URL is required'),
  model: z.string().optional(),
})

type OllamaConfig = z.infer<typeof ollamaConfigSchema>

type ModelData = {
  name: string
  modified_at: string
  size: number
}

function OllamaConfigComponent({ config, onChange }: ProviderConfigProps<OllamaConfig>): JSX.Element {
  const [models, setModels] = useState<ModelData[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)

  const fetchModels = async () => {
    if (!config.baseUrl) {
      setModelError('Please enter base URL first')
      return
    }

    try {
      setIsLoadingModels(true)
      setModelError(null)

      const response = await fetch(`${config.baseUrl}/api/tags`)

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`)
      }

      const data = await response.json()
      const modelList = (data.models || []) as ModelData[]
      setModels(modelList)
    } catch (error) {
      setModelError(error instanceof Error ? error.message : 'Failed to load models')
      console.error('Failed to fetch Ollama models:', error)
    } finally {
      setIsLoadingModels(false)
    }
  }

  useEffect(() => {
    if (config.baseUrl && models.length === 0) {
      fetchModels()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.baseUrl])

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="ollama-base-url">
          Base URL <span className="text-destructive">*</span>
        </Label>
        <Input
          id="ollama-base-url"
          type="url"
          placeholder="http://localhost:11434"
          value={config.baseUrl}
          onChange={(e) => onChange({ ...config, baseUrl: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Local Ollama server endpoint</p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="ollama-model">Model</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchModels}
            disabled={!config.baseUrl || isLoadingModels}
            className="h-auto px-2 py-1 text-xs"
          >
            {isLoadingModels ? (
              <>
                <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />
                Loading...
              </>
            ) : (
              'Fetch Models'
            )}
          </Button>
        </div>
        {models.length > 0 ? (
          <Select value={config.model || ''} onValueChange={(value) => onChange({ ...config, model: value })}>
            <SelectTrigger id="ollama-model">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.name} value={model.name}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="ollama-model"
            placeholder="llama3.2:3b"
            value={config.model ?? ''}
            onChange={(e) => onChange({ ...config, model: e.target.value })}
          />
        )}
        {modelError && <p className="text-xs text-destructive">{modelError}</p>}
      </div>
    </div>
  )
}

export class OllamaProvider extends BaseLLMProvider<OllamaConfig> {
  readonly id: ProviderId = 'ollama'
  readonly name = 'Ollama'
  readonly shortName = 'Ollama'
  readonly description = 'Run LLMs locally with Ollama'
  readonly docsUrl = 'https://ollama.com'
  readonly configSchema = ollamaConfigSchema
  readonly defaultConfig: OllamaConfig = { baseUrl: '', model: 'llama3.2:3b' }

  ConfigComponent = OllamaConfigComponent

  async interpretDate(request: InterpretDateRequest<OllamaConfig>): Promise<DateInterpretation> {
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
      stream: false,
    }

    const response = await fetch(`${validation.data.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText}\n${errorText}`)
    }

    const data = await response.json()
    const content = data?.message?.content

    return this.parseResponse(content, data)
  }
}

