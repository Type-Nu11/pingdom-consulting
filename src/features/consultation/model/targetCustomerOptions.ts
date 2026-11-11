export const AGE_GROUPS = [
  '10대',
  '20대',
  '30대',
  '40대',
  '50대',
  '60대',
  '70대',
  '80대',
  '90대',
] as const

export const CUSTOMER_NATIONALITIES = ['내국인', '외국인', '상관 없음'] as const

export type AgeGroup = (typeof AGE_GROUPS)[number]
export type CustomerNationality = (typeof CUSTOMER_NATIONALITIES)[number]

export type TargetCustomerSelection = {
  ageGroups: AgeGroup[]
  nationality: CustomerNationality
}
