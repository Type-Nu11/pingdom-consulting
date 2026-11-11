export const OPERATING_DAYS = ['평일', '주말', '매일'] as const

export type OperatingDays = (typeof OPERATING_DAYS)[number]

export type OperatingHours = {
  operatingDays: OperatingDays
  startTime: string
  endTime: string
}
