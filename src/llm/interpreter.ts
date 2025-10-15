import { parse as chronoParse } from 'chrono-node'
import type { DateInterpretation, FallbackInterpreter, InterpretDateRequest, LLMProvider, ProviderId } from './types'

type DateInterpreterConfig = {
  providers: Record<ProviderId, LLMProvider>
  fallback?: FallbackInterpreter
}

type InterpretOptions = InterpretDateRequest & {
  providerId: ProviderId
}

export class DateInterpreter {
  private readonly config: DateInterpreterConfig

  public constructor(config: DateInterpreterConfig) {
    this.config = config
  }

  async interpretDate(options: InterpretOptions): Promise<DateInterpretation> {
    const { providerId, config: providerConfig, ...rest } = options
    const provider = this.config.providers[providerId]

    if (!provider) {
      throw new Error(`Provider ${providerId} is not configured.`)
    }

    // Validate config with provider's schema
    const validation = provider.configSchema.safeParse(providerConfig)
    
    if (!validation.success) {
      // If validation fails, try fallback
      const fallback = await this.runFallback({
        prompt: rest.prompt,
        locale: rest.locale,
        timezone: rest.timezone,
        now: rest.now,
      })
      if (!fallback) {
        throw new Error(`Invalid configuration: ${validation.error.message}`)
      }
      return fallback
    }

    return provider.interpretDate({ ...rest, config: validation.data })
  }

  private async runFallback(payload: Parameters<FallbackInterpreter>[0]): Promise<DateInterpretation | null> {
    if (!this.config.fallback) {
      return null
    }

    return this.config.fallback(payload)
  }
}

export const fallbackInterpreter: FallbackInterpreter = async ({ prompt, timezone, now }) => {
  const parsed = chronoParse(prompt, now ?? new Date(), { forwardDate: true })
  if (!parsed.length) {
    return null
  }

  const best = parsed[0]
  const date = best.date()

  return {
    providerId: 'fallback',
    value: date.toISOString(),
    timezone: timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    confidence: 0.2,
    reasoning: 'Fallback parser with chrono-node',
    rawResponse: best,
  }
}
