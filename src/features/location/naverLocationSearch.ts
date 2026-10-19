import { apiClient } from '../api/apiClient'
import { loadNaverMaps } from './naverMapLoader'
import type { LocationSelection } from './location.types'
import type { NaverLatLng, NaverMaps } from './naverMaps.types'

function validCoordinates(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
}

export function parseNaverPlaces(data: unknown): LocationSelection[] {
  if (!data || typeof data !== 'object' ||
      !('items' in data) || !Array.isArray(data.items)) {
    throw new Error('장소 검색 응답을 확인할 수 없습니다.')
  }
  return data.items.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return []
    const place = item as Record<string, unknown>
    if (typeof place.name !== 'string' || !place.name.trim() ||
        typeof place.latitude !== 'number' || typeof place.longitude !== 'number' ||
        !validCoordinates(place.latitude, place.longitude) ||
        typeof place.roadAddress !== 'string' || typeof place.jibunAddress !== 'string' ||
        !(place.roadAddress || place.jibunAddress)) return []

    return [{
      id: `naver-place-${place.latitude}-${place.longitude}-${place.name}`,
      displayName: place.name,
      address: place.jibunAddress,
      roadAddress: place.roadAddress,
      latitude: place.latitude,
      longitude: place.longitude,
      source: 'search' as const,
    }]
  })
}

function serviceRequest<T>(
  signal: AbortSignal,
  start: (resolve: (value: T) => void, reject: (reason: Error) => void) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('취소된 요청', 'AbortError'))
      return
    }
    const cleanup = () => {
      clearTimeout(timeout)
      signal.removeEventListener('abort', abort)
    }
    const fail = (reason: Error) => { cleanup(); reject(reason) }
    const abort = () => fail(new DOMException('취소된 요청', 'AbortError'))
    const timeout = setTimeout(
      () => fail(new Error('주소 검색 응답 시간이 초과되었습니다.')),
      8_000,
    )
    signal.addEventListener('abort', abort, { once: true })
    try {
      start((value) => { cleanup(); resolve(value) }, fail)
    } catch (error) {
      fail(error instanceof Error ? error : new Error('주소 검색에 실패했습니다.'))
    }
  })
}

export function geocodeNaverAddress(
  maps: NaverMaps,
  query: string,
  signal: AbortSignal,
) {
  return serviceRequest<LocationSelection[]>(signal, (resolve, reject) => {
    maps.Service.geocode({ query, count: 10 }, (status, response) => {
      if (status !== maps.Service.Status.OK || !Array.isArray(response?.v2?.addresses)) {
        reject(new Error('주소를 검색하지 못했습니다.'))
        return
      }
      resolve(response.v2.addresses.flatMap((address) => {
        const latitude = Number(address.y)
        const longitude = Number(address.x)
        const displayName = address.roadAddress || address.jibunAddress
        if (!address.x?.trim() || !address.y?.trim() ||
            !validCoordinates(latitude, longitude) || !displayName) return []
        return [{
          id: `naver-address-${latitude}-${longitude}`,
          displayName,
          address: address.jibunAddress,
          roadAddress: address.roadAddress,
          latitude,
          longitude,
          source: 'search' as const,
        }]
      }))
    })
  })
}

export function reverseNaverAddress(
  maps: NaverMaps,
  position: NaverLatLng,
  signal: AbortSignal,
) {
  return serviceRequest<LocationSelection>(signal, (resolve, reject) => {
    maps.Service.reverseGeocode({
      coords: position,
      orders: [maps.Service.OrderType.ADDR, maps.Service.OrderType.ROAD_ADDR].join(','),
    }, (status, response) => {
      const address = response?.v2?.address
      if (status !== maps.Service.Status.OK || !(address?.roadAddress || address?.jibunAddress)) {
        reject(new Error('선택한 위치의 주소를 찾지 못했습니다. 다른 위치를 선택해 주세요.'))
        return
      }
      const latitude = position.lat()
      const longitude = position.lng()
      resolve({
        id: `coordinate-${latitude}-${longitude}`,
        displayName: address.roadAddress || address.jibunAddress,
        address: address.jibunAddress,
        roadAddress: address.roadAddress,
        latitude,
        longitude,
        source: 'map',
      })
    })
  })
}

export async function searchNaverLocations(
  query: string,
  clientId: string | undefined,
  signal: AbortSignal,
) {
  const results = await Promise.allSettled([
    apiClient.get<unknown>('/users/me/merchant-place-applications/naver-place-search', {
      params: { query },
      signal,
    }).then(({ data }) => parseNaverPlaces(data)),
    loadNaverMaps(clientId).then((maps) => geocodeNaverAddress(maps, query, signal)),
  ])
  if (signal.aborted) throw new DOMException('취소된 요청', 'AbortError')

  const [places, addresses] = results.map((result) =>
    result.status === 'fulfilled' ? result.value : [],
  )
  const sameCoordinates = (first: LocationSelection, second: LocationSelection) =>
    Math.abs(first.latitude - second.latitude) < 0.000001 &&
    Math.abs(first.longitude - second.longitude) < 0.000001

  // 같은 건물의 서로 다른 상호는 유지하고, 장소 후보와 겹치는 주소만 제외합니다.
  const locations = [
    ...places,
    ...addresses.filter((address) => !places.some((place) => sameCoordinates(place, address))),
  ]
  if (!locations.length && results.some((result) => result.status === 'rejected')) {
    throw new Error('장소를 검색하지 못했습니다. 잠시 후 다시 시도하거나 지도에서 선택해 주세요.')
  }
  return locations.filter((location, index) =>
    locations.findIndex((other) => other.id === location.id) === index,
  )
}
