import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AiHomePage from '../../pages/home/AiHomePage'

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AiHomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
