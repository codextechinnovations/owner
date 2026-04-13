import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery, AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, Menu, MenuItem, Divider, Badge } from '@mui/material';
import { Menu as MenuIcon, Notifications, Person, Logout, Dashboard, People, MeetingRoom, Payment, Receipt, Assessment, Support as SupportIcon, Settings as SettingsIcon, ChevronLeft, AssignmentTurnedIn } from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Tenants', icon: <People />, path: '/tenants' },
  { text: 'Tenant Requests', icon: <AssignmentTurnedIn />, path: '/tenant-requests' },
  { text: 'Rooms', icon: <MeetingRoom />, path: '/rooms' },
  { text: 'Payments', icon: <Payment />, path: '/payments' },
  { text: 'Expenses', icon: <Receipt />, path: '/expenses' },
  { text: 'Reports', icon: <Assessment />, path: '/reports' },
  { text: 'Support', icon: <SupportIcon />, path: '/support' },
  { divider: true },
  { text: 'Profile', icon: <Person />, path: '/profile' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const Layout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, selectedPg } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]}, ${colors.primary[900]})`,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
            <MeetingRoom sx={{ color: 'white' }} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
              ManageYourPG
            </Typography>
            {selectedPg && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                {selectedPg.name}
              </Typography>
            )}
          </Box>
        </Box>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      {/* Menu Items */}
      <List sx={{ flex: 1, py: 2 }}>
        {menuItems.map((item, index) => (
          item.divider ? (
            <Divider key={`divider-${index}`} sx={{ my: 1, mx: 2 }} />
          ) : (
            <ListItem key={item.text} disablePadding sx={{ px: 2, mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  backgroundColor: location.pathname === item.path ? `${colors.primary[700]}15` : 'transparent',
                  '&:hover': {
                    backgroundColor: `${colors.primary[700]}10`,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname === item.path ? colors.primary[700] : colors.text.secondary,
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    color: location.pathname === item.path ? colors.primary[700] : colors.text.primary,
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>

      {/* User Section */}
      <Box sx={{ p: 2, borderTop: `1px solid ${colors.border.light}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: colors.primary[700], width: 40, height: 40 }}>
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
              {user?.phone || ''}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleLogout}
            sx={{
              color: colors.error,
              bgcolor: `${colors.error}12`,
              '&:hover': { bgcolor: `${colors.error}20` },
            }}
            title="Logout"
          >
            <Logout fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: colors.background.default }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'white',
          borderBottom: `1px solid ${colors.border.light}`,
          zIndex: (theme) => theme.zIndex.drawer + 1,
          display: { md: 'none' },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ color: colors.text.primary }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, color: colors.text.primary }}>
            ManageYourPG
          </Typography>
          <IconButton onClick={handleMenuOpen}>
            <Badge badgeContent={3} color="error">
              <Notifications sx={{ color: colors.text.secondary }} />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: { xs: '64px', md: 0 },
        }}
      >
        {children}
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
          <ListItemIcon><Person fontSize="small" /></ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;
