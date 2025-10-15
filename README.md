# LLM-Powered Date Picker

A flexible React date picker component that uses LLMs to parse natural language date inputs. Currently supports local AI providers: Chrome AI (built-in Gemini Nano), Ollama, and LM Studio. Cloud providers (OpenAI, Claude, Gemini, DeepSeek, Qwen, Doubao, OpenRouter) coming soon via waitlist.

🔗 **Live Demo**: [https://date-picker-mu-cyan.vercel.app/](https://date-picker-mu-cyan.vercel.app/)

🌟 **GitHub**: [https://github.com/zzj3720/date-picker](https://github.com/zzj3720/date-picker)

## Features

- **Natural Language Input**: Type dates in plain English (or any language your LLM supports)
- **Multiple LLM Providers**: Pluggable architecture with local AI providers
  - 💻 Local: Chrome AI (Gemini Nano), Ollama, LM Studio
  - ☁️ Cloud: Coming soon (join waitlist for OpenAI, Claude, Gemini, DeepSeek, Qwen, Doubao)
- **Chrome AI Support**: Use Chrome's built-in Gemini Nano for offline, privacy-focused AI
- **Simple Interface**: Clean UI showing only provider selection and date input
- **Configuration Dialog**: Configure all providers in individual dialogs
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
  const [date, setDate] = useState<Date | null>(null)

  return (
    <LlmDatePicker
      providers={providerList}
      value={date}
      onChange={(date) => setDate(date)}
    />
  )
}
```

## Supported Providers

### Cloud Providers (Coming Soon)

Cloud providers are currently in development. Join the waitlist to get early access when they become available:

- **OpenAI** (GPT-4o, GPT-4.1-mini, o4)
- **Anthropic Claude** (Claude 3.5 Sonnet, Claude 3.5 Haiku)
- **Google Gemini** (Gemini 2.0 Flash, Gemini Pro)
- **DeepSeek** (DeepSeek Chat, DeepSeek Reasoner)
- **Alibaba Qwen** (Qwen Long, Qwen Turbo)
- **ByteDance Doubao**

All cloud providers will be accessible through a unified API with flexible pricing plans (from free hobby tier to enterprise plans).

---

### Local Providers

Local AI providers run entirely on your device, ensuring privacy and zero API costs.

#### Chrome AI (Recommended for Privacy)
- **Model**: Chrome's built-in Gemini Nano
- **Privacy**: 100% offline, no data sent to servers
- **Cost**: Free, no API key needed
- **Setup**:
  1. Use Chrome 127+ (Dev/Canary recommended)
  2. Enable flag: `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`
  3. Restart Chrome
  4. Model downloads automatically (~1.7GB download, ~22GB total space needed)
  5. Verify: `await LanguageModel.availability()` in DevTools
- **Requirements**:
  - GPU with at least 4GB VRAM
  - ~22GB free storage space for the model
- **Status**: Check `chrome://on-device-internals`

📖 See [CHROME_AI_SETUP.md](./CHROME_AI_SETUP.md) for detailed setup instructions.

#### Ollama
- **Models**: `llama3.2:3b`, `qwen2.5`, `mistral`, etc.
- **Base URL**: `http://localhost:11434` (default)
- **Features**: Auto-fetch available models from your local Ollama instance
- **Setup**: [Install Ollama](https://ollama.com), pull models, and start the server

#### LM Studio
- **Description**: Self-hosted inference with OpenAI-compatible API
- **Base URL**: `http://localhost:1234/v1` (default)
- **Setup**: [Download LM Studio](https://lmstudio.ai), load models, and start the local server

## Architecture

The project uses a **pluggable provider architecture**:

```
src/llm/
├── types.ts              # Core interfaces
├── interpreter.ts        # Main interpreter + fallback
└── providers/
    ├── base.ts           # Abstract base class
    ├── cloud-providers.tsx # Cloud waitlist implementation
    ├── chrome-ai.tsx     # Chrome built-in AI implementation
    ├── ollama.tsx        # Ollama implementation
    ├── lmstudio.tsx      # LM Studio implementation
    ├── waitlist.tsx      # Waitlist components
    └── index.ts          # Provider registry
```

### Key Design

Each provider implements the `LLMProvider` interface:

```typescript
interface LLMProvider<TConfig = unknown> {
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
```

**No switch-case logic** - each provider encapsulates its own configuration UI and request handling.

## Adding a Custom Provider

1. Create a new provider class extending `BaseLLMProvider`:

```typescript
// src/llm/providers/my-provider.tsx
import { z } from 'zod'
import { BaseLLMProvider } from './base'
import type { DateInterpretation, InterpretDateRequest, ProviderId, ProviderConfigProps } from '../types'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

const myProviderConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  endpoint: z.string().url().optional(),
})

type MyProviderConfig = z.infer<typeof myProviderConfigSchema>

function MyProviderConfigComponent({ config, onChange }: ProviderConfigProps<MyProviderConfig>) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="apiKey">API Key</Label>
        <Input
          id="apiKey"
          type="password"
          value={config.apiKey ?? ''}
          onChange={(e) => onChange({ ...config, apiKey: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="endpoint">Endpoint (optional)</Label>
        <Input
          id="endpoint"
          value={config.endpoint ?? ''}
          onChange={(e) => onChange({ ...config, endpoint: e.target.value })}
          placeholder="https://api.myprovider.com/v1"
        />
      </div>
    </div>
  )
}

export class MyProvider extends BaseLLMProvider<MyProviderConfig> {
  readonly id: ProviderId = 'myprovider'
  readonly name = 'My Provider'
  readonly description = 'Custom LLM provider'
  readonly docsUrl = 'https://docs.myprovider.com'
  readonly configSchema = myProviderConfigSchema
  readonly defaultConfig: MyProviderConfig = { apiKey: '' }

  ConfigComponent = MyProviderConfigComponent

  private readonly baseUrl = 'https://api.myprovider.com/v1'

  async interpretDate(request: InterpretDateRequest<MyProviderConfig>): Promise<DateInterpretation> {
    const { prompt, config, timezone, now = new Date(), signal } = request

    // Implement your API call here
    const response = await fetch(config.endpoint ?? this.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
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

2. Add the ID to the `ProviderId` type in `src/llm/types.ts`:

```typescript
export type ProviderId =
  | 'ollama'
  | 'lmstudio'
  | 'chrome-ai'
  | 'cloud'
  | 'myprovider'  // Add your new provider ID
```

3. Register it in `src/llm/providers/index.ts`:

```typescript
import { MyProvider } from './my-provider'

export const providers: Record<ProviderId, LLMProvider<any>> = {
  cloud: new CloudProvidersProvider(),
  lmstudio: new LMStudioProvider(),
  ollama: new OllamaProvider(),
  'chrome-ai': new ChromeAIProvider(),
  myprovider: new MyProvider(),  // Add your new provider
}
```

## Quick Start

### Try Chrome AI (No API Key Needed!)

1. Clone the repository:
```bash
git clone https://github.com/zzj3720/date-picker.git
cd date-picker
```

2. Install dependencies:
```bash
npm install
```

3. Start dev server:
```bash
npm run dev
```

4. Open in Chrome 127+ and enable Chrome AI (see [CHROME_AI_SETUP.md](./CHROME_AI_SETUP.md))

5. Select "Chrome AI" provider and start typing natural language dates!

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

## API Response Format

All providers return a standardized `DateInterpretation`:

```typescript
type DateInterpretation = {
  value: string                      // ISO 8601 date string
  providerId: ProviderId | 'fallback' // Which provider was used
  timezone?: string                  // IANA timezone
  confidence?: number                // 0-1 confidence score
  reasoning?: string                 // LLM's explanation
  rawResponse?: unknown              // Original API response
}
```

## Why Use This?

- **Privacy-First**: Chrome AI runs 100% offline with zero data collection
- **Cost-Effective**: No API costs for local providers
- **Flexible**: Switch between providers based on your needs
- **Modern**: Built with latest React, TypeScript, and Tailwind CSS
- **Extensible**: Easy to add custom providers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT

## Credits

- UI: [shadcn/ui](https://ui.shadcn.com/)
- Date parsing fallback: [chrono-node](https://github.com/wanasit/chrono)
- Icons: [Lucide React](https://lucide.dev/)
- Chrome AI: [Built-in AI Documentation](https://developer.chrome.com/docs/ai/built-in)

## Star History

If you find this project useful, please consider giving it a ⭐️ on [GitHub](https://github.com/zzj3720/date-picker)!
