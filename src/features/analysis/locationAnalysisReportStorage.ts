import type { LocationAnalysisReport } from './locationAnalysisReportApi'

const DATABASE_NAME = 'pingdom-consulting'
const DATABASE_VERSION = 1
const REPORT_STORE_NAME = 'location-analysis-reports'

function openReportDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(REPORT_STORE_NAME)) {
        request.result.createObjectStore(REPORT_STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function readLocationAnalysisReport(
  sessionId: string,
): Promise<LocationAnalysisReport | null> {
  const database = await openReportDatabase()

  try {
    return await new Promise((resolve, reject) => {
      const request = database
        .transaction(REPORT_STORE_NAME)
        .objectStore(REPORT_STORE_NAME)
        .get(sessionId)

      request.onsuccess = () =>
        resolve((request.result as LocationAnalysisReport | undefined) ?? null)
      request.onerror = () => reject(request.error)
    })
  } finally {
    database.close()
  }
}

export async function saveLocationAnalysisReport(
  sessionId: string,
  report: LocationAnalysisReport,
) {
  const database = await openReportDatabase()

  try {
    await new Promise<void>((resolve, reject) => {
      const request = database
        .transaction(REPORT_STORE_NAME, 'readwrite')
        .objectStore(REPORT_STORE_NAME)
        .put(report, sessionId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } finally {
    database.close()
  }
}

export async function deleteLocationAnalysisReport(sessionId: string) {
  const database = await openReportDatabase()

  try {
    await new Promise<void>((resolve, reject) => {
      const request = database
        .transaction(REPORT_STORE_NAME, 'readwrite')
        .objectStore(REPORT_STORE_NAME)
        .delete(sessionId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } finally {
    database.close()
  }
}
