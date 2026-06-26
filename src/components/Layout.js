import React, { useState, useEffect } from 'react';
import { Box, useTheme, useMediaQuery, AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, Menu, MenuItem, Divider, Badge, FormControl, Select } from '@mui/material';
import { Menu as MenuIcon, Notifications, Person, Logout, Dashboard, People, MeetingRoom, Payment, Receipt, Assessment, Support as SupportIcon, Settings as SettingsIcon, ChevronLeft, AssignmentTurnedIn, Restaurant, AccountBalance, Email, Description, AccountBalanceWallet } from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/services';
import { resolveLogoUrl } from '../utils/logoHelper';
import { colors } from '../theme';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Tenants', icon: <People />, path: '/tenants' },
  { text: 'Tenant Requests', icon: <AssignmentTurnedIn />, path: '/tenant-requests' },
  { text: 'Rooms', icon: <MeetingRoom />, path: '/rooms' },
  { text: 'Room Management', icon: <MeetingRoom />, path: '/rooms/management' },
  { text: 'Payments', icon: <Payment />, path: '/payments' },
  { text: 'Expenses', icon: <Receipt />, path: '/expenses' },
  { text: 'Reports', icon: <Assessment />, path: '/reports' },
  { text: 'Food Menu', icon: <Restaurant />, path: '/food-menu' },
  { text: 'Security Deposits', icon: <AccountBalance />, path: '/security-deposits' },
  { text: 'Bank Accounts', icon: <Payment />, path: '/bank-accounts' },
  { text: 'Send Notice', icon: <Email />, path: '/send-notice' },
  { text: 'Documents', icon: <Description />, path: '/documents' },
  { text: 'Wallet', icon: <AccountBalanceWallet />, path: '/wallet' },
  { text: 'Support', icon: <SupportIcon />, path: '/support' },
  { divider: true },
  { text: 'Notifications', icon: <Notifications />, path: '/notifications' },
  { text: 'Profile', icon: <Person />, path: '/profile' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const Layout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, selectedPg, pgs, selectPg } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    const fetchUnread = async () => {
      const userId = user?._id || user?.id;
      if (!userId) return;
      try {
        const response = await notificationService.getUnreadCount({ userId, userType: 'owner' });
        setUnreadCount(response.data?.count || 0);
      } catch (err) {
        setUnreadCount(0);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [user]);

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
          <Avatar
            src={resolveLogoUrl(selectedPg?.logo)}
            sx={{
              bgcolor: 'rgba(255,255,255,0.15)',
              color: 'white',
              width: 44,
              height: 44,
              border: '2px solid rgba(255,255,255,0.25)',
              fontWeight: 700,
              fontSize: '1rem',
            }}
            imgProps={{
              onError: (e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              },
            }}
          >
            {(selectedPg?.name || 'PG').slice(0, 2).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                color: 'white',
                fontWeight: 700,
                fontSize: '0.95rem',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {selectedPg?.name || 'ManageYourPG'}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', display: 'block' }}
            >
              {selectedPg ? 'PG Dashboard' : 'Select a PG'}
            </Typography>
            {(pgs || []).length > 1 && (
              <FormControl size="small" sx={{ mt: 1, minWidth: 150, maxWidth: '100%' }}>
                <Select
                  value={selectedPg?._id || selectedPg?.id || ''}
                  onChange={(e) => {
                    const pg = pgs.find((p) => (p._id || p.id) === e.target.value);
                    if (pg) selectPg(pg);
                  }}
                  sx={{
                    color: 'white',
                    fontSize: '0.75rem',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.6)' },
                    '.MuiSvgIcon-root': { color: 'white' },
                  }}
                >
                  {pgs.map((pg) => (
                    <MenuItem key={pg._id || pg.id} value={pg._id || pg.id}>
                      {pg.name || 'PG'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </Box>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'white', ml: 1 }}>
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      {/* Menu Items */}
      <List sx={{ flex: 1, py: 2, px: 1.5 }}>
        {menuItems.map((item, index) => (
          item.divider ? (
            <Divider key={`divider-${index}`} sx={{ my: 1.5, mx: 1 }} />
          ) : (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 3,
                  py: 1.2,
                  backgroundColor: location.pathname === item.path ? `${colors.primary[700]}12` : 'transparent',
                  '&:hover': {
                    backgroundColor: location.pathname === item.path ? `${colors.primary[700]}18` : `${colors.primary[700]}08`,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 42,
                    mr: 1.5,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 34,
                      height: 34,
                      bgcolor: location.pathname === item.path ? colors.primary[700] : `${colors.primary[700]}10`,
                      color: location.pathname === item.path ? 'white' : colors.primary[700],
                      transition: 'all 0.2s ease',
                      '& svg': { fontSize: '1.1rem' },
                    }}
                  >
                    {item.icon}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 700 : 500,
                    color: location.pathname === item.path ? colors.primary[700] : colors.text.primary,
                    fontSize: '0.9rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>

      {/* User Section */}
      <Box sx={{ p: 2, borderTop: `1px solid ${colors.border.light}`, bgcolor: '#FAFAFA' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: colors.primary[700], width: 42, height: 42, fontWeight: 700, border: '2px solid white', boxShadow: '0 2px 8px rgba(26,26,78,0.12)' }}>
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#111827' }}>
              {user?.name || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.text.secondary, fontWeight: 500 }}>
              {user?.phone || ''}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleLogout}
            sx={{
              color: colors.error,
              bgcolor: `${colors.error}10`,
              '&:hover': { bgcolor: `${colors.error}18` },
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
          <IconButton onClick={() => navigate('/notifications')}>
            <Badge badgeContent={unreadCount} color="error">
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
