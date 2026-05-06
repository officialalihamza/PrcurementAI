import React from 'react'
import { Box, Typography, Button } from '@mui/material'

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="h6" gutterBottom>Something went wrong</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{this.state.error?.message}</Typography>
          <Button variant="outlined" onClick={() => this.setState({ hasError: false })}>
            Try again
          </Button>
        </Box>
      )
    }
    return this.props.children
  }
}

export function ApiErrorMsg({ message = 'Failed to load data' }: { message?: string }) {
  return (
    <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
      <Typography sx={{ fontSize: 36, mb: 1 }}>⚠️</Typography>
      <Typography variant="body2">{message}</Typography>
    </Box>
  )
}
