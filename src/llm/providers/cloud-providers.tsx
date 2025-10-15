import type { JSX } from 'react'
import { useState } from 'react'
import { z } from 'zod'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { CheckIcon, Loader2Icon } from 'lucide-react'
import type { DateInterpretation, ProviderId, ProviderConfigProps } from '../types'
import { BaseLLMProvider } from './base'

const cloudConfigSchema = z.object({
  email: z.email('Must be a valid email').optional(),
})

type CloudConfig = z.infer<typeof cloudConfigSchema>

const pricingPlans = [
  {
    name: 'Hobby',
    price: '$0',
    period: 'forever',
    description: 'Perfect for personal projects',
    features: [
      '1,000 requests/month',
      'Access to all LLM providers',
      'Basic support',
      'Community access',
    ],
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    description: 'For professional developers',
    features: [
      '50,000 requests/month',
      'Access to all LLM providers',
      'Priority support',
      'Advanced analytics',
      'Custom rate limits',
    ],
    popular: true,
  },
  {
    name: 'Ultra',
    price: '$99',
    period: 'per month',
    description: 'For power users',
    features: [
      'Unlimited requests',
      'Access to all LLM providers',
      'Priority support',
      'Advanced analytics',
      'Custom rate limits',
      'Dedicated account manager',
    ],
  },
  {
    name: 'Teams',
    price: '$299',
    period: 'per month',
    description: 'For growing teams',
    features: [
      'Everything in Ultra',
      'Team management',
      'SSO & SAML',
      'Audit logs',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'For large organizations',
    features: [
      'Everything in Teams',
      'Custom deployment',
      'On-premise option',
      'Custom contracts',
      'Dedicated infrastructure',
      'White-label solution',
    ],
  },
]

export function CloudProvidersContent(): JSX.Element {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (email && z.string().email().safeParse(email).success) {
      setIsSubmitting(true)
      
      // Simulate API call with random delay (1-2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))
      
      console.log('Waitlist email:', email)
      setIsSubmitting(false)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-lg border border-primary/20 bg-primary/5 p-8 text-center">
        <div className="text-6xl">🎉</div>
        <div>
          <h3 className="text-2xl font-bold">You're on the waitlist!</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            We'll notify you at <span className="font-medium text-foreground">{email}</span>
            <br />
            when cloud providers become available.
          </p>
        </div>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Update Email
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Waitlist Form */}
      <div className="flex flex-col gap-4 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
        <div className="text-center">
          <div className="mb-3 text-4xl">☁️</div>
          <h3 className="text-xl font-bold">Cloud Providers Coming Soon</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Access all major LLM providers through a unified API
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {['OpenAI', 'Claude', 'Gemini', 'DeepSeek', 'Qwen', 'Doubao'].map((name) => (
              <span key={name} className="rounded-full bg-background px-3 py-1 text-xs font-medium">
                {name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cloud-email">Email Address</Label>
          <Input
            id="cloud-email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button onClick={handleSubmit} disabled={!email || isSubmitting} className="w-full" size="lg">
          {isSubmitting ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            'Join Waitlist'
          )}
        </Button>
      </div>

      {/* Pricing Section */}
      <div>
        <div className="mb-6 text-center">
          <h3 className="text-lg font-bold">Pricing Plans</h3>
          <p className="text-sm text-muted-foreground">Choose the plan that fits your needs</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-lg border p-6 ${
                plan.popular
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border bg-card'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}
              <div className="mb-4">
                <h4 className="text-lg font-bold">{plan.name}</h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="ml-2 text-sm text-muted-foreground">/{plan.period}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <ul className="flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Enterprise CTA */}
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <h4 className="font-semibold">Need a custom solution?</h4>
        <p className="mt-2 text-sm text-muted-foreground">
          Contact our sales team for enterprise pricing and custom deployments
        </p>
        <Button variant="outline" className="mt-4">
          Contact Sales
        </Button>
      </div>
    </div>
  )
}

function CloudProvidersConfigComponent({ config, onChange }: ProviderConfigProps<CloudConfig>): JSX.Element {
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (config.email && z.string().email().safeParse(config.email).success) {
      setIsSubmitting(true)
      
      // Simulate API call with random delay (1-2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))
      
      console.log('Waitlist email:', config.email)
      setIsSubmitting(false)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-lg border border-primary/20 bg-primary/5 p-8 text-center">
        <div className="text-6xl">🎉</div>
        <div>
          <h3 className="text-2xl font-bold">You're on the waitlist!</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            We'll notify you at <span className="font-medium text-foreground">{config.email}</span>
            <br />
            when cloud providers become available.
          </p>
        </div>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Update Email
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Waitlist Form */}
      <div className="flex flex-col gap-4 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
        <div className="text-center">
          <div className="mb-3 text-4xl">☁️</div>
          <h3 className="text-xl font-bold">Cloud Providers Coming Soon</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Access all major LLM providers through a unified API
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {['OpenAI', 'Claude', 'Gemini', 'DeepSeek', 'Qwen', 'Doubao'].map((name) => (
              <span key={name} className="rounded-full bg-background px-3 py-1 text-xs font-medium">
                {name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cloud-email">Email Address</Label>
          <Input
            id="cloud-email"
            type="email"
            placeholder="your@email.com"
            value={config.email ?? ''}
            onChange={(e) => onChange({ ...config, email: e.target.value })}
          />
        </div>
        <Button onClick={handleSubmit} disabled={!config.email || isSubmitting} className="w-full" size="lg">
          {isSubmitting ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            'Join Waitlist'
          )}
        </Button>
      </div>

      {/* Pricing Section */}
      <div>
        <div className="mb-6 text-center">
          <h3 className="text-lg font-bold">Pricing Plans</h3>
          <p className="text-sm text-muted-foreground">Choose the plan that fits your needs</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-lg border p-6 ${
                plan.popular
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border bg-card'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}
              <div className="mb-4">
                <h4 className="text-lg font-bold">{plan.name}</h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="ml-2 text-sm text-muted-foreground">/{plan.period}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <ul className="flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Enterprise CTA */}
      <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
        <h4 className="font-semibold">Need a custom solution?</h4>
        <p className="mt-2 text-sm text-muted-foreground">
          Contact our sales team for enterprise pricing and custom deployments
        </p>
        <Button variant="outline" className="mt-4">
          Contact Sales
        </Button>
      </div>
    </div>
  )
}

export class CloudProvidersProvider extends BaseLLMProvider<CloudConfig> {
  readonly id: ProviderId = 'cloud'
  readonly name = 'Cloud'
  readonly shortName = 'Cloud'
  readonly description = 'Access all major LLM providers'
  readonly docsUrl = undefined
  readonly configSchema = cloudConfigSchema
  readonly defaultConfig: CloudConfig = {}

  ConfigComponent = CloudProvidersConfigComponent

  async interpretDate(): Promise<DateInterpretation> {
    throw new Error('Cloud providers are not yet available. Please join the waitlist.')
  }
}

