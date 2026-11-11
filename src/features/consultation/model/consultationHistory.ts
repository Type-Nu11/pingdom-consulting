import type { ConsultationSession } from './consultation.types'
import type { TargetCustomerSelection } from './targetCustomerOptions'

const SESSION_TITLE_PREVIEW_LENGTH = 11

export function createSessionTitle(prompt: string) {
  const normalizedPrompt = prompt.replace(/\s+/g, ' ').trim()

  return normalizedPrompt
}

export function formatSessionPreview(title: string) {
  const characters = Array.from(title)

  return characters.length > SESSION_TITLE_PREVIEW_LENGTH
    ? `${characters.slice(0, SESSION_TITLE_PREVIEW_LENGTH).join('')}...`
    : title
}

export function formatTargetCustomerGroup(customer: TargetCustomerSelection) {
  const ages = customer.ageGroups
    .map((ageGroup) => Number.parseInt(ageGroup, 10))
    .sort((left, right) => left - right)
  const ageRanges: string[] = []

  for (let startIndex = 0; startIndex < ages.length; ) {
    let endIndex = startIndex

    while (ages[endIndex + 1] === ages[endIndex] + 10) {
      endIndex += 1
    }

    const startAge = ages[startIndex]
    const endAge = ages[endIndex]
    ageRanges.push(
      startAge === endAge ? `${startAge}대` : `${startAge}~${endAge}대`,
    )
    startIndex = endIndex + 1
  }

  return `${ageRanges.join(', ')} ${customer.nationality}`
}

export function sortSessions(sessions: ConsultationSession[]) {
  return [...sessions].sort(
    (left, right) =>
      Number(Boolean(right.isPinned)) - Number(Boolean(left.isPinned)) ||
      right.updatedAt - left.updatedAt,
  )
}
