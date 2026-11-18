import { useCallback, useEffect, useRef, useState } from 'react'
import {
  locationAnalysisReportErrorMessage,
  requestLocationAnalysisReport,
  type LocationAnalysisReport,
  type LocationAnalysisReportRequest,
} from '../locationAnalysisReportApi'
import {
  deleteLocationAnalysisReport,
  readLocationAnalysisReport,
  saveLocationAnalysisReport,
} from '../locationAnalysisReportStorage'
import type { ApiError } from '../../api/apiClient'

const ANALYSIS_PROGRESS_MESSAGE_GAP_MS = 450

type AnalysisProgressStage =
  | 'initial-loading'
  | 'message'
  | 'analysis-loading'
  | null

type AnalysisReportOptions = {
  userId: number
  activeSessionId: string | null
  initialLoadingDelay: number
}

// Owns report resources only; the caller owns consent, inputs and consultation confirmation.
export function useAnalysisReport({
  userId,
  activeSessionId,
  initialLoadingDelay,
}: AnalysisReportOptions) {
  const [isSubmittingAnalysisReport, setIsSubmittingAnalysisReport] =
    useState(false)
  const [analysisReportSubmissionError, setAnalysisReportSubmissionError] =
    useState<string | null>(null)
  const [locationAnalysisReport, setLocationAnalysisReport] =
    useState<LocationAnalysisReport | null>(null)
  const [analysisProgressStage, setAnalysisProgressStage] =
    useState<AnalysisProgressStage>(null)
  const analysisReportRequestRef = useRef<AbortController | null>(null)
  const analysisProgressMessageTimerRef = useRef<number | null>(null)

  useEffect(() => () => {
    analysisReportRequestRef.current?.abort()
    if (analysisProgressMessageTimerRef.current !== null) {
      window.clearTimeout(analysisProgressMessageTimerRef.current)
    }
  }, [])

  useEffect(() => {
    let isCurrentSession = true

    if (!activeSessionId) {
      return () => {
        isCurrentSession = false
      }
    }

    void readLocationAnalysisReport(userId, activeSessionId)
      .then((report) => {
        if (isCurrentSession) {
          setLocationAnalysisReport(report)
        }
      })
      .catch((error: unknown) => {
        if (import.meta.env.DEV) {
          console.error('저장된 입지 분석 PDF를 불러오지 못했습니다.', error)
        }
      })

    return () => {
      isCurrentSession = false
    }
  }, [activeSessionId, userId])

  function clearAnalysisProgressMessageTimer() {
    if (analysisProgressMessageTimerRef.current !== null) {
      window.clearTimeout(analysisProgressMessageTimerRef.current)
      analysisProgressMessageTimerRef.current = null
    }
  }

  function cancelAnalysisReport() {
    analysisReportRequestRef.current?.abort()
  }

  function resetAnalysisReportState() {
    setIsSubmittingAnalysisReport(false)
    setAnalysisReportSubmissionError(null)
    setLocationAnalysisReport(null)
    setAnalysisProgressStage(null)
  }

  function clearAnalysisReportError() {
    setAnalysisReportSubmissionError(null)
  }

  const scheduleAnalysisLoading = useCallback(() => {
    const timer = window.setTimeout(() => {
      setAnalysisProgressStage('analysis-loading')
      analysisProgressMessageTimerRef.current = null
    }, ANALYSIS_PROGRESS_MESSAGE_GAP_MS)
    analysisProgressMessageTimerRef.current = timer

    return () => {
      if (analysisProgressMessageTimerRef.current === timer) {
        window.clearTimeout(timer)
        analysisProgressMessageTimerRef.current = null
      }
    }
  }, [])

  async function submitAnalysisReport(
    buildRequest: () => LocationAnalysisReportRequest,
    confirmSummary: () => void,
    clearSummaryConfirmation: () => void,
  ) {
    analysisReportRequestRef.current?.abort()
    clearAnalysisProgressMessageTimer()
    const controller = new AbortController()
    analysisReportRequestRef.current = controller
    setIsSubmittingAnalysisReport(true)
    setAnalysisReportSubmissionError(null)
    setLocationAnalysisReport(null)
    confirmSummary()
    setAnalysisProgressStage('initial-loading')
    analysisProgressMessageTimerRef.current = window.setTimeout(() => {
      setAnalysisProgressStage('message')
      analysisProgressMessageTimerRef.current = null
    }, initialLoadingDelay)

    try {
      const report = await requestLocationAnalysisReport(
        buildRequest(),
        controller.signal,
      )

      if (!controller.signal.aborted) {
        clearAnalysisProgressMessageTimer()
        setLocationAnalysisReport(report)
        if (activeSessionId) {
          void saveLocationAnalysisReport(userId, activeSessionId, report).catch(
            (error: unknown) => {
              if (import.meta.env.DEV) {
                console.error('입지 분석 PDF를 저장하지 못했습니다.', error)
              }
            },
          )
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        clearAnalysisProgressMessageTimer()
        if (import.meta.env.DEV) {
          console.error('입지 분석 PDF 요청에 실패했습니다.', error)
        }

        setAnalysisReportSubmissionError(locationAnalysisReportErrorMessage(error as ApiError))
        clearSummaryConfirmation()
        setAnalysisProgressStage(null)
      }
    } finally {
      if (analysisReportRequestRef.current === controller) {
        analysisReportRequestRef.current = null
        setIsSubmittingAnalysisReport(false)
      }
    }
  }

  function deleteReport(sessionId: string) {
    void deleteLocationAnalysisReport(userId, sessionId).catch(
      (error: unknown) => {
        if (import.meta.env.DEV) console.error('입지 분석 PDF를 삭제하지 못했습니다.', error)
      },
    )
  }

  function downloadAnalysisReport() {
    if (!locationAnalysisReport) {
      return
    }

    const objectUrl = URL.createObjectURL(locationAnalysisReport.pdf)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = locationAnalysisReport.filename
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
  }

  return {
    isSubmittingAnalysisReport, analysisReportSubmissionError, locationAnalysisReport,
    analysisProgressStage, cancelAnalysisReport, clearAnalysisProgressMessageTimer,
    resetAnalysisReportState, clearAnalysisReportError, scheduleAnalysisLoading,
    submitAnalysisReport, deleteReport, downloadAnalysisReport,
  }
}
