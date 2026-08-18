export type LocationSelection = {
  id: string
  displayName: string
  address: string
  roadAddress: string
  latitude: number
  longitude: number
  source: 'search' | 'map'
}

export type KakaoPlace = {
  id: string
  place_name: string
  category_name: string
  phone: string
  address_name: string
  road_address_name: string
  place_url: string
  x: string
  y: string
}
