import { Box, CircularProgress, Typography, Skeleton } from '@mui/material'

export function LoadingSpinner({ message = 'Loading…' }: { message?: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
      <CircularProgress size={36} thickness={4} sx={{ color: '#2E75B6' }} />
      <Typography variant="body2" color="text.secondary">{message}</Typography>
    </Box>
  )
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Box sx={{ p: 2.5 }}>
      <Skeleton variant="text" width="40%" height={28} sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />
    </Box>
  )
}

export function CardSkeleton() {
  return (
    <Box sx={{ p: 2.5 }}>
      <Skeleton variant="text" width="60%" height={20} />
      <Skeleton variant="text" width="40%" height={40} sx={{ mt: 1 }} />
      <Skeleton variant="text" width="50%" height={16} />
    </Box>
  )
}
