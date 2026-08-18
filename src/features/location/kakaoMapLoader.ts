import type { KakaoMaps } from './kakaoMaps.types'

const KAKAO_MAP_SCRIPT_ID = 'kakao-map-sdk'
let kakaoMapLoadPromise: Promise<KakaoMaps> | null = null

export function loadKakaoMaps(appKey: string | undefined) {
  if (!appKey) {
    return Promise.reject(
      new Error('Kakao Maps JavaScript 키가 설정되지 않았습니다.'),
    )
  }

  if (window.kakao?.maps) {
    return new Promise<KakaoMaps>((resolve) => {
      window.kakao?.maps.load(() => resolve(window.kakao!.maps))
    })
  }

  if (kakaoMapLoadPromise) {
    return kakaoMapLoadPromise
  }

  kakaoMapLoadPromise = new Promise<KakaoMaps>((resolve, reject) => {
    let isSettled = false
    const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID)
    existingScript?.remove()

    const script = document.createElement('script')

    const rejectLoading = (message: string) => {
      if (isSettled) {
        return
      }

      isSettled = true
      window.clearTimeout(timeoutId)
      script.remove()
      kakaoMapLoadPromise = null
      reject(new Error(message))
    }

    const completeLoading = () => {
      if (!window.kakao?.maps) {
        rejectLoading('Kakao Maps SDK를 초기화하지 못했습니다.')
        return
      }

      window.kakao.maps.load(() => {
        if (isSettled) {
          return
        }

        isSettled = true
        window.clearTimeout(timeoutId)
        resolve(window.kakao!.maps)
      })
    }

    script.id = KAKAO_MAP_SCRIPT_ID
    script.async = true
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`
    script.addEventListener('load', completeLoading, { once: true })
    script.addEventListener(
      'error',
      () => rejectLoading('Kakao Maps SDK를 불러오지 못했습니다.'),
      { once: true },
    )
    const timeoutId = window.setTimeout(
      () => rejectLoading('Kakao Maps SDK 응답 시간이 초과되었습니다.'),
      12_000,
    )
    document.head.append(script)
  })

  return kakaoMapLoadPromise
}
