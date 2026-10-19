export type NaverLatLng = {
  lat: () => number
  lng: () => number
}

type MapInteractionOptions = {
  draggable: boolean
  scrollWheel: boolean
  pinchZoom: boolean
  keyboardShortcuts: boolean
  disableDoubleClickZoom: boolean
  disableDoubleTapZoom: boolean
  disableTwoFingerTapZoom: boolean
}

export type NaverMap = {
  setCenter: (position: NaverLatLng) => void
  setZoom: (zoom: number) => void
  setOptions: (options: MapInteractionOptions) => void
  setSize: (size: object) => void
  destroy: () => void
}

export type NaverMarker = {
  setMap: (map: NaverMap | null) => void
  setPosition: (position: NaverLatLng) => void
  setDraggable: (draggable: boolean) => void
  getPosition: () => NaverLatLng
}

type NaverAddress = {
  roadAddress: string
  jibunAddress: string
  x: string
  y: string
}

type ServiceCallback<T> = (status: number, response: { v2: T }) => void

export type NaverMaps = {
  Map: new (
    container: HTMLElement,
    options: { center: NaverLatLng; zoom: number },
  ) => NaverMap
  LatLng: new (latitude: number, longitude: number) => NaverLatLng
  Size: new (width: number, height: number) => object
  Marker: new (options: {
    map: NaverMap
    position: NaverLatLng
    draggable: boolean
    title: string
  }) => NaverMarker
  Service: {
    Status: { OK: number }
    OrderType: { ADDR: string; ROAD_ADDR: string }
    geocode: (
      options: { query: string; count: number },
      callback: ServiceCallback<{ addresses: NaverAddress[] }>,
    ) => void
    reverseGeocode: (
      options: { coords: NaverLatLng; orders: string },
      callback: ServiceCallback<{
        address: { roadAddress: string; jibunAddress: string }
      }>,
    ) => void
  }
  Event: {
    addListener: (
      target: NaverMap | NaverMarker,
      name: string,
      handler: (event: { coord: NaverLatLng }) => void,
    ) => object
    clearInstanceListeners: (target: NaverMap | NaverMarker) => void
  }
}

declare global {
  interface Window {
    naver?: { maps: NaverMaps }
    __pingdomNaverMapsReady?: () => void
  }
}
