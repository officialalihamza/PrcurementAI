import { useState } from 'react'
import {
  Drawer, List, ListItemButton, ListItemIcon,
  Collapse, Box, Typography, Divider,
} from '@mui/material'
import DashboardOutlinedIcon       from '@mui/icons-material/DashboardOutlined'
import SearchOutlinedIcon           from '@mui/icons-material/SearchOutlined'
import BarChartOutlinedIcon         from '@mui/icons-material/BarChartOutlined'
import QueryStatsOutlinedIcon       from '@mui/icons-material/QueryStatsOutlined'
import BlockOutlinedIcon            from '@mui/icons-material/BlockOutlined'
import DonutSmallOutlinedIcon       from '@mui/icons-material/DonutSmallOutlined'
import AccountBalanceOutlinedIcon   from '@mui/icons-material/AccountBalanceOutlined'
import TrendingUpOutlinedIcon       from '@mui/icons-material/TrendingUpOutlined'
import TrackChangesOutlinedIcon     from '@mui/icons-material/TrackChangesOutlined'
import FindInPageOutlinedIcon       from '@mui/icons-material/FindInPageOutlined'
import ShowChartOutlinedIcon        from '@mui/icons-material/ShowChartOutlined'
import SettingsOutlinedIcon         from '@mui/icons-material/SettingsOutlined'
import ExpandLessIcon               from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon               from '@mui/icons-material/ExpandMore'
import AutoAwesomeOutlinedIcon      from '@mui/icons-material/AutoAwesomeOutlined'
import BusinessOutlinedIcon         from '@mui/icons-material/BusinessOutlined'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence }  from 'framer-motion'

const DRAWER_WIDTH = 252

// ── Section definitions ───────────────────────────────────────────────────────

const MAIN_ITEMS = [
  { label: 'Dashboard',        path: '/dashboard',       Icon: DashboardOutlinedIcon },
  { label: 'Contracts',        path: '/contracts',        Icon: SearchOutlinedIcon },
  { label: 'Recommended',      path: '/recommendations',  Icon: AutoAwesomeOutlinedIcon },
  { label: 'Company Profile',  path: '/profile-setup',    Icon: BusinessOutlinedIcon },
]

const ANALYTICS_SUB = [
  { label: 'Market Overview',      path: '/analytics',                              Icon: BarChartOutlinedIcon },
  { label: 'Statistical Analysis', path: '/analytics/stats',                        Icon: QueryStatsOutlinedIcon },
  { label: 'Barrier Analysis',     path: '/analytics/barriers',                     Icon: BlockOutlinedIcon },
  { label: 'Sector Profiles',      path: '/analytics/barriers/sector-profiles',     Icon: DonutSmallOutlinedIcon },
  { label: 'Institutional',        path: '/analytics/barriers/institutional',       Icon: AccountBalanceOutlinedIcon },
]

const TOOL_ITEMS = [
  { label: 'Winnability',       path: '/analytics/barriers/winnability',         Icon: TrackChangesOutlinedIcon },
  { label: 'Language Detector', path: '/analytics/barriers/language-detector',   Icon: FindInPageOutlinedIcon },
  { label: 'Forecasting',       path: '/analytics/predictive',                   Icon: ShowChartOutlinedIcon },
]

// ── Style helpers ─────────────────────────────────────────────────────────────

const itemSx = (active: boolean) => ({
  borderRadius: 1.5,
  py: 0.875, px: 1.5,
  mb: 0.25,
  mx: 1,
  color: active ? '#fff' : 'rgba(255,255,255,0.65)',
  bgcolor: active ? 'rgba(147,197,253,0.15)' : 'transparent',
  borderLeft: active ? '3px solid #60a5fa' : '3px solid transparent',
  '& .MuiListItemIcon-root': { color: active ? '#60a5fa' : 'rgba(255,255,255,0.45)' },
  '&:hover': {
    bgcolor: 'rgba(255,255,255,0.07)',
    color: '#fff',
    '& .MuiListItemIcon-root': { color: 'rgba(255,255,255,0.8)' },
  },
  transition: 'all 0.15s',
})

const subItemSx = (active: boolean) => ({
  borderRadius: 1.5,
  py: 0.75, px: 1.5,
  mb: 0.25,
  color: active ? '#fff' : 'rgba(255,255,255,0.6)',
  bgcolor: active ? 'rgba(147,197,253,0.15)' : 'transparent',
  borderLeft: active ? '3px solid #60a5fa' : '3px solid transparent',
  '& .MuiListItemIcon-root': { color: active ? '#60a5fa' : 'rgba(255,255,255,0.35)' },
  '&:hover': {
    bgcolor: 'rgba(255,255,255,0.07)',
    color: '#fff',
    '& .MuiListItemIcon-root': { color: 'rgba(255,255,255,0.7)' },
  },
  transition: 'all 0.15s',
})

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ px: 2.5, pt: 2, pb: 0.5 }}>
      <Typography sx={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)',
      }}>
        {children}
      </Typography>
    </Box>
  )
}

function NavItem({ label, path, Icon, active, onClick }: {
  label: string; path: string; Icon: React.ElementType
  active: boolean; onClick: () => void
}) {
  return (
    <ListItemButton onClick={onClick} sx={itemSx(active)}>
      <ListItemIcon sx={{ minWidth: 34 }}>
        <Icon sx={{ fontSize: 18 }} />
      </ListItemIcon>
      <Typography sx={{ fontSize: 13, fontWeight: active ? 600 : 400, color: 'inherit', lineHeight: 1 }}>
        {label}
      </Typography>
    </ListItemButton>
  )
}

function SubNavItem({ label, path, Icon, active, onClick }: {
  label: string; path: string; Icon: React.ElementType
  active: boolean; onClick: () => void
}) {
  return (
    <ListItemButton onClick={onClick} sx={subItemSx(active)}>
      <ListItemIcon sx={{ minWidth: 30 }}>
        <Icon sx={{ fontSize: 15 }} />
      </ListItemIcon>
      <Typography sx={{ fontSize: 12, fontWeight: active ? 600 : 400, color: 'inherit', lineHeight: 1 }}>
        {label}
      </Typography>
    </ListItemButton>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface Props { mobileOpen: boolean; onClose: () => void }

export function Sidebar({ mobileOpen, onClose }: Props) {
  const location  = useLocation()
  const navigate  = useNavigate()
  const [analyticsOpen, setAnalyticsOpen] = useState(location.pathname.startsWith('/analytics'))

  const isActive  = (path: string) => location.pathname === path
  const nav       = (path: string) => { navigate(path); onClose() }

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f1f35' }}>

      {/* Logo */}
      <Box sx={{ px: 2.5, py: 2.5, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 2,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
          }}>
            <TrendingUpOutlinedIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
              ProcurementAI
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, lineHeight: 1 }}>
              UK Contract Intelligence
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
      }}>
        <List dense disablePadding>

          {/* Main */}
          <SectionLabel>Main</SectionLabel>
          {MAIN_ITEMS.map(({ label, path, Icon }) => (
            <NavItem key={path} label={label} path={path} Icon={Icon}
              active={isActive(path)} onClick={() => nav(path)} />
          ))}

          {/* Analytics */}
          <SectionLabel>Analytics</SectionLabel>

          {/* Collapsible analytics group */}
          <ListItemButton
            onClick={() => setAnalyticsOpen(o => !o)}
            sx={{
              ...itemSx(location.pathname.startsWith('/analytics') && !TOOL_ITEMS.some(t => isActive(t.path))),
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ListItemIcon sx={{ minWidth: 34 }}>
                <BarChartOutlinedIcon sx={{ fontSize: 18 }} />
              </ListItemIcon>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'inherit' }}>
                Analytics
              </Typography>
            </Box>
            <Box sx={{ color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>
              {analyticsOpen ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
            </Box>
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
                <Box sx={{ ml: 1.5, pl: 1.5, borderLeft: '1px solid rgba(255,255,255,0.08)', mx: 2, my: 0.5 }}>
                  {ANALYTICS_SUB.map(({ label, path, Icon }) => (
                    <SubNavItem key={path} label={label} path={path} Icon={Icon}
                      active={isActive(path)} onClick={() => nav(path)} />
                  ))}
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tools section */}
          <SectionLabel>Tools</SectionLabel>
          {TOOL_ITEMS.map(({ label, path, Icon }) => (
            <NavItem key={path} label={label} path={path} Icon={Icon}
              active={isActive(path)} onClick={() => nav(path)} />
          ))}

          <Divider sx={{ my: 1.5, mx: 2, borderColor: 'rgba(255,255,255,0.07)' }} />

          {/* Account */}
          <SectionLabel>Account</SectionLabel>
          <NavItem label="Settings" path="/settings" Icon={SettingsOutlinedIcon}
            active={isActive('/settings')} onClick={() => nav('/settings')} />

        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
          514,875 UK contracts · 2016–2026
        </Typography>
      </Box>
    </Box>
  )

  return (
    <>
      <Drawer variant="temporary" open={mobileOpen} onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', lg: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: '#0f1f35', border: 'none' } }}>
        {sidebarContent}
      </Drawer>
      <Drawer variant="permanent"
        sx={{ display: { xs: 'none', lg: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, position: 'fixed', bgcolor: '#0f1f35', border: 'none', borderRight: '1px solid rgba(255,255,255,0.06)' } }}
        open>
        {sidebarContent}
      </Drawer>
    </>
  )
}
