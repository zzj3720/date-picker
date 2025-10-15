import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatDateToDisplay(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  }).format(date)
}

export function safeParseDate(input: string | null | undefined): Date | null {
  if (!input) {
    return null
  }

  const timestamp = Date.parse(input)
  if (!Number.isFinite(timestamp)) {
    return null
  }

  const parsed = new Date(timestamp)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

