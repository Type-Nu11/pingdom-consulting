export const STORE_CATEGORIES = [
  { code: 'RESTAURANT', label: '음식점' },
  { code: 'MUSIC', label: '음악' },
  { code: 'POP_UP', label: '팝업' },
  { code: 'FASHION', label: '패션' },
  { code: 'BEAUTY', label: '뷰티' },
  { code: 'EXHIBITION', label: '전시' },
  { code: 'CAFE', label: '카페' },
  { code: 'CULTURAL_HERITAGE', label: '문화재' },
  { code: 'OTHER', label: '기타' },
] as const

export const STORE_CATEGORY_LABELS = STORE_CATEGORIES.map(({ label }) => label)

export type StoreCategoryCode = (typeof STORE_CATEGORIES)[number]['code']
