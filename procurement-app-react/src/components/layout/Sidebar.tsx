import { useState } from 'react'
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Collapse, Box, Typography, Divider,
} from '@mui/material'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const DRAWER_WIDTH = 240

const analyticsLinks = [
  { label: 'Market Overview',      path: '/analytics',                               icon: '📊' },
  { label: 'Statistical Analysis', path: '/analytics/stats',                         icon: '🔬' },
  { label: 'Barrier Overview',     path: '/analytics/barriers',                      icon: '🚧' },
  { label: 'Sector Profiles',      path: '/analytics/barriers/sector-profiles',      icon: '📈' },
  { label: 'Institutional',        path: '/analytics/barriers/institutional',        icon: '🏛️' },
  { label: 'Winnability',          path: '/analytics/barriers/winnability',          icon: '🎯' },
  { label: 'Language Detector',    path: '/analytics/barriers/language-detector',    icon: '🔍' },
]

interface Props {
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ mobileOpen, onClose }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const [analyticsOpen, setAnalyticsOpen] = useState(location.pathname.startsWith('/analytics'))

  const isActive = (path: string) => location.pathname === path

  const nav = (path: string) => { navigate(path); onClose() }

  const itemSx = (active: boolean) => ({
    borderRadius: 1.5, py: 1, px: 1.5, mb: 0.25, mx: 1,
    color: active ? '#93c5fd' : 'rgba(255,255,255,0.7)',
    bgcolor: active ? 'rgba(147,197,253,0.12)' : 'transparent',
    border: active ? '1px solid rgba(147,197,253,0.2)' : '1px solid transparent',
    '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', color: '#fff' },
    transition: 'all 0.15s',
  })

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1F3A5F' }}>
      {/* Logo */}
      <Box sx={{ px: 2.5, py: 2.5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: 2,
            background: 'linear-gradient(135deg, #2E75B6, #5a78a5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>P</Typography>
          </Box>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>ProcurementAI</Typography>
        </Box>
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        <List dense disablePadding>

          <ListItemButton onClick={() => nav('/dashboard')} sx={itemSx(isActive('/dashboard'))}>
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              <DashboardOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={<Typography sx={{ fontSize: 13, fontWeight: isActive('/dashboard') ? 600 : 400 }}>Dashboard</Typography>} />
          </ListItemButton>

          <ListItemButton onClick={() => nav('/contracts')} sx={itemSx(isActive('/contracts'))}>
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              <SearchOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={<Typography sx={{ fontSize: 13, fontWeight: isActive('/contracts') ? 600 : 400 }}>Contracts</Typography>} />
          </ListItemButton>

          {/* Analytics group */}
          <ListItemButton
            onClick={() => setAnalyticsOpen((o) => !o)}
            sx={itemSx(location.pathname.startsWith('/analytics'))}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              <BarChartOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={<Typography sx={{ fontSize: 13, fontWeight: 500 }}>Analytics</Typography>} />
            {analyticsOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </ListItemButton>

          <AnimatePresence>
            {analyticsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <Box sx={{ ml: 2, borderLeft: '1px solid rgba(255,255,255,0.12)', pl: 1, py: 0.5 }}>
                  {analyticsLinks.map((link) => (
                    <ListItemButton
                      key={link.path}
                      onClick={() => nav(link.path)}
                      sx={{
                        borderRadius: 1.5, py: 0.75, px: 1.5, mb: 0.25,
                        color: isActive(link.path) ? '#93c5fd' : 'rgba(255,255,255,0.6)',
                        bgcolor: isActive(link.path) ? 'rgba(147,197,253,0.1)' : 'transparent',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: '#fff' },
                      }}
                    >
                      <Typography sx={{ fontSize: 11, mr: 1 }}>{link.icon}</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: isActive(link.path) ? 600 : 400 }}>
                        {link.label}
                      </Typography>
                    </ListItemButton>
                  ))}
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.08)' }} />
          <Box sx={{ px: 2, pb: 0.5 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Account
            </Typography>
          </Box>

          <ListItemButton onClick={() => nav('/settings')} sx={itemSx(isActive('/settings'))}>
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              <SettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={<Typography sx={{ fontSize: 13, fontWeight: isActive('/settings') ? 600 : 400 }}>Alerts & Settings</Typography>} />
          </ListItemButton>
        </List>
      </Box>
    </Box>
  )

  return (
    <>
      <Drawer
        variant="temporary" open={mobileOpen} onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', lg: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
      >
        {sidebarContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{ display: { xs: 'none', lg: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, position: 'fixed' } }}
        open
      >
        {sidebarContent}
      </Drawer>
    </>
  )
}
