import { Paper } from '@mui/material'
import type { PaperProps } from '@mui/material'
import { motion } from 'framer-motion'
import React from 'react'

interface Props extends PaperProps { animate?: boolean; delay?: number }

export function Card({ children, animate = true, delay = 0, sx, ...props }: Props) {
  const el = (
    <Paper elevation={0} sx={{ borderRadius: 3, p: 2.5, ...sx }} {...props}>
      {children}
    </Paper>
  )
  if (!animate) return el
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      style={{ height: '100%' }}
    >
      {el}
    </motion.div>
  )
}
