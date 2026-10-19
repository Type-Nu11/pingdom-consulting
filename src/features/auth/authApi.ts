import { apiClient, waitForTokenRefresh } from '../api/apiClient'
import { getAuthRevision, saveAuthSession, type AuthSession } from './authSession'

type LoginResponse = AuthSession['user'] & { accessToken: string }
let logoutRequest: Promise<unknown> | null = null

export async function login(
  username: string,
  password: string,
  signal?: AbortSignal,
) {
  const revision = getAuthRevision()
  await logoutRequest?.catch(() => undefined)
  await waitForTokenRefresh()
  if (signal?.aborted || getAuthRevision() !== revision) {
    return
  }
  const { data } = await apiClient.post<LoginResponse>(
    '/auth/login',
    { username: username.trim(), password },
    { signal, timeout: 10_000 },
  )

  if (signal?.aborted || getAuthRevision() !== revision) {
    return
  }
  if (
    typeof data.accessToken !== 'string' || !data.accessToken.trim() ||
    !Number.isSafeInteger(data.id) || data.id <= 0 ||
    typeof data.username !== 'string' ||
    typeof data.email !== 'string' || !data.email.trim()
  ) {
    throw new Error('로그인 응답에 계정 정보가 없습니다.')
  }
  saveAuthSession({
    accessToken: data.accessToken,
    user: { id: data.id, username: data.username, email: data.email.trim() },
  })
}

export function logout() {
  if (logoutRequest) {
    return logoutRequest
  }
  saveAuthSession(null, 'logout')
  // 로컬 세션을 먼저 종료하고 서버의 HttpOnly refresh 쿠키도 폐기합니다.
  const request = waitForTokenRefresh()
    .then(() => apiClient.post('/auth/logout'))
    .finally(() => {
      if (logoutRequest === request) logoutRequest = null
    })
  logoutRequest = request
  return request
}
