import { useState } from 'react'
import type { ConsultationSession } from '../model/consultation.types'
import { STORE_CATEGORIES, type StoreCategoryCode } from '../model/consultationOptions'
import type { OperatingHours } from '../model/operatingHours.types'
import type { TargetCustomerSelection } from '../model/targetCustomerOptions'
import type { LocationSelection } from '../../location/location.types'

export type ConsultationFlowState = Pick<ConsultationSession,
  | 'selectedCategory' | 'confirmedCategory' | 'customCategory' | 'confirmedCustomCategory'
  | 'confirmedLocation' | 'confirmedTargetCustomer' | 'confirmedOperatingHours'
  | 'additionalDetails' | 'confirmedAdditionalDetails' | 'isSummaryConfirmed'
>

// Own only step inputs and their existing invalidation rules. Requests, history,
// consent, timers and presentation stay with their existing owners.
export function useConsultationFlow() {
  const [selectedCategory, setSelectedCategory] = useState<StoreCategoryCode | null>(null)
  const [confirmedCategory, setConfirmedCategory] = useState<StoreCategoryCode | null>(null)
  const [customCategory, setCustomCategory] = useState('')
  const [confirmedCustomCategory, setConfirmedCustomCategory] = useState('')
  const [confirmedLocation, setConfirmedLocation] = useState<LocationSelection | null>(null)
  const [confirmedTargetCustomer, setConfirmedTargetCustomer] = useState<TargetCustomerSelection | null>(null)
  const [confirmedOperatingHours, setConfirmedOperatingHours] = useState<OperatingHours | null>(null)
  const [additionalDetails, setAdditionalDetails] = useState('')
  const [confirmedAdditionalDetails, setConfirmedAdditionalDetails] = useState('')
  const [isSummaryConfirmed, setIsSummaryConfirmed] = useState(false)

  const confirmedCategoryLabel = confirmedCategory === 'OTHER'
    ? confirmedCustomCategory
    : STORE_CATEGORIES.find(({ code }) => code === confirmedCategory)?.label
  const isSelectionConfirmed = selectedCategory !== null && confirmedCategory === selectedCategory
  const canConfirmCategory = selectedCategory !== null && (selectedCategory !== 'OTHER' || customCategory.trim().length > 0)

  function resetFlow() {
    setSelectedCategory(null)
    setConfirmedCategory(null)
    setCustomCategory('')
    setConfirmedCustomCategory('')
    setConfirmedLocation(null)
    setConfirmedTargetCustomer(null)
    setConfirmedOperatingHours(null)
    setAdditionalDetails('')
    setConfirmedAdditionalDetails('')
    setIsSummaryConfirmed(false)
  }

  function restoreFlow(session: ConsultationFlowState) {
    setSelectedCategory(session.selectedCategory)
    setConfirmedCategory(session.confirmedCategory)
    setCustomCategory(session.customCategory)
    setConfirmedCustomCategory(session.confirmedCustomCategory)
    setConfirmedLocation(session.confirmedLocation)
    setConfirmedTargetCustomer(session.confirmedTargetCustomer)
    setConfirmedOperatingHours(session.confirmedOperatingHours)
    setAdditionalDetails(session.additionalDetails)
    setConfirmedAdditionalDetails(session.confirmedAdditionalDetails)
    setIsSummaryConfirmed(session.isSummaryConfirmed)
  }

  function selectCategory(category: StoreCategoryCode) {
    if (isSelectionConfirmed) {
      return
    }
    setSelectedCategory(category)
  }

  function confirmCategory() {
    if (!canConfirmCategory || !selectedCategory) {
      return
    }
    setConfirmedCustomCategory(selectedCategory === 'OTHER' ? customCategory.trim() : '')
    setConfirmedCategory(selectedCategory)
  }

  function confirmLocation(location: LocationSelection) {
    setConfirmedLocation(location)
    setConfirmedTargetCustomer(null)
    setConfirmedOperatingHours(null)
    setConfirmedAdditionalDetails('')
    setIsSummaryConfirmed(false)
  }

  function confirmTargetCustomer(customer: TargetCustomerSelection) {
    setConfirmedTargetCustomer(customer)
    setConfirmedOperatingHours(null)
    setConfirmedAdditionalDetails('')
    setIsSummaryConfirmed(false)
  }

  function editTargetCustomer() {
    setConfirmedTargetCustomer(null)
    setConfirmedOperatingHours(null)
    setIsSummaryConfirmed(false)
  }

  function changeSummaryCategory(categoryLabel: string) {
    const matchingCategory = STORE_CATEGORIES.find(({ label }) => label === categoryLabel)
    const nextCategory = matchingCategory?.code ?? 'OTHER'
    const nextCustomCategory = matchingCategory ? '' : categoryLabel
    setSelectedCategory(nextCategory)
    setConfirmedCategory(nextCategory)
    setCustomCategory(nextCustomCategory)
    setConfirmedCustomCategory(nextCustomCategory)
    setIsSummaryConfirmed(false)
  }

  function changeSummaryLocation(location: LocationSelection) {
    setConfirmedLocation(location)
    setConfirmedTargetCustomer(null)
    setConfirmedOperatingHours(null)
    setIsSummaryConfirmed(false)
  }

  function confirmOperatingHours(operatingHours: OperatingHours) {
    setConfirmedOperatingHours(operatingHours)
    setConfirmedAdditionalDetails('')
    setIsSummaryConfirmed(false)
  }

  function editOperatingHours() {
    setConfirmedOperatingHours(null)
    setIsSummaryConfirmed(false)
  }

  function confirmSummary() {
    setConfirmedAdditionalDetails(additionalDetails.trim())
    setIsSummaryConfirmed(true)
  }

  function clearSummaryConfirmation() {
    setIsSummaryConfirmed(false)
  }

  return {
    selectedCategory, confirmedCategory, customCategory, confirmedCustomCategory,
    confirmedLocation, confirmedTargetCustomer, confirmedOperatingHours,
    additionalDetails, confirmedAdditionalDetails, isSummaryConfirmed,
    confirmedCategoryLabel, isSelectionConfirmed, canConfirmCategory,
    setCustomCategory, setAdditionalDetails, resetFlow, restoreFlow,
    selectCategory, confirmCategory, confirmLocation, confirmTargetCustomer,
    editTargetCustomer, changeSummaryCategory, changeSummaryLocation,
    confirmOperatingHours, editOperatingHours, confirmSummary, clearSummaryConfirmation,
  }
}
