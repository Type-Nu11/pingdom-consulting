import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { loadKakaoMaps } from '../../features/location/kakaoMapLoader'
import type {
  KakaoLatLng,
  KakaoGeocoder,
  KakaoMap,
  KakaoMaps,
  KakaoMarker,
} from '../../features/location/kakaoMaps.types'
import type {
  KakaoPlace,
  LocationSelection,
} from '../../features/location/location.types'
import * as S from './LocationSelectionPanel.styles'

const KAKAO_MAP_APP_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY
const DEFAULT_MAP_CENTER = { latitude: 37.566826, longitude: 126.9786567 }

type RequestState = 'idle' | 'loading' | 'success' | 'empty' | 'error'

type LocationSelectionPanelProps = {
  confirmedLocation: LocationSelection | null
  initialLocation?: LocationSelection | null
  onConfirm: (location: LocationSelection) => void
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 6 5-2 8 3 5-2v13l-5 2-8-3-5 2Z" />
      <path d="M8 4v13M16 7v13" />
    </svg>
  )
}

function createSearchSelection(place: KakaoPlace): LocationSelection {
  return {
    id: place.id,
    displayName: place.place_name,
    address: place.address_name,
    roadAddress: place.road_address_name,
    latitude: Number(place.y),
    longitude: Number(place.x),
    source: 'search',
  }
}

export default function LocationSelectionPanel({
  confirmedLocation,
  initialLocation = null,
  onConfirm,
}: LocationSelectionPanelProps) {
  const startingLocation = initialLocation ?? confirmedLocation
  const [query, setQuery] = useState(startingLocation?.displayName ?? '')
  const [searchResults, setSearchResults] = useState<KakaoPlace[]>([])
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSelection | null>(startingLocation)
  const [isMapVisible, setIsMapVisible] = useState(false)
  const [searchState, setSearchState] = useState<RequestState>('idle')
  const [mapState, setMapState] = useState<RequestState>('idle')
  const [searchError, setSearchError] = useState('')
  const [mapError, setMapError] = useState('')
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapsRef = useRef<KakaoMaps | null>(null)
  const mapRef = useRef<KakaoMap | null>(null)
  const selectedMarkerRef = useRef<KakaoMarker | null>(null)
  const geocoderRef = useRef<KakaoGeocoder | null>(null)
  const selectedLocationRef = useRef<LocationSelection | null>(null)
  const isConfirmedRef = useRef(false)
  const isConfirmed = confirmedLocation !== null
  const displayedLocation = confirmedLocation ?? selectedLocation

  useEffect(() => {
    isConfirmedRef.current = isConfirmed
  }, [isConfirmed])

  useEffect(() => {
    selectedLocationRef.current = selectedLocation
  }, [selectedLocation])

  const updateSelectedLocation = useCallback(
    (location: LocationSelection | null) => {
      selectedLocationRef.current = location
      setSelectedLocation(location)
    },
    [],
  )

  const reverseGeocode = useCallback((position: KakaoLatLng) => {
    const maps = mapsRef.current
    const geocoder = geocoderRef.current

    if (!maps || !geocoder || isConfirmedRef.current) {
      return
    }

    const latitude = position.getLat()
    const longitude = position.getLng()

    geocoder.coord2Address(longitude, latitude, (results, status) => {
      if (status !== maps.services.Status.OK || !results[0]) {
        updateSelectedLocation({
          id: `coordinate-${latitude}-${longitude}`,
          displayName: '지도에서 선택한 위치',
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          roadAddress: '',
          latitude,
          longitude,
          source: 'map',
        })
        return
      }

      const result = results[0]
      const roadAddress = result.road_address?.address_name ?? ''
      const address = result.address?.address_name ?? ''
      const displayName = roadAddress || address || '지도에서 선택한 위치'

      updateSelectedLocation({
        id: `coordinate-${latitude}-${longitude}`,
        displayName,
        address,
        roadAddress,
        latitude,
        longitude,
        source: 'map',
      })
      setQuery(displayName)
    })
  }, [updateSelectedLocation])

  const ensureSelectionMarker = useCallback((position: KakaoLatLng) => {
    const maps = mapsRef.current
    const map = mapRef.current

    if (!maps || !map) {
      return
    }

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.setPosition(position)
      return
    }

    const marker = new maps.Marker({
      map,
      position,
      draggable: true,
      title: '선택한 위치',
    })
    selectedMarkerRef.current = marker

    maps.event.addListener(marker, 'dragend', () => {
      reverseGeocode(marker.getPosition())
    })
  }, [reverseGeocode])

  const focusLocationOnMap = useCallback((location: LocationSelection) => {
    const maps = mapsRef.current
    const map = mapRef.current

    if (!maps || !map) {
      return
    }

    const position = new maps.LatLng(location.latitude, location.longitude)
    ensureSelectionMarker(position)
    map.setCenter(position)
    map.setLevel(3)
  }, [ensureSelectionMarker])

  useEffect(() => {
    if (!isMapVisible || !mapContainerRef.current) {
      return
    }

    let isCancelled = false
    setMapState('loading')
    setMapError('')

    loadKakaoMaps(KAKAO_MAP_APP_KEY)
      .then((maps) => {
        if (isCancelled || !mapContainerRef.current) {
          return
        }

        const currentSelection = selectedLocationRef.current
        const center = currentSelection
          ? new maps.LatLng(
              currentSelection.latitude,
              currentSelection.longitude,
            )
          : new maps.LatLng(
              DEFAULT_MAP_CENTER.latitude,
              DEFAULT_MAP_CENTER.longitude,
            )
        const map = new maps.Map(mapContainerRef.current, {
          center,
          level: currentSelection ? 3 : 13,
        })

        mapsRef.current = maps
        mapRef.current = map
        geocoderRef.current = new maps.services.Geocoder()
        map.setDraggable(!isConfirmedRef.current)
        map.setZoomable(!isConfirmedRef.current)

        maps.event.addListener(map, 'click', (event) => {
          if (!event?.latLng || isConfirmedRef.current) {
            return
          }

          ensureSelectionMarker(event.latLng)
          reverseGeocode(event.latLng)
        })

        if (currentSelection) {
          ensureSelectionMarker(center)
        }

        window.requestAnimationFrame(() => map.relayout())
        setMapState('success')
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return
        }

        setMapState('error')
        setMapError(
          error instanceof Error
            ? error.message
            : '지도를 불러오지 못했습니다.',
        )
      })

    return () => {
      isCancelled = true
      selectedMarkerRef.current?.setMap(null)
      selectedMarkerRef.current = null
      geocoderRef.current = null
      mapRef.current = null
      mapsRef.current = null
    }
  }, [ensureSelectionMarker, isMapVisible, reverseGeocode])

  useEffect(() => {
    mapRef.current?.setDraggable(!isConfirmed)
    mapRef.current?.setZoomable(!isConfirmed)
    selectedMarkerRef.current?.setDraggable(!isConfirmed)
  }, [isConfirmed])

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedQuery = query.trim()

    if (!trimmedQuery || isConfirmed) {
      return
    }

    setSearchState('loading')
    setSearchError('')
    setSearchResults([])

    loadKakaoMaps(KAKAO_MAP_APP_KEY)
      .then((maps) => {
        const placesService = new maps.services.Places()

        placesService.keywordSearch(
          trimmedQuery,
          (places, status) => {
            if (status === maps.services.Status.OK) {
              setSearchResults(places)
              setSearchState('success')
              return
            }

            if (status === maps.services.Status.ZERO_RESULT) {
              setSearchState('empty')
              return
            }

            setSearchState('error')
            setSearchError('장소 검색 중 오류가 발생했습니다.')
          },
          {
            size: 10,
            sort: maps.services.SortBy.ACCURACY,
          },
        )
      })
      .catch((error: unknown) => {
        setSearchState('error')
        setSearchError(
          error instanceof Error
            ? error.message
            : '장소 검색을 시작하지 못했습니다.',
        )
      })
  }

  function handlePlaceSelect(place: KakaoPlace) {
    if (isConfirmed) {
      return
    }

    const location = createSearchSelection(place)
    setQuery(place.place_name)
    updateSelectedLocation(location)
    focusLocationOnMap(location)
  }

  function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedLocation || isConfirmed) {
      return
    }

    setIsMapVisible(false)
    onConfirm(selectedLocation)
  }

  return (
    <S.LocationPanel data-confirmed={isConfirmed}>
      <S.LocationPanelHeader>
        <S.LocationPanelTitle>희망 장소</S.LocationPanelTitle>
        <S.LocationHeaderActions>
          <S.MapToggle
            type="button"
            aria-expanded={isMapVisible}
            onClick={() => setIsMapVisible((isVisible) => !isVisible)}
          >
            <MapIcon />
            {isMapVisible ? '지도 닫기' : '지도 보기'}
          </S.MapToggle>
          <S.LocationStepBadge>2단계</S.LocationStepBadge>
        </S.LocationHeaderActions>
      </S.LocationPanelHeader>

      <S.LocationContent>
        <S.LocationQuestion>어디에서 가게를 열고 싶으신가요?</S.LocationQuestion>
        <S.LocationHelp>
          장소나 주소를 검색한 뒤 후보를 선택하거나 지도에서 위치를 직접
          지정해 주세요.
        </S.LocationHelp>

        <S.LocationSearchArea>
          <S.LocationSearchForm onSubmit={handleSearchSubmit} role="search">
            <S.LocationSearchInput
              value={confirmedLocation?.displayName ?? query}
              onChange={(event) => {
                setQuery(event.currentTarget.value)
                updateSelectedLocation(null)
                selectedMarkerRef.current?.setMap(null)
                selectedMarkerRef.current = null
                setSearchState('idle')
                setSearchResults([])
              }}
              placeholder="예: 성수동 카페거리, 서울숲, 수원역"
              aria-label="희망 장소 검색"
              maxLength={60}
              disabled={isConfirmed}
            />
            <S.LocationSearchButton
              type="submit"
              aria-label="장소 검색"
              disabled={!query.trim() || isConfirmed || searchState === 'loading'}
            >
              <SearchIcon />
            </S.LocationSearchButton>
          </S.LocationSearchForm>

          {searchState === 'loading' ? (
            <S.SearchMessage role="status">실제 장소를 검색하고 있어요.</S.SearchMessage>
          ) : null}
          {searchState === 'empty' ? (
            <S.SearchMessage role="status">
              검색 결과가 없습니다. 다른 장소명이나 주소를 입력해 주세요.
            </S.SearchMessage>
          ) : null}
          {searchState === 'error' ? (
            <S.SearchError role="alert">{searchError}</S.SearchError>
          ) : null}

          {searchResults.length > 0 ? (
            <S.LocationResults aria-label="장소 검색 결과">
              {searchResults.map((place) => {
                const isSelected = displayedLocation?.id === place.id

                return (
                  <S.LocationResultButton
                    key={place.id}
                    type="button"
                    data-selected={isSelected}
                    aria-pressed={isSelected}
                    onClick={() => handlePlaceSelect(place)}
                    disabled={isConfirmed}
                  >
                    <S.ResultMain>
                      <strong>{place.place_name}</strong>
                      {place.category_name ? <span>{place.category_name}</span> : null}
                    </S.ResultMain>
                    <S.ResultAddress>
                      {place.road_address_name || place.address_name}
                    </S.ResultAddress>
                  </S.LocationResultButton>
                )
              })}
            </S.LocationResults>
          ) : null}
        </S.LocationSearchArea>

        {isMapVisible ? (
          <S.MapView data-disabled={isConfirmed}>
            <S.MapViewport ref={mapContainerRef} aria-label="Kakao 대한민국 지도" />
            {mapState === 'loading' ? (
              <S.MapOverlay role="status">지도를 불러오고 있어요.</S.MapOverlay>
            ) : null}
            {mapState === 'error' ? (
              <S.MapOverlay role="alert">
                <strong>지도를 표시하지 못했습니다.</strong>
                <span>{mapError}</span>
                <span>JavaScript 키와 등록 도메인을 확인해 주세요.</span>
              </S.MapOverlay>
            ) : null}
            {mapState === 'success' && !isConfirmed ? (
              <S.MapGuide>지도를 클릭하거나 마커를 이동해 세부 위치를 지정하세요.</S.MapGuide>
            ) : null}
          </S.MapView>
        ) : null}

        {displayedLocation ? (
          <S.SelectedLocation aria-live="polite">
            <S.SelectedLocationHeader>
              <span>선택한 장소</span>
              <strong>{displayedLocation.displayName}</strong>
            </S.SelectedLocationHeader>
            <p>{displayedLocation.roadAddress || displayedLocation.address}</p>
            <small>
              위도 {displayedLocation.latitude.toFixed(6)} · 경도{' '}
              {displayedLocation.longitude.toFixed(6)}
            </small>
          </S.SelectedLocation>
        ) : null}

        <S.LocationConfirmForm onSubmit={handleConfirm}>
          <S.LocationConfirmButton
            type="submit"
            disabled={!selectedLocation || isConfirmed}
          >
            {isConfirmed ? '장소 선택 완료' : '이 장소로 선택'}
          </S.LocationConfirmButton>
        </S.LocationConfirmForm>
      </S.LocationContent>
    </S.LocationPanel>
  )
}
