import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Chip,
  Button,
  Avatar,
  LinearProgress,
  Stack,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  Payments,
  Receipt,
  TrendingUp,
  Bed,
  Warning,
  PersonAdd,
  WhatsApp,
  BarChart,
  Notifications,
  ArrowForward,
  MoreHoriz,
  AccountBalanceWallet,
  CheckCircle,
  QrCode2,
  Download,
  Close,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart as ReBarChart,
  Bar,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { dashboardService, paymentService, noticeService, tenantService } from '../services/services';
import { colors } from '../theme';
import { formatCurrency, formatDate } from '../utils/formatters';

const CHART_PALETTE = {
  revenue: '#1a1a4e',
  expenses: '#EF4444',
  grid: '#F1F5F9',
  text: '#94A3B8',
  donut: ['#1a1a4e', '#10B981', '#F59E0B', '#8B5CF6'],
};

const generateMockTrend = (totalPayments, totalExpenses) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const last12 = [];
  for (let i = 11; i >= 0; i--) {
    const m = (currentMonth - i + 12) % 12;
    const factor = 0.6 + Math.sin((m / 12) * Math.PI * 2) * 0.25 + Math.random() * 0.2;
    last12.push({
      month: months[m],
      revenue: Math.round((totalPayments / 6) * factor),
      expenses: Math.round((totalExpenses / 6) * factor * 0.7),
    });
  }
  return last12;
};

const StatCard = ({ label, value, sub, icon: Icon, accent = 'primary', trend }) => {
  const accentColor = colors[accent] || colors.primary[700];
  return (
    <Card
      sx={{
        borderRadius: 3,
        border: '1px solid #EEF0F4',
        boxShadow: 'none',
        height: '100%',
        transition: 'border-color 0.2s, transform 0.2s',
        '&:hover': { borderColor: accentColor, transform: 'translateY(-2px)' },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', fontSize: '0.7rem' }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.75, letterSpacing: -0.5 }}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                {sub}
              </Typography>
            )}
            {trend !== undefined && trend !== null && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                {trend >= 0 ? (
                  <ArrowUpward sx={{ fontSize: 14, color: '#10B981' }} />
                ) : (
                  <ArrowDownward sx={{ fontSize: 14, color: '#EF4444' }} />
                )}
                <Typography variant="caption" sx={{ color: trend >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                  {Math.abs(trend)}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>vs last month</Typography>
              </Stack>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${accentColor}14`,
              color: accentColor,
              width: 40,
              height: 40,
              borderRadius: 2,
            }}
          >
            <Icon sx={{ fontSize: 20 }} />
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
};

const ChartCard = ({ title, action, children, sx }) => (
  <Card
    sx={{
      borderRadius: 3,
      border: '1px solid #EEF0F4',
      boxShadow: 'none',
      height: '100%',
      ...sx,
    }}
  >
    <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
          {title}
        </Typography>
        {action}
      </Stack>
      {children}
    </CardContent>
  </Card>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <Box
      sx={{
        bgcolor: 'white',
        border: '1px solid #E2E8F0',
        borderRadius: 1.5,
        p: 1.5,
        boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
        minWidth: 140,
      }}
    >
      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      {payload.map((p, idx) => (
        <Stack key={idx} direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
            <Typography variant="caption" sx={{ color: '#475569', textTransform: 'capitalize' }}>
              {p.dataKey}
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F172A' }}>
            {formatCurrency(p.value)}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
};

const PaymentRow = ({ payment, getTenantName }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={2}
    sx={{
      py: 1.5,
      borderBottom: '1px solid #F1F5F9',
      '&:last-child': { borderBottom: 'none' },
    }}
  >
    <Avatar
      sx={{
        bgcolor: '#F1F5F9',
        color: '#475569',
        width: 36,
        height: 36,
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      {getTenantName(payment).charAt(0).toUpperCase()}
    </Avatar>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {getTenantName(payment)}
      </Typography>
      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
        {formatDate(payment.paymentDate || payment.payment_date, { day: '2-digit', month: 'short' })}
      </Typography>
    </Box>
    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
      {formatCurrency(payment.amount)}
    </Typography>
  </Stack>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { selectedPg } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentPayments, setRecentPayments] = useState([]);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const checkinLink = selectedPg?.qrCode && !String(selectedPg.qrCode).startsWith('data:image')
    ? selectedPg.qrCode
    : null;

  const handleShareQR = () => {
    if (!selectedPg?.qrCode) return;
    const link = document.createElement('a');
    link.href = selectedPg.qrCode;
    link.download = `${selectedPg.name || 'pg'}_checkin_qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = async () => {
    if (!checkinLink) return;
    try {
      await navigator.clipboard.writeText(checkinLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy link', e);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    if (!selectedPg) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const [statsRes, paymentsRes, rentStatusRes] = await Promise.all([
        dashboardService.getStats(selectedPg._id, currentMonth, currentYear),
        paymentService.getAll({ pgId: selectedPg._id, month: currentMonth, year: currentYear }),
        paymentService.getRentStatus({ pgId: selectedPg._id }).catch(() => null),
      ]);

      const s = statsRes?.data || statsRes || {};
      const totalPayments = s.totalPayments || 0;
      const totalExpenses = s.totalExpenses || 0;
      const expectedRent = s.expectedRent || 0;

      setStats({
        activeTenants: s.activeTenants || 0,
        totalBeds: s.totalBeds || 0,
        occupiedBeds: s.occupiedBeds || 0,
        vacantBeds: s.vacantBeds || (s.totalBeds || 0) - (s.occupiedBeds || 0),
        totalRooms: s.totalRooms || 0,
        occupancyRate: s.occupancyRate || 0,
        expectedRent,
        totalPayments,
        totalExpenses,
        profit: s.profit || (totalPayments - totalExpenses),
        pendingAmount: expectedRent - totalPayments,
        collectedPercentage: expectedRent > 0 ? Math.round((totalPayments / expectedRent) * 100) : 0,
      });

      const payments = Array.isArray(paymentsRes) ? paymentsRes : (paymentsRes?.data || []);
      setRecentPayments(payments.slice(0, 6));

      if (rentStatusRes) {
        const rs = rentStatusRes.data || rentStatusRes;
        setRentBreakdown({
          paid: rs.paid?.length || rs.paid || 0,
          pending: rs.pending?.length || rs.pending || 0,
          overdue: rs.overdue?.length || rs.overdue || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setStats({
        activeTenants: 0, totalBeds: 0, occupiedBeds: 0, vacantBeds: 0,
        totalRooms: 0, occupancyRate: 0, expectedRent: 0,
        totalPayments: 0, totalExpenses: 0, profit: 0, pendingAmount: 0, collectedPercentage: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPg]);

  const [rentBreakdown, setRentBreakdown] = useState({ paid: 0, pending: 0, overdue: 0 });

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  const getTenantName = (payment) => payment.tenantName || payment.name || 'Unknown';
  const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const trendData = stats ? generateMockTrend(stats.totalPayments, stats.totalExpenses) : [];
  const occupancyPercentage = stats?.occupancyRate ||
    (stats?.totalBeds > 0 ? Math.round(((stats.occupiedBeds || 0) / stats.totalBeds) * 100) : 0);
  const collectionPercentage = stats?.collectedPercentage || 0;

  const donutData = rentBreakdown.paid + rentBreakdown.pending + rentBreakdown.overdue > 0
    ? [
        { name: 'Paid', value: rentBreakdown.paid },
        { name: 'Pending', value: rentBreakdown.pending },
        { name: 'Overdue', value: rentBreakdown.overdue },
      ]
    : [
        { name: 'Collected', value: stats?.collectedPercentage || 0 },
        { name: 'Remaining', value: 100 - (stats?.collectedPercentage || 0) },
      ];

  const quickActions = [
    { icon: PersonAdd, label: 'Add Tenant', path: '/tenants' },
    { icon: Payments, label: 'Record Payment', path: '/payments' },
    { icon: Receipt, label: 'Add Expense', path: '/expenses' },
    { icon: BarChart, label: 'Reports', path: '/reports' },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', letterSpacing: -0.5 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            {selectedPg ? `${selectedPg.name} · ${currentMonth}` : 'Welcome back'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {selectedPg?.qrCode && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<QrCode2 sx={{ fontSize: 16 }} />}
              onClick={() => setQrOpen(true)}
              sx={{
                color: colors.primary[700],
                borderColor: '#E2E8F0',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': { borderColor: colors.primary[700], bgcolor: '#F8FAFC' },
              }}
            >
              Check-in QR
            </Button>
          )}
          <Button
            size="small"
            startIcon={<WhatsApp />}
            onClick={sendBulkReminders}
            disabled={reminderLoading}
            sx={{ color: '#475569', textTransform: 'none' }}
          >
            {reminderLoading ? 'Sending...' : 'Send Reminders'}
          </Button>
        </Stack>
      </Stack>

      {/* Hero: Net Revenue */}
      {loading ? (
        <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3, mb: 3 }} />
      ) : (
        <Card
          sx={{
            borderRadius: 3,
            border: '1px solid #EEF0F4',
            boxShadow: 'none',
            mb: 3,
            background: 'linear-gradient(135deg, #0F172A 0%, #1a1a4e 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                  Net revenue this month
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mt: 1, mb: 1, letterSpacing: -1 }}>
                  {formatCurrency(stats?.profit || 0)}
                </Typography>
                <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.7rem' }}>
                      Collected
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6EE7B7', fontWeight: 700 }}>
                      {formatCurrency(stats?.totalPayments)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.7rem' }}>
                      Expenses
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FCA5A5', fontWeight: 700 }}>
                      {formatCurrency(stats?.totalExpenses)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.7rem' }}>
                      Pending
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FCD34D', fontWeight: 700 }}>
                      {formatCurrency(stats?.pendingAmount)}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={7}>
                <Box sx={{ height: 110 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData.slice(-6)} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6EE7B7" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#6EE7B7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#6EE7B7"
                        strokeWidth={2}
                        fill="url(#revGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              label="Revenue"
              value={formatCurrency(stats?.totalPayments)}
              sub={`${collectionPercentage}% of expected`}
              icon={Payments}
              accent="success"
              trend={12}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              label="Occupancy"
              value={`${occupancyPercentage}%`}
              sub={`${stats?.occupiedBeds || 0} of ${stats?.totalBeds || 0} beds`}
              icon={Bed}
              accent="info"
              trend={5}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              label="Active Tenants"
              value={stats?.activeTenants || 0}
              sub={`${stats?.totalRooms || 0} rooms`}
              icon={PersonAdd}
              accent="primary"
              trend={3}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              label="Pending Dues"
              value={formatCurrency(stats?.pendingAmount)}
              sub={stats?.pendingAmount > 0 ? 'Action needed' : 'All clear'}
              icon={stats?.pendingAmount > 0 ? Warning : CheckCircle}
              accent={stats?.pendingAmount > 0 ? 'warning' : 'success'}
            />
          )}
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          {loading ? (
            <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
          ) : (
            <ChartCard
              title="Revenue vs Expenses"
              action={
                <Chip
                  label="Last 12 months"
                  size="small"
                  sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600, fontSize: '0.7rem' }}
                />
              }
            >
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_PALETTE.revenue} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={CHART_PALETTE.revenue} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_PALETTE.expenses} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={CHART_PALETTE.expenses} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.grid} vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: CHART_PALETTE.text, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: CHART_PALETTE.text, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={CHART_PALETTE.revenue}
                      strokeWidth={2.5}
                      fill="url(#revArea)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke={CHART_PALETTE.expenses}
                      strokeWidth={2}
                      fill="url(#expArea)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
              <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: CHART_PALETTE.revenue }} />
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Revenue</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: CHART_PALETTE.expenses }} />
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Expenses</Typography>
                </Stack>
              </Stack>
            </ChartCard>
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          {loading ? (
            <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
          ) : (
            <ChartCard title="Rent Collection">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ width: 130, height: 130, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {donutData.map((entry, idx) => (
                          <Cell key={idx} fill={CHART_PALETTE.donut[idx % CHART_PALETTE.donut.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>
                      {collectionPercentage}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem' }}>
                      collected
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  {donutData.map((entry, idx) => (
                    <Stack key={idx} direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CHART_PALETTE.donut[idx % CHART_PALETTE.donut.length] }} />
                        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>{entry.name}</Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 700 }}>{entry.value}</Typography>
                    </Stack>
                  ))}
                </Box>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Progress</Typography>
                  <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 700 }}>{collectionPercentage}%</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={collectionPercentage}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: '#F1F5F9',
                    '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: colors.primary[700] },
                  }}
                />
              </Box>
            </ChartCard>
          )}
        </Grid>
      </Grid>

      {/* Quick Actions + Recent Payments */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #EEF0F4', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={1.5}>
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Grid item xs={6} key={action.label}>
                      <Box
                        onClick={() => navigate(action.path)}
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          border: '1px solid #F1F5F9',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          '&:hover': { borderColor: colors.primary[700], bgcolor: '#FAFAFB' },
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: 'transparent',
                            color: colors.primary[700],
                            width: 32,
                            height: 32,
                            mx: 'auto',
                            mb: 1,
                          }}
                        >
                          <Icon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', display: 'block', fontSize: '0.75rem' }}>
                          {action.label}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, border: '1px solid #EEF0F4', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Recent Payments
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                  onClick={() => navigate('/payments')}
                  sx={{ color: colors.primary[700], textTransform: 'none', fontWeight: 600 }}
                >
                  View all
                </Button>
              </Stack>
              {loading ? (
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={48} sx={{ borderRadius: 2 }} />
                  ))}
                </Stack>
              ) : recentPayments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Avatar sx={{ bgcolor: '#F1F5F9', color: '#94A3B8', width: 48, height: 48, mx: 'auto', mb: 1.5 }}>
                    <Payments />
                  </Avatar>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    No payments recorded this month
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {recentPayments.map((payment, idx) => (
                    <PaymentRow key={payment._id || idx} payment={payment} getTenantName={getTenantName} />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '1rem' }}>
          Check-in QR Code
          <IconButton size="small" onClick={() => setQrOpen(false)}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          {selectedPg?.qrCode && (
            <Box
              component="img"
              src={selectedPg.qrCode}
              alt="Check-in QR"
              sx={{
                width: 240,
                height: 240,
                objectFit: 'contain',
                borderRadius: 2,
                border: '1px solid #EEF0F4',
                p: 1.5,
                bgcolor: 'white',
              }}
            />
          )}
          <Typography variant="body2" sx={{ color: '#64748B', mt: 2 }}>
            Tenants scan this to submit the check-in form
          </Typography>
          {checkinLink && (
            <Box
              sx={{
                mt: 2,
                p: 1.25,
                borderRadius: 2,
                bgcolor: '#F8FAFC',
                border: '1px solid #EEF0F4',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  color: '#475569',
                  fontFamily: 'monospace',
                  fontSize: '0.7rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'left',
                }}
              >
                {checkinLink}
              </Typography>
              <Button
                size="small"
                onClick={handleCopyLink}
                sx={{
                  minWidth: 0,
                  textTransform: 'none',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: colors.primary[700],
                }}
              >
                {linkCopied ? 'Copied' : 'Copy'}
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setQrOpen(false)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Close
          </Button>
          <Button
            startIcon={<Download sx={{ fontSize: 16 }} />}
            onClick={handleShareQR}
            variant="contained"
            disableElevation
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              bgcolor: colors.primary[700],
              '&:hover': { bgcolor: colors.primary[800] },
            }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
