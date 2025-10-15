import type { JSX } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select'
import { CornerDownLeftIcon, Loader2Icon, AlertCircleIcon, SettingsIcon } from 'lucide-react'
import { DateInterpreter, fallbackInterpreter } from '../../llm/interpreter'
import type { LLMProvider, ProviderId } from '../../llm/types'
import { CloudProvidersContent } from '../../llm/providers/cloud-providers'

type LlmDatePickerProps = {
  providers: LLMProvider[]
  value?: Date | null
  onChange?: (date: Date | null) => void
}

const STORAGE_KEY = 'llm-date-picker-configs'

export function LlmDatePicker({ providers, value, onChange }: LlmDatePickerProps): JSX.Element {
  const [input, setInput] = useState('')
  const [activeProviderId, setActiveProviderId] = useState<ProviderId | null>(providers[0]?.id)
  const [providerConfigs, setProviderConfigs] = useState<Record<ProviderId, unknown>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return Object.fromEntries(providers.map((p) => [p.id, p.defaultConfig]))
  })
  const [configDialogProviderId, setConfigDialogProviderId] = useState<ProviderId | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [hasError, setHasError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const providerMap = useMemo(
    () => Object.fromEntries(providers.map((p) => [p.id, p])) as Record<ProviderId, LLMProvider>,
    [providers],
  )

  const interpreter = useMemo(
    () => new DateInterpreter({ providers: providerMap, fallback: fallbackInterpreter }),
    [providerMap],
  )

  const configuredProviders = useMemo(() => {
    return providers.filter((p) => p.configSchema.safeParse(providerConfigs[p.id]).success)
  }, [providers, providerConfigs])

  useEffect(() => {
    if (!activeProviderId && configuredProviders.length > 0) {
      setActiveProviderId(configuredProviders[0].id)
    }
  }, [activeProviderId, configuredProviders])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(providerConfigs))
    } catch {
      // ignore
    }
  }, [providerConfigs])

  const handleConfigChange = useCallback((providerId: ProviderId, config: unknown) => {
    setProviderConfigs((prev) => ({ ...prev, [providerId]: config }))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return

    // If no active provider, show cloud waitlist
    if (!activeProviderId) {
      setConfigDialogProviderId('cloud')
      return
    }

    // Check if selected provider is cloud
    if (activeProviderId === 'cloud') {
      setConfigDialogProviderId('cloud')
      return
    }

    // Check if provider is configured
    const provider = providerMap[activeProviderId]
    if (provider && !provider.configSchema.safeParse(providerConfigs[activeProviderId]).success) {
      // Not configured, show config dialog for this provider
      setConfigDialogProviderId(activeProviderId)
      return
    }

    try {
      setIsResolving(true)
      setHasError(false)
      const result = await interpreter.interpretDate({
        providerId: activeProviderId,
        config: providerConfigs[activeProviderId],
        prompt: input,
      })

      const date = new Date(result.value)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('❌ Failed to parse date from LLM response')
        console.error('Input:', input)
        console.error('Provider:', activeProviderId)
        console.error('Returned value:', result.value)
        console.error('Full response:', result)
        throw new Error('Invalid date')
      }
      onChange?.(date)
      // Keep user input in the text field
    } catch (error) {
      console.error('❌ Date interpretation error:', error)
      setHasError(true)
      onChange?.(null)
    } finally {
      setIsResolving(false)
    }
  }, [input, activeProviderId, providerConfigs, interpreter, onChange, providerMap])

  const formattedDate =
    value && !isNaN(value.getTime())
      ? value.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null

  const activeProvider = activeProviderId ? providerMap[activeProviderId] : null

  // Separate cloud and local providers
  const localProviders = useMemo(() => providers.filter((p) => p.id !== 'cloud'), [providers])
  const cloudProvider = useMemo(() => providers.find((p) => p.id === 'cloud'), [providers])

  // Check which providers are configured
  const providerConfigStatus = useMemo(() => {
    return Object.fromEntries(
      localProviders.map((p) => [p.id, p.configSchema.safeParse(providerConfigs[p.id]).success])
    )
  }, [localProviders, providerConfigs])

  const handleProviderSelect = (value: string) => {
    const providerId = value as ProviderId
    setActiveProviderId(providerId)
  }

  // Has configured providers - show normal input
  return (
    <div className="inline-flex w-full max-w-2xl flex-col">
      {/* Main Input Container */}
      <div className="flex h-10 w-full items-center rounded-md border border-primary/20 bg-gradient-to-r from-background to-primary/5 px-3 text-sm shadow-sm ring-offset-background transition-all focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-2 focus-within:shadow-md">
        {/* Prefix: Provider Selector */}
        <div className="flex items-center gap-1 group">
          <Select
            value={activeProviderId ?? cloudProvider?.id ?? ''}
            onValueChange={handleProviderSelect}
          >
            <SelectTrigger className="h-6 w-auto shrink-0 border-0 p-0 shadow-none focus:ring-0 [&>svg]:hidden">
              {activeProvider ? (
                <span className="text-xs font-semibold text-muted-foreground">{activeProvider.shortName || activeProvider.name}</span>
              ) : cloudProvider ? (
                <span className="text-xs font-semibold text-muted-foreground">{cloudProvider.shortName || cloudProvider.name}</span>
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">Select</span>
              )}
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => {
                const isConfigured = providerConfigStatus[provider.id]
                const isCloudProvider = cloudProvider && provider.id === cloudProvider.id
                
                return (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{provider.name}</span>
                      {isCloudProvider ? (
                        null
                      ) : isConfigured ? (
                        <span className="text-xs text-green-600">✓ Configured</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not configured</span>
                      )}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          
          {/* Config Status Indicator */}
          {activeProviderId && activeProviderId !== 'cloud' && (
            <>
              {providerConfigStatus[activeProviderId] ? (
                // Configured: Show gear icon on hover
                <button
                  onClick={() => setConfigDialogProviderId(activeProviderId)}
                  className="flex h-5 shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-accent/50 transition-all duration-200 max-w-0 group-hover:max-w-5 overflow-hidden"
                  title="Configure"
                >
                  <SettingsIcon className="h-3 w-3 text-muted-foreground" />
                </button>
              ) : (
                // Not configured: Always show
                <button
                  onClick={() => setConfigDialogProviderId(activeProviderId)}
                  className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
                  title="Configure provider"
                >
                  Not Configured
                </button>
              )}
            </>
          )}
        </div>

        {/* Divider */}
        <div className="mx-2 h-5 w-px bg-border" />

        {/* Input Area */}
        <div className="flex flex-1 items-center gap-2">
          {isResolving ? (
            <>
              <span className="flex shrink-0 items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <Loader2Icon className="h-3 w-3 animate-spin" />
                Parsing...
              </span>
              <div className="h-4 w-px bg-border" />
            </>
          ) : hasError ? (
            <>
              <span className="flex shrink-0 items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                <AlertCircleIcon className="h-3 w-3" />
                Parse failed
              </span>
              <div className="h-4 w-px bg-border" />
            </>
          ) : formattedDate ? (
            <>
              <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {formattedDate}
              </span>
              <div className="h-4 w-px bg-border" />
            </>
          ) : null}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              if (hasError) setHasError(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder={activeProviderId ? "tomorrow 3pm" : "Select a provider or enter to join waitlist..."}
            disabled={isResolving}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Postfix: Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isResolving}
          className="ml-2 flex h-6 w-6 items-center justify-center rounded hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          title={activeProviderId ? "Press Enter to submit" : "Press Enter to join waitlist"}
        >
          <CornerDownLeftIcon className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Individual Config Dialogs for each provider */}
      {providers.map((provider) => {
        const isCloudProvider = cloudProvider && provider.id === cloudProvider.id
        const ConfigComponent = provider.ConfigComponent
        
        return (
          <Dialog 
            key={provider.id}
            open={configDialogProviderId === provider.id} 
            onOpenChange={(open) => !open && setConfigDialogProviderId(null)}
          >
            <DialogContent className={`max-h-[90vh] overflow-y-auto ${isCloudProvider ? 'max-w-4xl' : 'max-w-3xl'}`}>
              <DialogHeader>
                <DialogTitle>{provider.name}</DialogTitle>
                <DialogDescription>
                  {isCloudProvider ? (
                    'Join the waitlist for cloud-hosted providers'
                  ) : (
                    <>
                      {provider.description}
                      {provider.docsUrl && (
                        <>
                          {' · '}
                          <a href={provider.docsUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            View Docs
                          </a>
                        </>
                      )}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              {isCloudProvider ? (
                <CloudProvidersContent />
              ) : (
                <ConfigComponent 
                  config={providerConfigs[provider.id] ?? provider.defaultConfig} 
                  onChange={(c) => {
                    handleConfigChange(provider.id, c)
                    // Auto-set as active provider when configured
                    const isValid = provider.configSchema.safeParse(c).success
                    if (isValid) {
                      setActiveProviderId(provider.id)
                    }
                  }} 
                />
              )}
            </DialogContent>
          </Dialog>
        )
      })}
    </div>
  )
}
