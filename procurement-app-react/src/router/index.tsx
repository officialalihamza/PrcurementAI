import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LayoutWrapper } from '../components/layout/LayoutWrapper'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { useAuthStore } from '../store/authStore'

const Home                = lazy(() => import('../pages/Home'))
const Login               = lazy(() => import('../pages/Login'))
const Signup              = lazy(() => import('../pages/Signup'))
const Onboarding          = lazy(() => import('../pages/Onboarding'))
const Dashboard           = lazy(() => import('../pages/Dashboard'))
const Contracts           = lazy(() => import('../pages/Contracts'))
const Settings            = lazy(() => import('../pages/Settings'))
const Analytics              = lazy(() => import('../pages/analytics/Analytics'))
const BarrierAnalysis        = lazy(() => import('../pages/analytics/BarrierAnalysis'))
const StatisticalAnalysis    = lazy(() => import('../pages/analytics/StatisticalAnalysis'))
const PredictiveModels       = lazy(() => import('../pages/analytics/PredictiveModels'))
const EnhancedOnboarding     = lazy(() => import('../pages/EnhancedOnboarding'))
const RecommendedContracts   = lazy(() => import('../pages/RecommendedContracts'))
const WinnabilityPage        = lazy(() => import('../pages/analytics/WinnabilityPage'))
const LanguageDetectorPage   = lazy(() => import('../pages/analytics/LanguageDetectorPage'))

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
          <Route path="/onboarding"       element={<Onboarding />} />
          <Route path="/profile-setup"    element={<EnhancedOnboarding />} />
          <Route path="/recommendations"  element={<RecommendedContracts />} />
          <Route path="/dashboard"        element={<Dashboard />} />
          <Route path="/contracts"        element={<Contracts />} />
          <Route path="/settings"         element={<Settings />} />

          {/* Analytics */}
          <Route path="/analytics"                                  element={<Analytics />} />
          <Route path="/analytics/stats"                            element={<StatisticalAnalysis />} />
          <Route path="/analytics/barriers"                         element={<BarrierAnalysis />} />
          <Route path="/analytics/barriers/sector-profiles"         element={<BarrierAnalysis />} />
          <Route path="/analytics/barriers/institutional"           element={<BarrierAnalysis />} />
          <Route path="/winnability"       element={<WinnabilityPage />} />
          <Route path="/language-detector" element={<LanguageDetectorPage />} />
          <Route path="/analytics/predictive"                       element={<PredictiveModels />} />
          <Route path="/analytics/predictive/models"                element={<PredictiveModels />} />
          <Route path="/analytics/predictive/regression"            element={<PredictiveModels />} />
          <Route path="/analytics/predictive/clustering"            element={<PredictiveModels />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
