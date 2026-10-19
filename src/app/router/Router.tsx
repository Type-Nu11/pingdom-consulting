import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AiHomePage from '../../pages/home/AiHomePage'
import LoginPage from '../../pages/login/LoginPage'
import { useAuthSession } from '../../features/auth/useAuthSession'
import { getAuthEndReason } from '../../features/auth/authSession'

function AuthenticatedConsulting() {
  const session = useAuthSession()
  if (!session) {
    const loginPath = getAuthEndReason() === 'expired'
      ? '/login?reason=expired'
      : '/login'
    return <Navigate to={loginPath} replace />
  }
  return <AiHomePage key={session.user.id} user={session.user} />
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AuthenticatedConsulting />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
