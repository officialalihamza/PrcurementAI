import { useState } from 'react'
import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export const SIDEBAR_W     = 252
export const SIDEBAR_W_COL = 64   // icon-only collapsed width

export function LayoutWrapper() {
  const [mobileOpen,       setMobileOpen]       = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F0F2F5' }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(o => !o)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: { lg: sidebarCollapsed ? `${SIDEBAR_W_COL}px` : `${SIDEBAR_W}px` },
          transition: 'margin-left 0.25s ease',
          minHeight: '100vh',
        }}
      >
        <Navbar onMobileToggle={() => setMobileOpen(o => !o)} />
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
