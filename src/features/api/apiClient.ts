import axios from 'axios'

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
  }
}

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: API_REQUEST_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
)
