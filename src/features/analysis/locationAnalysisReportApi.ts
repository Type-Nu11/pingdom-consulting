import { apiClient, type ApiError } from '../api/apiClient'

const LOCATION_ANALYSIS_REPORT_TIMEOUT_MS = 125_000

export type LocationAnalysisReportRequest = {
  region: string
  category: string
  targetCustomerGroup: string
  operatingHours: string
  email: string
  privacyConsent: boolean
}

export type LocationAnalysisReport = {
  pdf: Blob
  filename: string
}

export function locationAnalysisReportErrorMessage(error: ApiError): string {
  switch (error.code) {
    case 'AI_SERVICE_UNAVAILABLE':
      return 'AI 분석 서비스 연결에 실패했습니다. 문제가 계속되면 관리자에게 문의해 주세요.'
    case 'MCP_SERVICE_UNAVAILABLE':
      return '상권 분석 데이터 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'
    case 'AI_RESPONSE_INVALID':
      return 'AI 분석 결과를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
    case 'PDF_CONVERSION_FAILED':
      return '분석 결과를 PDF로 변환하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }
  if (error.status === 403) return '보고서 접근 권한을 확인할 수 없습니다. 계정 상태와 이메일을 확인해 주세요.'
  if (error.status === 429) return '분석 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.'
  if (error.status === 502) return '분석 서버에서 요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  if (error.kind === 'timeout') return '분석 보고서 생성 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.'
  return '분석 요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

export async function requestLocationAnalysisReport(
  request: LocationAnalysisReportRequest,
  signal: AbortSignal,
): Promise<LocationAnalysisReport> {
  const response = await apiClient.post<Blob>('/analysis/reports/location', request, {
    signal,
    timeout: LOCATION_ANALYSIS_REPORT_TIMEOUT_MS,
    headers: {
      Accept: 'application/pdf',
    },
    responseType: 'blob',
  })

  const contentDisposition = response.headers['content-disposition']
  const filename =
    typeof contentDisposition === 'string'
      ? contentDisposition.match(/filename="?([^";]+)"?/)?.[1]
      : undefined

  return {
    pdf: response.data,
    filename: filename ?? 'location-analysis-report.pdf',
  }
}
