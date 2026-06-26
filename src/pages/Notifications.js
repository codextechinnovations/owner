import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Avatar,
} from '@mui/material';
import { Notifications as NotificationsIcon, Delete, MarkEmailRead, Refresh } from '@mui/icons-material';
import { notificationService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userId = user?._id || user?.id;

  const fetchNotifications = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await notificationService.getAll({ userId, userType: 'owner', limit: 100 });
      const data = response.data?.data || response.data || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      setError('Failed to mark notification as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setSuccess('Notification deleted');
    } catch (err) {
      setError('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    if (!notifications.length) return;
    setLoading(true);
    try {
      await Promise.all(notifications.map((n) => notificationService.delete(n._id)));
      setNotifications([]);
      setSuccess('All notifications cleared');
    } catch (err) {
      setError('Failed to clear all notifications');
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (d) => {
    if (!d) return '';
    const date = d?.seconds ? new Date(d.seconds * 1000) : new Date(d);
    return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: colors.text.primary, mb: 0.5 }}>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stay updated with alerts and reminders
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchNotifications} disabled={loading} sx={{ borderRadius: 3 }}>
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{success}</Alert>}

      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: `${colors.primary[700]}15`, color: colors.primary[700], width: 36, height: 36 }}>
                <NotificationsIcon fontSize="small" />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
                Inbox
              </Typography>
              {unreadCount > 0 && (
                <Chip
                  label={`${unreadCount} unread`}
                  size="small"
                  sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 700, borderRadius: 2 }}
                />
              )}
            </Box>
            {notifications.length > 0 && (
              <Button color="error" size="small" onClick={handleClearAll} disabled={loading} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}>
                Clear All
              </Button>
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Avatar sx={{ bgcolor: '#F3F4F6', color: '#9CA3AF', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                <NotificationsIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" sx={{ color: '#111827', fontWeight: 700, mb: 0.5 }}>No Notifications</Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>You're all caught up!</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {notifications.map((n) => (
                <Card
                  key={n._id}
                  onClick={() => !n.read && handleMarkRead(n._id)}
                  sx={{
                    borderRadius: 3,
                    boxShadow: 'none',
                    border: '1px solid #F3F4F6',
                    bgcolor: n.read ? '#fff' : '#F5F9FF',
                    cursor: n.read ? 'default' : 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'background 0.2s',
                  }}
                >
                  {!n.read && (
                    <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: '#1a1a4e', borderRadius: '4px 0 0 4px' }} />
                  )}
                  <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2, pl: n.read ? 2 : 2.5, '&:last-child': { pb: 2 } }}>
                    <Avatar sx={{ bgcolor: n.read ? '#F3F4F6' : `${colors.primary[700]}15`, color: n.read ? '#9CA3AF' : colors.primary[700], width: 36, height: 36, mt: 0.2 }}>
                      <NotificationsIcon fontSize="small" />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: n.read ? 600 : 700, color: '#111827' }}>
                        {n.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5, lineHeight: 1.5 }}>
                        {n.body}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9CA3AF', mt: 1, display: 'block' }}>
                        {formatTime(n.createdAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {!n.read && (
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMarkRead(n._id); }} title="Mark as read" sx={{ color: colors.primary[700] }}>
                          <MarkEmailRead fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }} title="Delete">
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Notifications;
