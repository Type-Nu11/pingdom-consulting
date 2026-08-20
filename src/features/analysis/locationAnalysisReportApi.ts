import { apiClient } from '../api/apiClient'

export type LocationAnalysisReportRequest = {
  region: string
  category: string
  targetCustomerGroup: string
  operatingHours: string
}

export async function requestLocationAnalysisReport(
  request: LocationAnalysisReportRequest,
  signal: AbortSignal,
) {
  await apiClient.post('/analysis/reports/location', request, {
    signal,
  })
}
