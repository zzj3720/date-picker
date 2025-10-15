/* eslint-disable react-refresh/only-export-components */
import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Label } from '../../components/ui/label'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react'
import type { DateInterpretation, InterpretDateRequest, ProviderId, ProviderConfigProps } from '../types'
import { BaseLLMProvider } from './base'

// Extend global interface to include Chrome AI API
declare global {
  interface LanguageModelAvailability {
    available: 'readily' | 'after-download' | 'no'
    defaultTopK?: number
    maxTopK?: number
    defaultTemperature?: number
  }

  interface LanguageModel {
    availability(): Promise<LanguageModelAvailability>
    create(options?: {
      systemPrompt?: string
      temperature?: number
      topK?: number
    }): Promise<LanguageModelSession>
  }

  interface LanguageModelSession {
    prompt(input: string): Promise<string>
    promptStreaming(input: string): ReadableStream
    destroy(): void
  }

  const LanguageModel: LanguageModel
}

const chromeAIConfigSchema = z.object({
  temperature: z.number().min(0).max(1).optional(),
  topK: z.number().min(1).max(8).optional(),
})

type ChromeAIConfig = z.infer<typeof chromeAIConfigSchema>

type AvailabilityStatus = 'checking' | 'available' | 'downloading' | 'unavailable' | 'unsupported'

function ChromeAIConfigComponent({ config, onChange }: ProviderConfigProps<ChromeAIConfig>): JSX.Element {
  const [availability, setAvailability] = useState<AvailabilityStatus>('checking')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  useEffect(() => {
    checkAvailability()
  }, [])

  const checkAvailability = async () => {
    try {
      if (typeof LanguageModel === 'undefined') {
        setAvailability('unsupported')
        setErrorMessage(
          'Chrome AI is not available. Please use Chrome 127+ and enable the feature flags.'
        )
        return
      }

      const capabilities = await LanguageModel.availability()
      
      if (capabilities.available === 'readily') {
        setAvailability('available')
      } else if (capabilities.available === 'after-download') {
        setAvailability('downloading')
        setErrorMessage('The AI model needs to be downloaded. Please visit chrome://components/ and click "Check for update" on "Optimization Guide On Device Model" component.')
      } else {
        setAvailability('unavailable')
        setErrorMessage('Chrome AI is not available on this device.')
      }
    } catch (error) {
      setAvailability('unsupported')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to check Chrome AI availability')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedUrl(text)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const CopyButton = ({ url }: { url: string }) => {
    const isCopied = copiedUrl === url
    return (
      <button
        onClick={() => copyToClipboard(url)}
        className="inline-flex items-center gap-1 ml-1 text-primary hover:text-primary/80 transition-colors"
        title="Click to copy"
      >
        {isCopied ? (
          <>
            <Check className="h-3 w-3" />
            <span className="text-green-600">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" />
            <span className="underline">{url}</span>
          </>
        )}
      </button>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2">
        <Label>Status</Label>
        {availability === 'checking' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Checking Chrome AI availability...</AlertDescription>
          </Alert>
        )}
        {availability === 'available' && (
          <Alert className="border-green-200 bg-green-50 text-green-900">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Chrome AI is ready to use</AlertDescription>
          </Alert>
        )}
        {availability === 'downloading' && (
          <Alert className="border-yellow-200 bg-yellow-50 text-yellow-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        {(availability === 'unavailable' || availability === 'unsupported') && (
          <Alert className="border-red-200 bg-red-50 text-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="chrome-ai-temperature">Temperature (optional)</Label>
        <input
          id="chrome-ai-temperature"
          type="number"
          min="0"
          max="1"
          step="0.1"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="0.8"
          value={config.temperature ?? ''}
          onChange={(e) => {
            const value = e.target.value ? parseFloat(e.target.value) : undefined
            onChange({ ...config, temperature: value })
          }}
        />
        <p className="text-xs text-muted-foreground">
          Controls randomness (0-1). Lower is more deterministic.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="chrome-ai-topk">Top K (optional)</Label>
        <input
          id="chrome-ai-topk"
          type="number"
          min="1"
          max="8"
          step="1"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="3"
          value={config.topK ?? ''}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : undefined
            onChange({ ...config, topK: value })
          }}
        />
        <p className="text-xs text-muted-foreground">
          Number of tokens to consider (1-8). Lower gives more focused results.
        </p>
      </div>

      <div className="rounded-lg border p-4 text-xs text-muted-foreground">
        <p className="font-semibold mb-2">Setup Instructions:</p>
        <ol className="list-decimal space-y-2">
          <li className="ml-4">Use Chrome 127+ (Dev or Canary recommended)</li>
          <li className="ml-4">
            Enable: <CopyButton url="chrome://flags/#prompt-api-for-gemini-nano-multimodal-input" />
          </li>
          <li className="ml-4">Restart Chrome</li>
          <li className="ml-4">
            Go to <CopyButton url="chrome://on-device-internals" /> to check model status
          </li>
          <li className="ml-4">
            Open DevTools Console and run: <code className="text-primary">await LanguageModel.availability()</code>
          </li>
          <li className="ml-4">Should return <code className="text-green-600">{`{ available: "readily" }`}</code></li>
        </ol>
        <div className="mt-3 pt-3 border-t text-muted-foreground/70">
          <p className="font-medium mb-1">Requirements:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>22 GB free storage space</li>
            <li>GPU with &gt;4GB VRAM or 16GB+ RAM with 4+ CPU cores</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export class ChromeAIProvider extends BaseLLMProvider<ChromeAIConfig> {
  readonly id: ProviderId = 'chrome-ai'
  readonly name = 'Chrome AI'
  readonly shortName = 'Chrome AI'
  readonly description = 'Use Chrome built-in Gemini Nano model (local)'
  readonly docsUrl = 'https://developer.chrome.com/docs/ai/built-in'
  readonly configSchema = chromeAIConfigSchema
  readonly defaultConfig: ChromeAIConfig = { temperature: 0.8, topK: 3 }

  ConfigComponent = ChromeAIConfigComponent

  async interpretDate(request: InterpretDateRequest<ChromeAIConfig>): Promise<DateInterpretation> {
    const { prompt, timezone, now = new Date(), config } = request

    // Check if Chrome AI is available
    if (typeof LanguageModel === 'undefined') {
      throw new Error(
        'Chrome AI is not available. Please use Chrome 127+ and enable the required feature flags.'
      )
    }

    const availability = await LanguageModel.availability()
    if (availability.available !== 'readily') {
      throw new Error(
        'Chrome AI model is not ready. Please check chrome://on-device-internals for model status.'
      )
    }

    const validation = this.configSchema.safeParse(config)
    if (!validation.success) {
      throw new Error(`Invalid config: ${validation.error.message}`)
    }

    // Create session with system prompt
    const systemPrompt = this.getSystemPrompt({ timezone, now })
    
    let session: LanguageModelSession | null = null
    try {
      session = await LanguageModel.create({
        systemPrompt,
        temperature: validation.data.temperature,
        topK: validation.data.topK,
      })

      // Chrome AI doesn't support structured output natively,
      // so we'll ask for JSON in the prompt
      const fullPrompt = `${prompt}

IMPORTANT: You must respond with ONLY valid JSON in this exact format (no additional text):
{
  "value": "YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss",
  "timezone": "timezone string or null",
  "confidence": number between 0-1,
  "reasoning": "brief explanation"
}`

      const response = await session.prompt(fullPrompt)
      
      // Parse the JSON response
      return this.parseResponse(response, { rawResponse: response })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Chrome AI request failed: ${error.message}`)
      }
      throw error
    } finally {
      // Clean up session
      if (session) {
        session.destroy()
      }
    }
  }
}

