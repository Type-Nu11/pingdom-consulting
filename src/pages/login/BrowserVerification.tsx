import { useEffect, useRef, useState } from 'react'
import { isBrowserVerified, isVerificationMessage } from '../../features/auth/pingchaApi'
import * as S from './LoginPage.styles'

type Props = { onReady: (ready: boolean) => void }

export default function BrowserVerification({ onReady }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [state, setState] = useState<'checking' | 'required' | 'ready' | 'error'>('checking')
  const [attempt, setAttempt] = useState(0)
  const [height, setHeight] = useState(80)

  useEffect(() => {
    const controller = new AbortController()
    onReady(false)
    async function check() {
      try {
        const ready = await isBrowserVerified(controller.signal)
        if (controller.signal.aborted) return
        setState(ready ? 'ready' : 'required')
        onReady(ready)
      } catch {
        if (!controller.signal.aborted) setState('error')
      }
    }
    async function receive(event: MessageEvent) {
      if (!isVerificationMessage(event, frameRef.current?.contentWindow ?? null)) return
      if (event.data.type === 'pingcha:resize' && Number.isFinite(event.data.height)) {
        setHeight(Math.max(48, Math.min(180, Math.ceil(event.data.height))))
      } else if (event.data.type === 'pingcha:verified' || event.data.type === 'pingcha:disabled') {
        // iframe 메시지만으로 통과시키지 않고 서버의 쿠키 검증 결과를 확인합니다.
        await check()
      }
    }
    window.addEventListener('message', receive)
    void check()
    return () => {
      controller.abort()
      window.removeEventListener('message', receive)
    }
  }, [onReady, attempt])

  if (state === 'ready') return null

  return (
    <S.Verification aria-label="브라우저 검증">
      {state === 'checking' && <p role="status">브라우저 검증 상태를 확인하고 있습니다.</p>}
      {state === 'required' && (
        <>
          <p>아래 체크박스로 브라우저를 검증한 뒤 로그인해 주세요.</p>
          <S.VerificationFrame
            key={attempt}
            ref={frameRef}
            title="PingCha 브라우저 검증"
            src="/_pingdom/captcha/?embed=1"
            height={height}
          />
        </>
      )}
      {state === 'error' && <p role="alert">브라우저 검증 서버에 연결하지 못했습니다.</p>}
      {state !== 'checking' && (
        <S.VerificationRetry type="button" onClick={() => {
          setState('checking')
          setAttempt((value) => value + 1)
        }}>검증 다시 불러오기</S.VerificationRetry>
      )}
    </S.Verification>
  )
}
