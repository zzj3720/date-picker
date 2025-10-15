import { useState } from 'react'
import { LlmDatePicker } from './components/date-picker/LlmDatePicker'
import { providerList } from './llm/providers'
import { SparklesIcon } from 'lucide-react'
import './App.css'

export default function App() {
  const [date, setDate] = useState<Date | null>(null)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-br from-background via-background to-primary/5 p-4">
      {/* GitHub Link */}
      <a
        href="https://github.com/zzj3720/date-picker"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-4 right-4 p-2 rounded-lg hover:bg-accent transition-colors"
        title="View on GitHub"
        aria-label="View source on GitHub"
      >
        <svg
          className="h-6 w-6 text-foreground"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      </a>

      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <div className="relative">
            <SparklesIcon className="h-8 w-8 text-primary animate-pulse" />
            <SparklesIcon className="absolute inset-0 h-8 w-8 text-primary/30 animate-ping" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI Native
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Natural language → Precise datetime • Powered by LLM
        </p>
      </div>

      <LlmDatePicker providers={providerList} value={date} onChange={setDate} />

    </div>
  )
}
