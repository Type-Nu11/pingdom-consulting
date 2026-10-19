export type AuthSession = {
  accessToken: string
  user: { id: number; username: string; email: string }
}

const STORAGE_KEY = 'pingdom-consulting-auth-v1'
const listeners = new Set<() => void>()

function readSession(): AuthSession | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY)
    if (!value) {
      return null
    }
    const session = JSON.parse(value) as AuthSession
    const isValid =
      typeof session?.accessToken === 'string' && session.accessToken.trim() &&
      Number.isSafeInteger(session.user?.id) && session.user.id > 0 &&
      typeof session.user.username === 'string' &&
      typeof session.user.email === 'string' && session.user.email.trim()
    return isValid ? session : null
  } catch {
    return null
  }
}

let session = readSession()
// 로그아웃·계정 변경 이전에 시작한 갱신 응답이 세션을 되살리지 않도록 구분합니다.
let revision = 0
let generation = 0
let endReason: 'expired' | 'logout' | null = null

export function getAuthSession() {
  return session
}

export function getAuthRevision() {
  return revision
}

export function getAuthGeneration() {
  return generation
}

export function getAuthEndReason() {
  return endReason
}

export function saveAuthSession(
  nextSession: AuthSession | null,
  reason: 'expired' | 'logout' = 'expired',
) {
  if (!session || !nextSession || session.user !== nextSession.user) {
    generation += 1
  }
  session = nextSession
  endReason = nextSession ? null : reason
  revision += 1
  try {
    if (nextSession) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // 저장소가 차단된 브라우저에서는 현재 페이지가 열린 동안만 세션을 유지합니다.
  }
  listeners.forEach((listener) => listener())
}

export function subscribeAuthSession(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
