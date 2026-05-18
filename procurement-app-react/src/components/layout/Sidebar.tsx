import { useState } from 'react'
import {
  Drawer, List, ListItemButton, ListItemIcon,
  Box, Typography, Divider, Tooltip, IconButton,
} from '@mui/material'
import DashboardOutlinedIcon        from '@mui/icons-material/DashboardOutlined'
import SearchOutlinedIcon           from '@mui/icons-material/SearchOutlined'
import AutoAwesomeOutlinedIcon      from '@mui/icons-material/AutoAwesomeOutlined'
import BuildOutlinedIcon            from '@mui/icons-material/BuildOutlined'
import SettingsOutlinedIcon         from '@mui/icons-material/SettingsOutlined'
import TrendingUpOutlinedIcon       from '@mui/icons-material/TrendingUpOutlined'
import ExpandLessIcon               from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon               from '@mui/icons-material/ExpandMore'
import ChevronLeftIcon              from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon             from '@mui/icons-material/ChevronRight'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence }  from 'framer-motion'
import { SIDEBAR_W, SIDEBAR_W_COL } from './LayoutWrapper'

const BG = '#0f1f35'

// ── Nav data ──────────────────────────────────────────────────────────────────

const DASHBOARD_SUB = [
  { label: 'Overview',             path: '/dashboard' },
  { label: 'Market Overview',      path: '/analytics' },
  { label: 'Statistical Analysis', path: '/analytics/stats' },
  { label: 'Barrier Analysis',     path: '/analytics/barriers' },
  { label: 'Sector Profiles',      path: '/analytics/barriers/sector-profiles' },
  { label: 'Institutional',        path: '/analytics/barriers/institutional' },
]

const TOOL_SUB = [
  { label: 'Winnability',       path: '/winnability' },
  { label: 'Language Detector', path: '/language-detector' },
  { label: 'Forecasting',       path: '/analytics/predictive' },
]

const SETTINGS_SUB = [
  { label: 'Company Profile', path: '/profile-setup' },
  { label: 'Alerts',          path: '/settings' },
]

// ── Expanded: parent item ─────────────────────────────────────────────────────

interface ParentProps {
  label: string
  Icon: React.ElementType
  active?: boolean
  expanded?: boolean
  hasChildren?: boolean
  onClick: () => void
}

function ParentItem({ label, Icon, active = false, expanded = false, hasChildren = false, onClick }: ParentProps) {
  return (
    <ListItemButton onClick={onClick} sx={{
      py: 1.125, px: 2,
      bgcolor: (active || expanded) ? 'rgba(96,165,250,0.12)' : 'transparent',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
      transition: 'background 0.15s',
    }}>
      <ListItemIcon sx={{ minWidth: 36, color: active ? '#60a5fa' : 'rgba(255,255,255,0.55)' }}>
        <Icon sx={{ fontSize: 18 }} />
      </ListItemIcon>
      <Typography sx={{
        fontSize: 13, fontWeight: 600, flex: 1, lineHeight: 1,
        color: active ? '#fff' : 'rgba(255,255,255,0.85)',
      }}>
        {label}
      </Typography>
      {hasChildren && (
        expanded
          ? <ExpandLessIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
          : <ExpandMoreIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
      )}
    </ListItemButton>
  )
}

// ── Expanded: sub-item ────────────────────────────────────────────────────────

function SubItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <ListItemButton onClick={onClick} sx={{
      py: 0.875, pl: '44px', pr: 2,
      bgcolor: active ? 'rgba(96,165,250,0.14)' : 'transparent',
      borderBottom: '1px solid rgba(255,255,255,0.02)',
      '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
      transition: 'background 0.15s',
    }}>
      <Box component="span" sx={{
        mr: 1.5, fontSize: 20, lineHeight: '14px',
        color: active ? '#60a5fa' : 'rgba(255,255,255,0.3)',
      }}>•</Box>
      <Typography sx={{
        fontSize: 12.5, fontWeight: active ? 600 : 400, lineHeight: 1,
        color: active ? '#fff' : 'rgba(255,255,255,0.65)',
      }}>
        {label}
      </Typography>
    </ListItemButton>
  )
}

// ── Collapsed: icon-only item ─────────────────────────────────────────────────

function CollapsedItem({ label, Icon, active, onClick }: {
  label: string; Icon: React.ElementType; active: boolean; onClick: () => void
}) {
  return (
    <Tooltip title={label} placement="right" arrow>
      <ListItemButton onClick={onClick} sx={{
        py: 1.25, px: 0, justifyContent: 'center',
        bgcolor: active ? 'rgba(96,165,250,0.14)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
        transition: 'background 0.15s',
      }}>
        <Icon sx={{ fontSize: 20, color: active ? '#60a5fa' : 'rgba(255,255,255,0.55)' }} />
      </ListItemButton>
    </Tooltip>
  )
}

// ── Collapsible group (animated) ──────────────────────────────────────────────

function CollapseGroup({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ overflow: 'hidden' }}
        >
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.12)' }}>{children}</Box>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface Props {
  mobileOpen: boolean
  onClose: () => void
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ mobileOpen, onClose, collapsed, onToggle }: Props) {
  const location = useLocation()
  const navigate  = useNavigate()

  const isDashRoute   = location.pathname === '/dashboard' || location.pathname.startsWith('/analytics')
  const isToolRoute   = TOOL_SUB.some(t => location.pathname === t.path)
  const isSettingRoute= location.pathname === '/settings'  || location.pathname === '/profile-setup'

  const [dashOpen,    setDashOpen]    = useState(isDashRoute)
  const [toolOpen,    setToolOpen]    = useState(isToolRoute)
  const [settOpen,    setSettOpen]    = useState(isSettingRoute)

  const isActive = (p: string) => location.pathname === p
  const nav = (p: string) => { navigate(p); onClose() }

  // ── Collapsed view ──────────────────────────────────────────────────────────
  const collapsedContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: BG, alignItems: 'center' }}>
      {/* Logo icon */}
      <Box sx={{ py: 1.75, borderBottom: '1px solid rgba(255,255,255,0.07)', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
        }}>
          <TrendingUpOutlinedIcon sx={{ color: '#fff', fontSize: 18 }} />
        </Box>
      </Box>

      {/* Icon nav */}
      <Box sx={{ flex: 1, width: '100%', overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
        <List dense disablePadding>
          <CollapsedItem label="Analytical Dashboard" Icon={DashboardOutlinedIcon} active={isDashRoute && !isToolRoute} onClick={() => nav('/dashboard')} />
          <CollapsedItem label="Contracts"  Icon={SearchOutlinedIcon}        active={isActive('/contracts')}      onClick={() => nav('/contracts')} />
          <CollapsedItem label="AI Matches" Icon={AutoAwesomeOutlinedIcon}   active={isActive('/recommendations')} onClick={() => nav('/recommendations')} />
          <CollapsedItem label="Tools"      Icon={BuildOutlinedIcon}         active={isToolRoute}                 onClick={() => nav('/winnability')} />
          <Divider sx={{ my: 0.75, borderColor: 'rgba(255,255,255,0.07)' }} />
          <CollapsedItem label="Settings"   Icon={SettingsOutlinedIcon}      active={isSettingRoute}              onClick={() => nav('/settings')} />
        </List>
      </Box>

      {/* Expand toggle */}
      <Box sx={{ py: 1.5, borderTop: '1px solid rgba(255,255,255,0.07)', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Tooltip title="Expand sidebar" placement="right">
          <IconButton onClick={onToggle} size="small" sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}>
            <ChevronRightIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )

  // ── Expanded view ───────────────────────────────────────────────────────────
  const expandedContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: BG }}>

      {/* Logo row */}
      <Box sx={{ px: 2.5, py: 2.25, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 2, flexShrink: 0,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
          }}>
            <TrendingUpOutlinedIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>ProcurementAI</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, lineHeight: 1 }}>UK Contract Intelligence</Typography>
          </Box>
        </Box>

        {/* Collapse toggle */}
        <Tooltip title="Collapse sidebar" placement="right">
          <IconButton onClick={onToggle} size="small" sx={{ color: 'rgba(255,255,255,0.35)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}>
            <ChevronLeftIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Nav */}
      <Box sx={{
        flex: 1, overflowY: 'auto',
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
      }}>
        <List dense disablePadding>

          {/* Analytical Dashboard */}
          <ParentItem label="Analytical Dashboard" Icon={DashboardOutlinedIcon}
            active={isDashRoute && !isToolRoute} expanded={dashOpen} hasChildren
            onClick={() => setDashOpen(o => !o)} />
          <CollapseGroup open={dashOpen}>
            {DASHBOARD_SUB.map(({ label, path }) => (
              <SubItem key={path} label={label} active={isActive(path)} onClick={() => nav(path)} />
            ))}
          </CollapseGroup>

          {/* Contracts */}
          <ParentItem label="Contracts" Icon={SearchOutlinedIcon}
            active={isActive('/contracts')} onClick={() => nav('/contracts')} />

          {/* AI Matches */}
          <ParentItem label="AI Matches" Icon={AutoAwesomeOutlinedIcon}
            active={isActive('/recommendations')} onClick={() => nav('/recommendations')} />

          {/* Tools */}
          <ParentItem label="Tools" Icon={BuildOutlinedIcon}
            active={isToolRoute} expanded={toolOpen} hasChildren
            onClick={() => setToolOpen(o => !o)} />
          <CollapseGroup open={toolOpen}>
            {TOOL_SUB.map(({ label, path }) => (
              <SubItem key={path} label={label} active={isActive(path)} onClick={() => nav(path)} />
            ))}
          </CollapseGroup>

          <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.07)' }} />

          {/* Settings */}
          <ParentItem label="Settings" Icon={SettingsOutlinedIcon}
            active={isSettingRoute} expanded={settOpen} hasChildren
            onClick={() => setSettOpen(o => !o)} />
          <CollapseGroup open={settOpen}>
            {SETTINGS_SUB.map(({ label, path }) => (
              <SubItem key={path} label={label} active={isActive(path)} onClick={() => nav(path)} />
            ))}
          </CollapseGroup>

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

  const drawerWidth = collapsed ? SIDEBAR_W_COL : SIDEBAR_W
  const sidebarContent = collapsed ? collapsedContent : expandedContent

  return (
    <>
      {/* Mobile temporary drawer — always full width */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { width: SIDEBAR_W, bgcolor: BG, border: 'none' },
        }}
      >
        {expandedContent}
      </Drawer>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            position: 'fixed',
            bgcolor: BG,
            border: 'none',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            overflowX: 'hidden',
            transition: 'width 0.25s ease',
          },
        }}
        open
      >
        {sidebarContent}
      </Drawer>
    </>
  )
}
