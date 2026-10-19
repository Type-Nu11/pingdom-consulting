import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { loadNaverMaps } from '../../features/location/naverMapLoader'
import {
  reverseNaverAddress,
  searchNaverLocations,
} from '../../features/location/naverLocationSearch'
import type {
  NaverLatLng,
  NaverMap,
  NaverMaps,
  NaverMarker,
} from '../../features/location/naverMaps.types'
import type { LocationSelection } from '../../features/location/location.types'
import * as S from './LocationSelectionPanel.styles'

const NAVER_MAP_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID
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

function mapInteractionOptions(enabled: boolean) {
  return {
    draggable: enabled,
    scrollWheel: enabled,
    pinchZoom: enabled,
    keyboardShortcuts: enabled,
    disableDoubleClickZoom: !enabled,
    disableDoubleTapZoom: !enabled,
    disableTwoFingerTapZoom: !enabled,
  }
}

export default function LocationSelectionPanel({
  confirmedLocation,
  initialLocation = null,
  onConfirm,
}: LocationSelectionPanelProps) {
  const startingLocation = initialLocation ?? confirmedLocation
  const [query, setQuery] = useState(startingLocation?.displayName ?? '')
  const [searchResults, setSearchResults] = useState<LocationSelection[]>([])
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSelection | null>(startingLocation)
  const [isMapVisible, setIsMapVisible] = useState(false)
  const [searchState, setSearchState] = useState<RequestState>('idle')
  const [mapState, setMapState] = useState<RequestState>('idle')
  const [searchError, setSearchError] = useState('')
  const [mapError, setMapError] = useState('')
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapsRef = useRef<NaverMaps | null>(null)
  const mapRef = useRef<NaverMap | null>(null)
  const selectedMarkerRef = useRef<NaverMarker | null>(null)
  const selectedLocationRef = useRef<LocationSelection | null>(startingLocation)
  const searchRequestRef = useRef<AbortController | null>(null)
  const addressRequestRef = useRef<AbortController | null>(null)
  const isConfirmedRef = useRef(confirmedLocation !== null)
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

  useEffect(() => () => {
    searchRequestRef.current?.abort()
    addressRequestRef.current?.abort()
  }, [])

  const reverseGeocode = useCallback((position: NaverLatLng) => {
    const maps = mapsRef.current
    if (!maps || isConfirmedRef.current) return
    searchRequestRef.current?.abort()
    addressRequestRef.current?.abort()
    const request = new AbortController()
    addressRequestRef.current = request
    updateSelectedLocation(null)
    setSearchResults([])
    setSearchState('loading')
    setSearchError('')
    reverseNaverAddress(maps, position, request.signal).then((location) => {
      if (request.signal.aborted || isConfirmedRef.current) return
      addressRequestRef.current = null
      updateSelectedLocation(location)
      setQuery(location.displayName)
      setSearchState('idle')
    }).catch((error: unknown) => {
      if (request.signal.aborted || isConfirmedRef.current) return
      addressRequestRef.current = null
      setSearchState('error')
      setSearchError(error instanceof Error ? error.message : '주소를 확인하지 못했습니다.')
    })
  }, [updateSelectedLocation])

  const ensureSelectionMarker = useCallback((position: NaverLatLng) => {
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
      draggable: !isConfirmedRef.current,
      title: '선택한 위치',
    })
    selectedMarkerRef.current = marker

    maps.Event.addListener(marker, 'dragend', () => {
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
    map.setZoom(16)
  }, [ensureSelectionMarker])

  useEffect(() => {
    if (!isMapVisible || !mapContainerRef.current) {
      return
    }

    let isCancelled = false
    let resizeObserver: ResizeObserver | undefined
    setMapState('loading')
    setMapError('')

    loadNaverMaps(NAVER_MAP_CLIENT_ID)
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
          zoom: currentSelection ? 16 : 7,
        })

        mapsRef.current = maps
        mapRef.current = map
        map.setOptions(mapInteractionOptions(!isConfirmedRef.current))

        maps.Event.addListener(map, 'click', (event) => {
          if (!event?.coord || isConfirmedRef.current) {
            return
          }

          ensureSelectionMarker(event.coord)
          reverseGeocode(event.coord)
        })

        if (currentSelection) {
          ensureSelectionMarker(center)
        }

        const container = mapContainerRef.current
        resizeObserver = new ResizeObserver(() => {
          map.setSize(new maps.Size(container.clientWidth, container.clientHeight))
        })
        resizeObserver.observe(container)
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
      resizeObserver?.disconnect()
      if (addressRequestRef.current) {
        addressRequestRef.current.abort()
        addressRequestRef.current = null
        setSearchState('idle')
      }
      if (selectedMarkerRef.current) {
        mapsRef.current?.Event.clearInstanceListeners(selectedMarkerRef.current)
        selectedMarkerRef.current.setMap(null)
      }
      if (mapRef.current) {
        mapsRef.current?.Event.clearInstanceListeners(mapRef.current)
        mapRef.current.destroy()
      }
      selectedMarkerRef.current = null
      mapRef.current = null
      mapsRef.current = null
    }
  }, [ensureSelectionMarker, isMapVisible, reverseGeocode])

  useEffect(() => {
    mapRef.current?.setOptions(mapInteractionOptions(!isConfirmed))
    if (isConfirmed) {
      searchRequestRef.current?.abort()
      addressRequestRef.current?.abort()
    }
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

    searchRequestRef.current?.abort()
    addressRequestRef.current?.abort()
    const request = new AbortController()
    searchRequestRef.current = request
    searchNaverLocations(trimmedQuery, NAVER_MAP_CLIENT_ID, request.signal)
      .then((locations) => {
        if (request.signal.aborted || isConfirmedRef.current) return
        setSearchResults(locations)
        setSearchState(locations.length ? 'success' : 'empty')
      })
      .catch((error: unknown) => {
        if (request.signal.aborted || isConfirmedRef.current) return
        setSearchState('error')
        setSearchError(error instanceof Error ? error.message : '장소를 검색하지 못했습니다.')
      })
  }

  function handlePlaceSelect(location: LocationSelection) {
    if (isConfirmed) return
    addressRequestRef.current?.abort()
    setQuery(location.displayName)
    updateSelectedLocation(location)
    focusLocationOnMap(location)
  }

  function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedLocation || isConfirmed) {
      return
    }

    isConfirmedRef.current = true
    searchRequestRef.current?.abort()
    addressRequestRef.current?.abort()
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
                searchRequestRef.current?.abort()
                addressRequestRef.current?.abort()
                setQuery(event.currentTarget.value)
                updateSelectedLocation(null)
                if (selectedMarkerRef.current) {
                  mapsRef.current?.Event.clearInstanceListeners(selectedMarkerRef.current)
                  selectedMarkerRef.current.setMap(null)
                }
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
            <S.SearchMessage role="status">장소와 주소를 확인하고 있어요.</S.SearchMessage>
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
                      <strong>{place.displayName}</strong>
                    </S.ResultMain>
                    <S.ResultAddress>
                      {place.roadAddress || place.address}
                    </S.ResultAddress>
                  </S.LocationResultButton>
                )
              })}
            </S.LocationResults>
          ) : null}
        </S.LocationSearchArea>

        {isMapVisible ? (
          <S.MapView data-disabled={isConfirmed}>
            <S.MapViewport ref={mapContainerRef} aria-label="네이버 대한민국 지도" />
            {mapState === 'loading' ? (
              <S.MapOverlay role="status">지도를 불러오고 있어요.</S.MapOverlay>
            ) : null}
            {mapState === 'error' ? (
              <S.MapOverlay role="alert">
                <strong>지도를 표시하지 못했습니다.</strong>
                <span>{mapError}</span>
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
