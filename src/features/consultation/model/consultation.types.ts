import type { LocationSelection } from '../../location/location.types'
import type { StoreCategoryCode } from './consultationOptions'
import type { OperatingHours } from './operatingHours.types'
import type { TargetCustomerSelection } from './targetCustomerOptions'

export type ConsultationSession = {
  id: string
  title: string
  isPinned: boolean
  createdAt: number
  updatedAt: number
  pendingPrompt: string | null
  submittedPrompt: string | null
  assistantMessage: string | null
  selectedCategory: StoreCategoryCode | null
  confirmedCategory: StoreCategoryCode | null
  customCategory: string
  confirmedCustomCategory: string
  confirmedLocation: LocationSelection | null
  confirmedTargetCustomer: TargetCustomerSelection | null
  confirmedOperatingHours: OperatingHours | null
  additionalDetails: string
  confirmedAdditionalDetails: string
  isSummaryConfirmed: boolean
}

export type ConsultationHistory = {
  activeSessionId: string | null
  sessions: ConsultationSession[]
}
