import type { KakaoPlace } from './location.types'

export type KakaoLatLng = {
  getLat: () => number
  getLng: () => number
}

export type KakaoMap = {
  setCenter: (position: KakaoLatLng) => void
  setLevel: (level: number) => void
  setBounds: (bounds: KakaoLatLngBounds) => void
  setDraggable: (draggable: boolean) => void
  setZoomable: (zoomable: boolean) => void
  relayout: () => void
}

export type KakaoMarker = {
  setMap: (map: KakaoMap | null) => void
  setPosition: (position: KakaoLatLng) => void
  setDraggable: (draggable: boolean) => void
  getPosition: () => KakaoLatLng
}

export type KakaoLatLngBounds = {
  extend: (position: KakaoLatLng) => void
}

type KakaoAddressResult = {
  address: { address_name: string } | null
  road_address: { address_name: string } | null
}

type KakaoStatus = 'OK' | 'ZERO_RESULT' | 'ERROR'

type KakaoPlaces = {
  keywordSearch: (
    keyword: string,
    callback: (places: KakaoPlace[], status: KakaoStatus) => void,
    options?: { size?: number; sort?: string },
  ) => void
}

export type KakaoGeocoder = {
  coord2Address: (
    longitude: number,
    latitude: number,
    callback: (results: KakaoAddressResult[], status: KakaoStatus) => void,
  ) => void
}

export type KakaoMaps = {
  load: (callback: () => void) => void
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMap
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng
  LatLngBounds: new () => KakaoLatLngBounds
  Marker: new (options: {
    map?: KakaoMap
    position: KakaoLatLng
    draggable?: boolean
    title?: string
  }) => KakaoMarker
  services: {
    Places: new () => KakaoPlaces
    Geocoder: new () => KakaoGeocoder
    Status: {
      OK: KakaoStatus
      ZERO_RESULT: KakaoStatus
      ERROR: KakaoStatus
    }
    SortBy: {
      ACCURACY: string
    }
  }
  event: {
    addListener: (
      target: KakaoMap | KakaoMarker,
      eventName: string,
      handler: (event?: { latLng: KakaoLatLng }) => void,
    ) => void
  }
}

declare global {
  interface Window {
    kakao?: {
      maps: KakaoMaps
    }
  }
}
