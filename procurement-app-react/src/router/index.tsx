import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LayoutWrapper } from '../components/layout/LayoutWrapper'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { useAuthStore } from '../store/authStore'

const Home           = lazy(() => import('../pages/Home'))
const Login          = lazy(() => import('../pages/Login'))
const Signup         = lazy(() => import('../pages/Signup'))
const Onboarding     = lazy(() => import('../pages/Onboarding'))
const Dashboard      = lazy(() => import('../pages/Dashboard'))
const Contracts      = lazy(() => import('../pages/Contracts'))
const Settings       = lazy(() => import('../pages/Settings'))
const BarrierAnalysis= lazy(() => import('../pages/analytics/BarrierAnalysis'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore()
  if (loading) return <LoadingSpinner message="Loading…" />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login"  element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

        {/* Protected */}
        <Route element={<ProtectedRoute><LayoutWrapper /></ProtectedRoute>}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/contracts"  element={<Contracts />} />
          <Route path="/settings"   element={<Settings />} />

          {/* Analytics */}
          <Route path="/analytics" element={<Dashboard />} />
          <Route path="/analytics/barriers"                         element={<BarrierAnalysis />} />
          <Route path="/analytics/barriers/sector-profiles"         element={<BarrierAnalysis />} />
          <Route path="/analytics/barriers/institutional"           element={<BarrierAnalysis />} />
          <Route path="/analytics/barriers/winnability"             element={<BarrierAnalysis />} />
          <Route path="/analytics/barriers/language-detector"       element={<BarrierAnalysis />} />
          <Route path="/analytics/stats"                            element={<BarrierAnalysis />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
