# LLM-Powered Date Picker

A flexible React date picker component that uses LLMs to parse natural language date inputs. Supports multiple LLM providers including OpenAI, Claude, Gemini, DeepSeek, Qwen, Doubao, OpenRouter, Chrome AI (built-in Gemini Nano), LLM Studio, and Ollama.

## Features

- **Natural Language Input**: Type dates in plain English (or any language your LLM supports)
- **Multiple LLM Providers**: Pluggable architecture supporting 8+ providers
- **Simple Interface**: Clean UI showing only provider selection and date input
- **Configuration Dialog**: Configure all providers in a modal with vertical tabs
- **Persistent Configuration**: All provider configs saved in localStorage
- **Visual Indicators**: See which providers are configured at a glance
- **Fallback Parser**: Falls back to `chrono-node` when configuration is invalid
- **TypeScript**: Full type safety with TypeScript
- **Modern UI**: Built with shadcn/ui and Tailwind CSS
- **Flexible**: Easy to extend with custom providers

## Installation

```bash
npm install
```

## Usage

### Basic Example

```tsx
import { LlmDatePicker } from './components/date-picker/LlmDatePicker'
import { providerList } from './llm/providers'

function App() {
  const [date, setDate] = useState<DateInterpretation | null>(null)

  return (
    <LlmDatePicker
      providers={providerList}
      onInterpretationChange={(value) => setDate(value)}
    />
  )
}
```

### With Presets

```tsx
const presets = [
  { label: 'Tomorrow 9am', value: '2025-10-16T09:00:00Z' },
  { label: 'Next Monday', value: '2025-10-20T00:00:00Z' },
]

<LlmDatePicker
  providers={providerList}
  presets={presets}
  onInterpretationChange={(value) => setDate(value)}
/>
```

## Supported Providers

### OpenAI
- Models: `gpt-4.1-mini`, `gpt-4o`, `o4`
- Endpoint: `https://api.openai.com/v1`

### Anthropic Claude
- Models: `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`
- Endpoint: `https://api.anthropic.com/v1`

### Google Gemini
- Models: `gemini-2.0-flash-exp`, `gemini-pro`
- Endpoint: `https://generativelanguage.googleapis.com/v1beta`

### DeepSeek
- Models: `deepseek-chat`, `deepseek-reasoner`
- Endpoint: `https://api.deepseek.com/v1`

### Alibaba Qwen
- Models: `qwen-long`, `qwen-turbo`
- Endpoint: `https://dashscope.aliyuncs.com/compatible-mode/v1`

### ByteDance Doubao
- Models: `ep-20241019-121424-64k`
- Endpoint: `https://ark.cn-beijing.volces.com/api/v3`

### OpenRouter
- Models: `openrouter/auto` (auto-routes to best model)
- Endpoint: `https://openrouter.ai/api/v1`

### Chrome AI (Local)
- Uses Chrome's built-in Gemini Nano model (Chrome 140+ supports English, Spanish, Japanese)
- No API key or endpoint required
- Runs completely offline in the browser
- Requirements:
  - Chrome 127+ (Dev or Canary recommended, Chrome 140+ for best experience)
  - Enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`
  - 22 GB free storage space
  - GPU with >4GB VRAM or 16GB+ RAM with 4+ CPU cores
  - Check status at `chrome://on-device-internals`

### Ollama (Local)
- Run open-source LLMs locally
- Models: `llama3.2:3b`, `qwen2.5`, etc.
- Endpoint: `http://localhost:11434`

### LLMStudio (Local)
- Self-hosted inference endpoint
- Endpoint: `http://localhost:1234/v1`

## Architecture

The project uses a **pluggable provider architecture**:

```
src/llm/
├── types.ts              # Core interfaces
├── interpreter.ts        # Main interpreter + fallback
└── providers/
    ├── base.ts           # Abstract base class
    ├── cloud-providers.tsx # Cloud providers (OpenAI, Claude, Gemini, etc.)
    ├── chrome-ai.tsx     # Chrome built-in AI implementation
    ├── ollama.tsx        # Ollama implementation
    ├── lmstudio.tsx      # LMStudio implementation
    └── index.ts          # Provider registry
```

### Key Design

Each provider implements the `LLMProvider` interface:

```typescript
interface LLMProvider {
  readonly id: ProviderId
  readonly name: string
  readonly description: string
  readonly defaultModel?: string
  readonly docsUrl?: string

  interpretDate(request: InterpretDateRequest): Promise<DateInterpretation>
}
```

**No switch-case logic** - each provider encapsulates its own configuration and request handling.

## Adding a Custom Provider

1. Create a new provider class extending `BaseLLMProvider`:

```typescript
// src/llm/providers/my-provider.ts
import { BaseLLMProvider } from './base'
import type { DateInterpretation, InterpretDateRequest, ProviderId } from '../types'

export class MyProvider extends BaseLLMProvider {
  readonly id: ProviderId = 'myprovider'
  readonly name = 'My Provider'
  readonly description = 'Custom LLM provider'
  readonly defaultModel = 'my-model-v1'
  readonly docsUrl = 'https://docs.myprovider.com'

  private readonly baseUrl = 'https://api.myprovider.com/v1'

  async interpretDate(request: InterpretDateRequest): Promise<DateInterpretation> {
    const { prompt, apiKey, model, timezone, now = new Date(), signal } = request

    // Implement your API call here
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model ?? this.defaultModel,
        messages: [
          { role: 'system', content: this.getSystemPrompt({ timezone, now }) },
          { role: 'user', content: prompt },
        ],
      }),
      signal,
    })

    const data = await response.json()
    return this.parseResponse(data.choices[0].message.content, data)
  }
}
```

2. Register it in `src/llm/providers/index.ts`:

```typescript
import { MyProvider } from './my-provider'

export const providers: Record<ProviderId, LLMProvider> = {
  // ... existing providers
  myprovider: new MyProvider(),
}
```

3. Add the ID to the `ProviderId` type in `src/llm/types.ts`:

```typescript
export type ProviderId =
  | 'openai'
  | 'anthropic'
  // ... other providers
  | 'myprovider'
```

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

## API Response Format

All providers return a standardized `DateInterpretation`:

```typescript
type DateInterpretation = {
  value: string              // ISO 8601 date string
  providerId: ProviderId     // Which provider was used
  timezone?: string          // IANA timezone
  confidence?: number        // 0-1 confidence score
  reasoning?: string         // LLM's explanation
  rawResponse?: unknown      // Original API response
}
```

## License

MIT

## Credits

- UI: [shadcn/ui](https://ui.shadcn.com/)
- Date parsing fallback: [chrono-node](https://github.com/wanasit/chrono)
- Icons: [Lucide React](https://lucide.dev/)
