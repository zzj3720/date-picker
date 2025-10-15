import { formatISO } from 'date-fns'
import type { JSX } from 'react'
import type { z } from 'zod'
import type { DateInterpretation, InterpretDateRequest, LLMProvider, ProviderId, ProviderConfigProps } from '../types'

export abstract class BaseLLMProvider<TConfig = unknown> implements LLMProvider<TConfig> {
  abstract readonly id: ProviderId
  abstract readonly name: string
  abstract readonly description: string
  abstract readonly docsUrl?: string
  abstract readonly configSchema: z.ZodType<TConfig>
  abstract readonly defaultConfig: TConfig

  abstract ConfigComponent: (props: ProviderConfigProps<TConfig>) => JSX.Element

  abstract interpretDate(request: InterpretDateRequest<TConfig>): Promise<DateInterpretation>

  protected getSystemPrompt(context: { timezone?: string; now: Date }): string {
    const timezone = context.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
    const nowISO = formatISO(context.now)

    return `You are a date parsing assistant. Interpret natural language date expressions and respond strictly in JSON.

CRITICAL RULES:
- You MUST output a complete, specific, parseable date and time (year, month, day, hour, minute, second).
- You MUST use valid ISO 8601 format with timezone: YYYY-MM-DDTHH:mm:ss±HH:mm
  * Example: 2025-10-15T12:30:00+08:00
  * Note: HH, mm, ss are all 2 digits (00-23, 00-59, 00-59)
  * WRONG: 2025-10-04T00:0000+08:00 (4 digits for seconds)
  * RIGHT: 2025-10-04T00:00:00+08:00 (2 digits for each component)
- NEVER output vague, ambiguous, or unparseable values like "tomorrow", "next week", "soon", "later", etc.
- NEVER output relative time expressions or text descriptions.
- ALWAYS output an actual ISO 8601 timestamp that can be parsed by new Date().

Resolution rules for vague inputs:
- "tomorrow" → calculate tomorrow's date at 00:00:00
- "next week" → calculate next Monday at 00:00:00
- "March" → next March 1st at 00:00:00
- "3pm" → today at 15:00:00
- "afternoon" → today at 12:00:00
- "this weekend" → this Saturday at 00:00:00

Context:
- If timezone is missing, assume ${timezone}
- Current reference time: ${nowISO}
- Output must follow the provided JSON schema

REMEMBER: The "value" field MUST be a valid ISO 8601 string that JavaScript's new Date() can parse successfully.`
  }

  protected getResponseSchema() {
    return {
      name: 'DateInterpretation',
      schema: {
        type: 'object',
        required: ['value'],
        properties: {
          value: {
            type: 'string',
            description:
              'REQUIRED: A valid, parseable ISO 8601 date string with timezone. Format: YYYY-MM-DDTHH:mm:ss±HH:mm (e.g., 2025-10-15T12:30:00+08:00). Must be parseable by JavaScript Date constructor. NEVER use relative terms like "tomorrow" or "next week".',
          },
          timezone: {
            type: 'string',
            description: 'Named IANA timezone of the resolved date (e.g., "Asia/Shanghai").',
          },
          confidence: {
            type: 'number',
            description: 'Confidence score between 0 and 1.',
          },
          reasoning: {
            type: 'string',
            description: 'Brief explanation of how the date was interpreted.',
          },
        },
        additionalProperties: true,
      },
    }
  }

  protected parseResponse(candidate: unknown, rawResponse: unknown): DateInterpretation {
    const parsed = this.safeValidate(candidate)

    if (!parsed?.value || typeof parsed.value !== 'string') {
      console.error('❌ LLM response missing ISO value')
      console.error('Provider:', this.id)
      console.error('Candidate:', candidate)
      console.error('Raw response:', rawResponse)
      throw new Error('LLM response missing ISO value.')
    }

    return {
      providerId: this.id,
      value: parsed.value as string,
      timezone: typeof parsed.timezone === 'string' ? parsed.timezone : undefined,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : undefined,
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : undefined,
      rawResponse,
    }
  }

  protected safeValidate(candidate: unknown): Record<string, unknown> | null {
    if (typeof candidate === 'string') {
      try {
        return JSON.parse(candidate) as Record<string, unknown>
      } catch {
        return null
      }
    }

    if (candidate && typeof candidate === 'object') {
      return candidate as Record<string, unknown>
    }

    return null
  }
}
