import { useSyncExternalStore } from 'react'
import { getAuthSession, subscribeAuthSession } from './authSession'

export function useAuthSession() {
  return useSyncExternalStore(subscribeAuthSession, getAuthSession)
}
