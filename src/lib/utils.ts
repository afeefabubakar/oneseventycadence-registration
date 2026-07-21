import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const MALAYSIA_TIMEZONE = 'Asia/Kuala_Lumpur'

export function formatEventDateTime(
  dateString: string,
  options?: { monthFormat?: 'short' | 'long' },
) {
  const date = new Date(dateString)
  const datePart = date.toLocaleDateString('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: options?.monthFormat ?? 'long',
    year: 'numeric',
    timeZone: MALAYSIA_TIMEZONE,
  })
  const timePart = date
    .toLocaleTimeString('en-MY', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: MALAYSIA_TIMEZONE,
    })
    .toUpperCase()

  return `${datePart}, ${timePart}`
}

export function formatMalaysiaDate(
  dateString: string,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Date(dateString).toLocaleDateString('en-MY', {
    timeZone: MALAYSIA_TIMEZONE,
    ...options,
  })
}

export function formatMalaysiaTime(
  dateString: string,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Date(dateString)
    .toLocaleTimeString('en-MY', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: MALAYSIA_TIMEZONE,
      ...options,
    })
    .toUpperCase()
}
