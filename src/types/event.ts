export interface EventItem {
  id: string
  name: string
  date: string
  registrationOpenDate: string | null
  registrationCloseDate: string | null
  location: string
  locationLink: string | null
  direction: any | null
  description: string | null
  capacity: number | null
  registrationCount: number
  isFull: boolean
  slotsLeft: number | null
  isActive: boolean
  showEvent: boolean
  isCancelled?: boolean
  isPostponed?: boolean
  registrationStatus: 'open' | 'not_started' | 'closed' | 'full' | 'postponed' | 'cancelled'

  paymentQrImageUrl?: string | null
  paymentInstructions?: string | null
  requiresPayment?: boolean
  amount?: number | null
}
