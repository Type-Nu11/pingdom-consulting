export const OPERATING_TIME_OPTIONS = [
  ...Array.from({ length: 48 }, (_, index) => {
    const totalMinutes = index * 30
    const hour = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
    const minute = String(totalMinutes % 60).padStart(2, '0')

    return `${hour}:${minute}`
  }),
  '24:00',
]
