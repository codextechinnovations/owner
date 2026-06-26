import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Skeleton,
  Chip,
  Button,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  People,
  MeetingRoom,
  Payments,
  Receipt,
  TrendingUp,
  TrendingDown,
  Add,
  ArrowForward,
  Warning,
  CheckCircle,
  WhatsApp,
  Refresh,
  Download,
  Visibility,
  LocationOn,
  Bed,
  CurrencyRupee,
  PersonAdd,
  BarChart,
  Notifications,
  Close,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { dashboardService, tenantService, paymentService, noticeService } from '../services/services';
import { colors } from '../theme';

const Dashboard = () => {
  const navigate = useNavigate();
  const { selectedPg } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentTenants, setRecentTenants] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [qrOpen, setQrOpen] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);

  const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const fetchDashboardData = useCallback(async () => {
    if (!selectedPg) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const currentMonthNum = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const [statsRes, tenantsRes, paymentsRes] = await Promise.all([
        dashboardService.getStats(selectedPg._id, currentMonthNum, currentYear),
        tenantService.getAll({ pgId: selectedPg._id }),
        paymentService.getAll({ pgId: selectedPg._id, month: currentMonthNum, year: currentYear }),
      ]);

      const dashboardStats = statsRes?.data || statsRes || {};
      const tenants = Array.isArray(tenantsRes) ? tenantsRes : (tenantsRes?.data || []);
      const payments = Array.isArray(paymentsRes) ? paymentsRes : (paymentsRes?.data || []);

      setStats({
        activeTenants: dashboardStats.activeTenants || 0,
        totalBeds: dashboardStats.totalBeds || 0,
        occupiedBeds: dashboardStats.occupiedBeds || 0,
        vacantBeds: dashboardStats.vacantBeds || (dashboardStats.totalBeds || 0) - (dashboardStats.occupiedBeds || 0),
        vacantRooms: dashboardStats.vacantRooms || 0,
        totalRooms: dashboardStats.totalRooms || 0,
        occupancyRate: dashboardStats.occupancyRate || 0,
        expectedRent: dashboardStats.expectedRent || 0,
        totalPayments: dashboardStats.totalPayments || 0,
        totalExpenses: dashboardStats.totalExpenses || 0,
        profit: dashboardStats.profit || 0,
        pendingAmount: (dashboardStats.expectedRent || 0) - (dashboardStats.totalPayments || 0),
        collectedPercentage: dashboardStats.collectedPercentage || 0,
      });

      setRecentTenants(tenants.slice(0, 5));
      setRecentPayments(payments.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setStats({
        activeTenants: 0, totalBeds: 0, occupiedBeds: 0, vacantBeds: 0,
        vacantRooms: 0, totalRooms: 0, occupancyRate: 0, expectedRent: 0,
        totalPayments: 0, totalExpenses: 0, profit: 0, pendingAmount: 0, collectedPercentage: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPg]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
  };

  const occupancyPercentage = stats?.occupancyRate ||
    (stats?.totalBeds > 0 ? Math.round(((stats?.occupiedBeds || 0) / stats.totalBeds) * 100) : 0);
  const collectionPercentage = stats?.expectedRent > 0
    ? Math.round((stats.totalPayments / stats.expectedRent) * 100)
    : 0;

  const sendBulkReminders = async () => {
    if (!selectedPg?._id) return;
    if (!window.confirm('Send payment reminders to all tenants with pending payments?')) return;
    setReminderLoading(true);
    try {
      const res = await noticeService.sendBulkReminder({ pgId: selectedPg._id });
      alert(res.data?.message || 'Reminders sent successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send reminders');
    } finally {
      setReminderLoading(false);
    }
  };

  const handleShareQR = () => {
    if (!selectedPg?.qrCode) return;
    const link = document.createElement('a');
    link.href = selectedPg.qrCode;
    link.download = `${selectedPg.name || 'pg'}_qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTenantName = (payment) => payment.tenantName || payment.name || 'Unknown';
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A';

  const quickActions = [
    { icon: PersonAdd, label: 'Add Tenant', color: '#1a1a4e', bg: '#EFF6FF', path: '/tenants' },
    { icon: Payments, label: 'Add Payment', color: '#10B981', bg: '#F0FDF4', path: '/payments' },
    { icon: Receipt, label: 'Add Expense', color: '#EF4444', bg: '#FFF5F5', path: '/expenses' },
    { icon: BarChart, label: 'Reports', color: '#8B5CF6', bg: '#F5F3FF', path: '/reports' },
    { icon: WhatsApp, label: reminderLoading ? 'Sending...' : 'Send Reminders', color: '#F59E0B', bg: '#FEF3C7', action: sendBulkReminders },
    { icon: MeetingRoom, label: 'Room Mgmt', color: '#1a1a4e', bg: '#EFF6FF', path: '/room-management' },
  ];

  const HeroStat = ({ icon: Icon, label, value, color }) => (
    <Box sx={{ flex: 1, textAlign: 'center' }}>
      <Icon sx={{ color, fontSize: 16, mb: 0.3 }} />
      <Typography variant="body2" sx={{ fontWeight: 700, color, lineHeight: 1.3 }}>{value}</Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>{label}</Typography>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: colors.text.primary, mb: 0.5 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
          {selectedPg ? `Managing ${selectedPg.name}` : 'Welcome to ManageYourPG'}
        </Typography>
      </Box>

      {/* Hero Card */}
      {loading ? (
        <Skeleton variant="rounded" height={220} sx={{ mb: 3, borderRadius: 4 }} />
      ) : (
        <Card
          sx={{
            mb: 3,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #1a1a4e 0%, #2d2d7e 50%, #1e3a8a 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(30,58,138,0.35)',
          }}
        >
          <CardContent sx={{ position: 'relative', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', mb: 0.5 }}>{selectedPg?.name}</Typography>
                {selectedPg?.address && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                    <LocationOn sx={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{selectedPg.address}</Typography>
                  </Box>
                )}
                <Chip label={currentMonth} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.18)', fontWeight: 600 }} />
              </Box>
              {selectedPg?.qrCode && (
                <Box sx={{ textAlign: 'center', ml: 2 }}>
                  <Box
                    component="img"
                    src={selectedPg.qrCode}
                    alt="PG QR"
                    onClick={() => setQrOpen(true)}
                    sx={{ width: 60, height: 60, bgcolor: '#fff', p: 0.6, borderRadius: 3, cursor: 'pointer' }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 0.5 }}>Tap to view</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', bgcolor: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 3, p: 2 }}>
              <HeroStat icon={CurrencyRupee} label="Revenue" value={formatCurrency(stats?.totalPayments)} color="#6EE7B7" />
              <HeroStat icon={Receipt} label="Expenses" value={formatCurrency(stats?.totalExpenses)} color="#FCA5A5" />
              <HeroStat icon={TrendingUp} label="Profit" value={formatCurrency(stats?.profit)} color={stats?.profit >= 0 ? '#93C5FD' : '#FCA5A5'} />
            </Box>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          {/* Occupancy Card */}
          <Card sx={{ borderRadius: 4, mb: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#EFF6FF', color: '#1a1a4e', width: 36, height: 36, mr: 1.5 }}><Bed fontSize="small" /></Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', flex: 1 }}>Occupancy</Typography>
                <Chip label={`${occupancyPercentage}%`} size="small" sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700 }} />
              </Box>
              <LinearProgress
                variant="determinate"
                value={occupancyPercentage}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: '#F3F4F6',
                  '& .MuiLinearProgress-bar': { borderRadius: 5, background: 'linear-gradient(90deg, #1a1a4e, #6366F1)' },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600 }}>{stats?.occupiedBeds || 0} Occupied Beds</Typography>
                <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600 }}>{stats?.vacantBeds || 0} Vacant Beds</Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Rent Collection Card */}
          <Card sx={{ borderRadius: 4, mb: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#F0FDF4', color: '#10B981', width: 36, height: 36, mr: 1.5 }}><CurrencyRupee fontSize="small" /></Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', flex: 1 }}>Rent Collection</Typography>
                <Chip label={`${collectionPercentage}% Collected`} size="small" sx={{ bgcolor: '#F0FDF4', color: '#15803D', fontWeight: 700 }} />
              </Box>

              {[
                { label: 'Expected Rent', value: stats?.expectedRent, color: '#374151' },
                { label: 'Collected', value: stats?.totalPayments, color: '#10B981' },
                { label: 'Pending', value: stats?.pendingAmount, color: stats?.pendingAmount > 0 ? '#EF4444' : '#10B981' },
              ].map((row, idx, arr) => (
                <Box
                  key={row.label}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                    borderBottom: idx < arr.length - 1 ? '1px solid #F3F4F6' : 'none',
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>{row.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: row.color }}>{formatCurrency(row.value)}</Typography>
                </Box>
              ))}

              <LinearProgress
                variant="determinate"
                value={collectionPercentage}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: '#F3F4F6',
                  mt: 2,
                  '& .MuiLinearProgress-bar': { borderRadius: 5, background: 'linear-gradient(90deg, #10B981, #1a1a4e)' },
                }}
              />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>Recent Payments</Typography>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/payments')} sx={{ textTransform: 'none' }}>View All</Button>
              </Box>
              {loading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} height={50} sx={{ mb: 1, borderRadius: 3 }} />)
              ) : recentPayments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Avatar sx={{ bgcolor: '#F3F4F6', color: '#9CA3AF', width: 56, height: 56, mx: 'auto', mb: 1.5 }}><Payments /></Avatar>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>No payments recorded this month</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {recentPayments.map((payment, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#F9FAFB', borderRadius: 3 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: '#1a1a4e', fontSize: 14 }}>{getTenantName(payment).charAt(0)}</Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>{getTenantName(payment)}</Typography>
                        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{formatDate(payment.paymentDate || payment.payment_date)}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#10B981' }}>{formatCurrency(payment.amount)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          {/* Quick Actions */}
          <Card sx={{ borderRadius: 4, mb: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 2 }}>Quick Actions</Typography>
              <Grid container spacing={1.5}>
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Grid item xs={6} key={action.label}>
                      <Box
                        onClick={() => action.path ? navigate(action.path) : action.action?.()}
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          borderRadius: 3,
                          bgcolor: action.bg,
                          cursor: 'pointer',
                          border: '1px solid #F3F4F6',
                          transition: '0.2s',
                          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
                        }}
                      >
                        <Avatar sx={{ bgcolor: 'transparent', color: action.color, width: 40, height: 40, mx: 'auto', mb: 0.8 }}>
                          <Icon />
                        </Avatar>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', display: 'block' }}>{action.label}</Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>

          {/* Overview */}
          <Card sx={{ borderRadius: 4, mb: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 2 }}>Overview</Typography>
              <Grid container spacing={2}>
                {[
                  { icon: People, label: 'Active Tenants', value: stats?.activeTenants || 0, color: '#1a1a4e', bg: '#EFF6FF' },
                  { icon: Bed, label: 'Vacant Beds', value: stats?.vacantBeds || 0, color: '#F59E0B', bg: '#FFFBEB' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Grid item xs={6} key={item.label}>
                      <Card sx={{ borderRadius: 3, textAlign: 'center', border: '1px solid #F3F4F6' }}>
                        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                          <Avatar sx={{ bgcolor: item.bg, color: item.color, width: 44, height: 44, mx: 'auto', mb: 1 }}><Icon /></Avatar>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>{item.value}</Typography>
                          <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600 }}>{item.label}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>

          {/* Pending Amount */}
          <Card sx={{ borderRadius: 4, background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[900]})`, color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <CurrencyRupee sx={{ fontSize: 40, color: 'white', mb: 1, opacity: 0.8 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', mb: 0.5 }}>{formatCurrency(stats?.pendingAmount || 0)}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Pending Amount to Collect</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          PG QR Code
          <IconButton onClick={() => setQrOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          {selectedPg?.qrCode && (
            <Box component="img" src={selectedPg.qrCode} alt="PG QR" sx={{ width: 260, height: 260, objectFit: 'contain', borderRadius: 4, border: `1px solid ${colors.border.main}` }} />
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Tenants can scan this QR code to make payments
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setQrOpen(false)} sx={{ borderRadius: 3 }}>Close</Button>
          <Button startIcon={<Download />} onClick={handleShareQR} variant="contained" sx={{ borderRadius: 3 }}>Download</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
