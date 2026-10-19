import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { login } from '../../features/auth/authApi'
import { useAuthSession } from '../../features/auth/useAuthSession'
import type { ApiError } from '../../features/api/apiClient'
import BrowserVerification from './BrowserVerification'
import * as S from './LoginPage.styles'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function loginErrorMessage(error: ApiError) {
  if (error.code === 'PINGCHA_REQUIRED') {
    return '브라우저 검증이 필요합니다. 아래 체크박스를 확인한 뒤 다시 로그인해 주세요.'
  }
  switch (error.status) {
    case 400: return '아이디와 비밀번호를 다시 확인해 주세요.'
    case 401: return '아이디 또는 비밀번호가 올바르지 않습니다.'
    case 403: return '이 계정은 로그인할 수 없습니다. 계정 상태를 확인해 주세요.'
    case 429: return '로그인 시도가 많습니다. 잠시 후 다시 시도해 주세요.'
  }
  if (error.kind === 'timeout') {
    return '로그인 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.'
  }
  return '로그인 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

export default function LoginPage() {
  const session = useAuthSession()
  const [params] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [verificationReady, setVerificationReady] = useState(false)
  const [verificationAttempt, setVerificationAttempt] = useState(0)
  const requestRef = useRef<AbortController | null>(null)

  useEffect(() => () => requestRef.current?.abort(), [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (requestRef.current || !verificationReady) return
    const controller = new AbortController()
    requestRef.current = controller
    setIsSubmitting(true)
    setErrorMessage('')
    const fields = new FormData(event.currentTarget)
    try {
      // 비밀번호 관리자의 자동 완성도 현재 폼 값을 기준으로 전송합니다.
      await login(
        String(fields.get('username') ?? ''),
        String(fields.get('password') ?? ''),
        controller.signal,
      )
    } catch (error) {
      if (controller.signal.aborted) return
      if ((error as ApiError).code === 'PINGCHA_REQUIRED') {
        setVerificationReady(false)
        setVerificationAttempt((value) => value + 1)
      }
      setErrorMessage(loginErrorMessage(error as ApiError))
    } finally {
      if (!controller.signal.aborted) {
        requestRef.current = null
        setIsSubmitting(false)
      }
    }
  }

  if (session) return <Navigate to="/" replace />

  return (
    <S.Page>
      <S.Shell>
        <S.Logo src="/pingdom-logo.png" alt="Pingdom" />
        <S.Title>컨설팅 로그인</S.Title>
        <S.Description>Pingdom 계정으로 안전하게 로그인하세요.</S.Description>
        <S.Form
          onSubmit={handleSubmit}
          aria-label="컨설팅 로그인"
          aria-busy={isSubmitting}
        >
          <S.Field>
            <S.Label htmlFor="login-username">아이디</S.Label>
            <S.InputWrap>
              <Icon>
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 21v-3a7 7 0 0 1 14 0v3" />
              </Icon>
              <S.Input
                id="login-username"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                placeholder="아이디를 입력해주세요"
                minLength={4}
                maxLength={50}
                required
                disabled={isSubmitting}
              />
            </S.InputWrap>
          </S.Field>
          <S.Field>
            <S.Label htmlFor="login-password">비밀번호</S.Label>
            <S.InputWrap>
              <Icon>
                <circle cx="8" cy="12" r="4" />
                <path d="M12 12h9m-3 0v4m-3-4v3" />
              </Icon>
              <S.Input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="비밀번호를 입력해주세요"
                minLength={8}
                required
                disabled={isSubmitting}
                $hasAction
              />
              <S.PasswordToggle
                type="button"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                <Icon>
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword ? <path d="m3 3 18 18" /> : null}
                </Icon>
              </S.PasswordToggle>
            </S.InputWrap>
          </S.Field>
          <S.MessageSlot aria-live="polite">
            {errorMessage ? (
              <S.Message role="alert">{errorMessage}</S.Message>
            ) : params.get('reason') === 'expired' ? (
              <S.Message>로그인이 만료되었습니다. 다시 로그인해 주세요.</S.Message>
            ) : params.get('reason') === 'logout-failed' ? (
              <S.Message>
                이 브라우저에서 로그아웃했습니다. 서버 세션 종료에 실패했으므로
                공용 기기에서는 브라우저를 닫아 주세요.
              </S.Message>
            ) : null}
          </S.MessageSlot>
          <BrowserVerification key={verificationAttempt} onReady={setVerificationReady} />
          <S.Submit type="submit" disabled={isSubmitting || !verificationReady}>
            {isSubmitting ? '로그인 중...' : '로그인하기'}
            {!isSubmitting ? <Icon><path d="M4 12h16m-6-6 6 6-6 6" /></Icon> : null}
          </S.Submit>
        </S.Form>
        <S.Footer>로그인 후 상권 분석과 PDF 보고서를 이용할 수 있습니다.</S.Footer>
      </S.Shell>
    </S.Page>
  )
}
