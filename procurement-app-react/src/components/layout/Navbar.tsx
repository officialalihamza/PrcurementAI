import { useState } from 'react'
import {
  AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem,
  InputBase, Box, Tooltip, Divider,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface Props { onMobileToggle: () => void }

export function Navbar({ onMobileToggle }: Props) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U'

  return (
    <AppBar position="sticky" elevation={0} sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
      <Toolbar sx={{ gap: 1, minHeight: 60 }}>
        <IconButton
          color="inherit"
          sx={{ display: { lg: 'none' }, mr: 0.5 }}
          onClick={onMobileToggle}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 3, flexShrink: 0 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: 2,
            background: 'linear-gradient(135deg, #2E75B6, #1F3A5F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>P</Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 15, color: '#1F3A5F', display: { xs: 'none', sm: 'block' } }}>
            ProcurementAI
          </Typography>
        </Box>

        {/* Search */}
        <Box sx={{
          flex: 1, maxWidth: 480,
          display: 'flex', alignItems: 'center', gap: 1,
          bgcolor: '#F0F2F5', borderRadius: 2, px: 1.5, py: 0.5,
          border: '1px solid #e8edf3',
        }}>
          <SearchIcon sx={{ fontSize: 18, color: '#6C757D' }} />
          <InputBase
            placeholder="Search contracts, sectors…"
            sx={{ flex: 1, fontSize: 13, color: '#1F3A5F' }}
          />
        </Box>

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Alerts & notifications">
          <IconButton sx={{ color: '#6C757D' }} onClick={() => navigate('/settings')}>
            <NotificationsOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <motion.div whileHover={{ scale: 1.05 }}>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
            <Avatar sx={{
              width: 32, height: 32, fontSize: 12, fontWeight: 700,
              background: 'linear-gradient(135deg, #2E75B6, #1F3A5F)',
            }}>
              {initials}
            </Avatar>
          </IconButton>
        </motion.div>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
          slotProps={{ paper: { elevation: 3, sx: { minWidth: 180, mt: 1 } } }}>
          <MenuItem disabled sx={{ fontSize: 12 }}>{user?.email}</MenuItem>
          <Divider />
          <MenuItem onClick={() => { navigate('/settings'); setAnchorEl(null) }} sx={{ fontSize: 13 }}>Settings</MenuItem>
          <MenuItem onClick={handleLogout} sx={{ fontSize: 13, color: 'error.main' }}>Sign out</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
