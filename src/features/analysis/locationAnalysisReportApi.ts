import { apiClient } from '../api/apiClient'

const LOCATION_ANALYSIS_REPORT_TIMEOUT_MS = 125_000

export type LocationAnalysisReportRequest = {
  region: string
  category: string
  targetCustomerGroup: string
  operatingHours: string
}

export type LocationAnalysisReport = {
  pdf: Blob
  filename: string
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
