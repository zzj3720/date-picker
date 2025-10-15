/* eslint-disable react-refresh/only-export-components */
import type { JSX } from 'react'
import { useState } from 'react'
import { z } from 'zod'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import type { ProviderConfigProps } from '../types'

const waitlistConfigSchema = z.object({
  email: z.string().email('Must be a valid email').optional(),
})

export function WaitlistConfigComponent({ config, onChange }: ProviderConfigProps<z.infer<typeof waitlistConfigSchema>>): JSX.Element {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (config.email && z.string().email().safeParse(config.email).success) {
      // Here you could send the email to your backend
      console.log('Waitlist email:', config.email)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
        <div className="text-5xl">🎉</div>
        <div>
          <h3 className="text-lg font-semibold">You're on the waitlist!</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We'll notify you at <span className="font-medium text-foreground">{config.email}</span> when this provider becomes available.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-primary/20 bg-primary/5 p-6">
      <div className="text-center">
        <div className="mb-2 text-3xl">🚀</div>
        <h3 className="text-lg font-semibold">Coming Soon</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This provider is currently in development. Join the waitlist to be notified when it's ready!
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="waitlist-email">Email Address</Label>
        <Input
          id="waitlist-email"
          type="email"
          placeholder="your@email.com"
          value={config.email ?? ''}
          onChange={(e) => onChange({ ...config, email: e.target.value })}
        />
      </div>
      <Button onClick={handleSubmit} disabled={!config.email} className="w-full">
        Join Waitlist
      </Button>
    </div>
  )
}

export { waitlistConfigSchema }

