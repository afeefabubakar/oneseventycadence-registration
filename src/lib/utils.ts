import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
  })
  const timePart = date
    .toLocaleTimeString('en-MY', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toUpperCase()

  return `${datePart}, ${timePart}`
}
