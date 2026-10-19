export type LocationSelection = {
  id: string
  displayName: string
  address: string
  roadAddress: string
  latitude: number
  longitude: number
  source: 'search' | 'map'
}
