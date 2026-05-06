import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { theme } from './styles/theme'
import { AppRouter } from './router'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AuthInit({ children }: { children: React.ReactNode }) {
  const { init } = useAuthStore()
  useEffect(() => { init() }, [init])
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthInit>
            <AppRouter />
          </AuthInit>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
