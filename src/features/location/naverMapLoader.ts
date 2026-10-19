import type { NaverMaps } from './naverMaps.types'

let loadPromise: Promise<NaverMaps> | null = null

export function loadNaverMaps(clientId: string | undefined): Promise<NaverMaps> {
  if (!clientId?.trim()) {
    return Promise.reject(new Error('지도 설정을 확인할 수 없습니다. 관리자에게 문의해 주세요.'))
  }
  if (window.naver?.maps?.Service) return Promise.resolve(window.naver.maps)
  if (loadPromise) return loadPromise

  loadPromise = new Promise<NaverMaps>((resolve, reject) => {
    document.getElementById('naver-map-sdk')?.remove()
    const script = document.createElement('script')
    const cleanup = () => {
      window.clearTimeout(timeout)
      delete window.__pingdomNaverMapsReady
      script.onerror = null
    }
    const fail = () => {
      cleanup()
      script.remove()
      loadPromise = null
      reject(new Error('지도를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'))
    }
    const timeout = window.setTimeout(fail, 12_000)
    // SDK callback은 geocoder 서브모듈까지 준비된 뒤 실행됩니다.
    window.__pingdomNaverMapsReady = () => {
      if (!window.naver?.maps?.Service) { fail(); return }
      cleanup()
      resolve(window.naver.maps)
    }
    script.id = 'naver-map-sdk'
    script.async = true
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId.trim())}&submodules=geocoder&callback=__pingdomNaverMapsReady`
    script.onerror = fail
    document.head.append(script)
  })
  return loadPromise
}
