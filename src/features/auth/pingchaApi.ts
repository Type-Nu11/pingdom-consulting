import axios from 'axios'

// 검증 위젯과 로그인 요청이 같은 호스트의 HttpOnly 쿠키를 사용해야 합니다.
export const pingchaClient = axios.create({
  baseURL: '/_pingdom/pingcha',
  timeout: 8_000,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

export async function isBrowserVerified(signal?: AbortSignal): Promise<boolean> {
  const { data } = await pingchaClient.get('/status', { signal })
  if (data?.enabled === false) return true
  if (data?.enabled === true && typeof data.verified === 'boolean') return data.verified
  throw new Error('브라우저 검증 상태를 확인하지 못했습니다.')
}

export function isVerificationMessage(event: MessageEvent, frameWindow: Window | null) {
  return frameWindow !== null && event.source === frameWindow &&
    event.origin === window.location.origin && event.data !== null &&
    typeof event.data === 'object'
}
