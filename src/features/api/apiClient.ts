import axios, { type InternalAxiosRequestConfig } from 'axios'
import {
  getAuthGeneration,
  getAuthRevision,
  getAuthSession,
  saveAuthSession,
} from '../auth/authSession'

const API_PROXY_PATH = '/api'

export const API_REQUEST_TIMEOUT_MS = 6_500

export type ApiErrorKind =
  | 'canceled'
  | 'timeout'
  | 'network'
  | 'http'
  | 'unknown'

export type ApiError = {
  kind: ApiErrorKind
  message: string
  status?: number
  code?: string
}

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

  if (import.meta.env.DEV || !configuredBaseUrl) {
    return API_PROXY_PATH
  }

  return configuredBaseUrl.replace(/\/$/, '')
}

export function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return {
      kind: 'unknown',
      message: '요청을 처리하는 중 알 수 없는 오류가 발생했습니다.',
    }
  }

  if (error.code === 'ERR_CANCELED') {
    return {
      kind: 'canceled',
      message: '요청이 취소되었습니다.',
    }
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return {
      kind: 'timeout',
      message: '응답 시간이 초과되었습니다.',
    }
  }

  if (!error.response) {
    return {
      kind: 'network',
      message: '네트워크 연결을 확인해 주세요.',
    }
  }

  return {
    kind: 'http',
    message: '서버 요청을 처리하지 못했습니다.',
    status: error.response.status,
    code: typeof error.response.data?.code === 'string'
      ? error.response.data.code
      : undefined,
  }
}

async function toResponseError(error: unknown): Promise<ApiError> {
  const result = toApiError(error)
  if (!axios.isAxiosError(error)) return result
  const body = error.response?.data
  // PDF 요청의 JSON 오류도 Blob으로 수신됩니다. 작은 JSON 본문에서 코드만 복원합니다.
  if (body instanceof Blob && body.size <= 16_384 && body.type.includes('application/json')) {
    try {
      const data: unknown = JSON.parse(await body.text())
      if (data !== null && typeof data === 'object' &&
        'code' in data && typeof data.code === 'string') {
        result.code = data.code
      }
    } catch { /* HTML·손상된 본문은 기존 HTTP 상태와 일반 안내를 유지합니다. */ }
  }
  return result
}

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: API_REQUEST_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

type AuthRequestConfig = InternalAxiosRequestConfig & {
  _authRetried?: boolean
  _authUserId?: number
  _authGeneration?: number
}

let refreshRequest: { revision: number; promise: Promise<string> } | null = null

export async function waitForTokenRefresh() {
  // 쿠키 회전 응답이 도착한 뒤 로그인·로그아웃해야 오래된 응답이 쿠키를 덮지 않습니다.
  await refreshRequest?.promise.catch(() => undefined)
}

function refreshAccessToken() {
  const session = getAuthSession()
  const revision = getAuthRevision()
  if (!session) return Promise.reject(new Error('로그인이 필요합니다.'))
  if (refreshRequest?.revision === revision) return refreshRequest.promise

  const promise = apiClient.post<{ accessToken: string }>('/auth/token/refresh')
    .then(({ data }) => {
      if (getAuthRevision() !== revision ||
        typeof data.accessToken !== 'string' || !data.accessToken.trim()) {
        throw new Error('인증 세션이 변경되었습니다.')
      }
      saveAuthSession({ ...session, accessToken: data.accessToken })
      return data.accessToken
    })
    .catch((error: unknown) => {
      const status = (error as ApiError).status
      if (getAuthRevision() === revision &&
        (status === 401 || status === 403 || status === 404)) {
        saveAuthSession(null)
      }
      throw error
    })
    .finally(() => {
      if (refreshRequest?.promise === promise) refreshRequest = null
    })
  refreshRequest = { revision, promise }
  return promise
}

apiClient.interceptors.request.use((config: AuthRequestConfig) => {
  const session = getAuthSession()
  if (session && !config.url?.startsWith('/auth/')) {
    // 재시도 중 다른 계정으로 바뀐 경우 해당 계정의 조건으로 요청을 보내지 않습니다.
    if (config._authGeneration !== undefined && config._authGeneration !== getAuthGeneration()) {
      throw new axios.CanceledError('인증 계정이 변경되었습니다.')
    }
    config._authUserId = session.user.id
    config._authGeneration = getAuthGeneration()
    config.headers.set('Authorization', `Bearer ${session.accessToken}`)
  } else if (config._authUserId !== undefined) {
    throw new axios.CanceledError('로그인이 종료되었습니다.')
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const config = error.config as AuthRequestConfig | undefined
      const session = getAuthSession()
      if (error.response?.status === 401 && config &&
        config._authUserId !== undefined && session?.user.id === config._authUserId &&
        config._authGeneration === getAuthGeneration() &&
        !config.signal?.aborted) {
        if (config._authRetried) {
          if (config.headers.get('Authorization') === `Bearer ${session.accessToken}`) {
            saveAuthSession(null)
          }
        } else {
          config._authRetried = true
          try {
            if (config.headers.get('Authorization') === `Bearer ${session.accessToken}`) {
              await refreshAccessToken()
            }
            return await apiClient(config)
          } catch (retryError) {
            // interceptor에서 이미 변환된 오류의 상태·취소 사유를 보존합니다.
            if (!axios.isAxiosError(retryError)) throw retryError
            throw await toResponseError(retryError)
          }
        }
      }
    }
    throw await toResponseError(error)
  },
)
