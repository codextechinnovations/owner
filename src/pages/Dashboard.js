import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People,
  MeetingRoom,
  Payments,
  Receipt,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Add,
  Visibility,
  ArrowForward,
  Warning,
  CheckCircle,
  AttachMoney,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/services';
import { tenantService } from '../services/services';
import { paymentService } from '../services/services';
import { colors } from '../theme';

const StatCard = ({ title, value, icon, color, subtitle, onClick }) => (
  <Card sx={{ height: '100%', cursor: onClick ? 'pointer' : 'default', transition: '0.2s', '&:hover': onClick ? { boxShadow: 4 } : {} }} onClick={onClick}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${color}15`,
          }}
        >
          {icon}
        </Box>
        {subtitle && (
          <Chip label={subtitle} size="small" sx={{ bgcolor: `${color}15`, color: color, fontWeight: 500 }} />
        )}
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 800, color: colors.text.primary, mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: colors.text.secondary }}>
        {title}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { selectedPg } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentTenants, setRecentTenants] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPg]);

  const fetchDashboardData = async () => {
    if (!selectedPg) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const [statsRes, tenantsRes, paymentsRes] = await Promise.all([
        dashboardService.getStats(selectedPg._id, currentMonth, currentYear),
        tenantService.getAll({ pgId: selectedPg._id }),
        paymentService.getAll({ pgId: selectedPg._id, month: currentMonth, year: currentYear }),
      ]);

      const dashboardStats = statsRes?.data || statsRes || {};
      const tenants = Array.isArray(tenantsRes) ? tenantsRes : (tenantsRes?.data || []);
      const payments = Array.isArray(paymentsRes) ? paymentsRes : (paymentsRes?.data || []);

      setStats({
        activeTenants: dashboardStats.activeTenants || 0,
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

      const pendingTenants = tenants.filter(t => {
        const hasPayment = payments.some(p => p.tenantId === t._id || p.tenant_id === t._id);
        return t.status === 'active' && !hasPayment;
      });
      setPendingPayments(pendingTenants.slice(0, 5));

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setStats({
        activeTenants: 0,
        vacantRooms: 0,
        totalRooms: 0,
        occupancyRate: 0,
        expectedRent: 0,
        totalPayments: 0,
        totalExpenses: 0,
        profit: 0,
        pendingAmount: 0,
        collectedPercentage: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const occupancyPercentage = stats?.occupancyRate || 0;
  const collectionPercentage = stats?.expectedRent > 0
    ? Math.round((stats.totalPayments / stats.expectedRent) * 100)
    : 0;

  const getTenantName = (payment) => {
    return payment.tenantName || payment.name || 'Unknown';
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
          {selectedPg ? `Managing ${selectedPg.name}` : 'Welcome to ManageYourPG'}
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} md={3}>
          {loading ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <StatCard
              title="Tenants"
              value={stats?.activeTenants || 0}
              icon={<People sx={{ color: colors.primary[700], fontSize: 20 }} />}
              color={colors.primary[700]}
              subtitle={`${stats?.totalRooms || 0} rooms`}
              onClick={() => navigate('/tenants')}
            />
          )}
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          {loading ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <StatCard
              title="Revenue"
              value={formatCurrency(stats?.totalPayments)}
              icon={<Payments sx={{ color: colors.success, fontSize: 20 }} />}
              color={colors.success}
              subtitle={`${collectionPercentage}%`}
              onClick={() => navigate('/payments')}
            />
          )}
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          {loading ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <StatCard
              title="Expenses"
              value={formatCurrency(stats?.totalExpenses)}
              icon={<Receipt sx={{ color: colors.error, fontSize: 20 }} />}
              color={colors.error}
              onClick={() => navigate('/expenses')}
            />
          )}
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          {loading ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <StatCard
              title="Profit"
              value={formatCurrency(stats?.profit)}
              icon={stats?.profit >= 0 ? <TrendingUp sx={{ color: colors.success, fontSize: 20 }} /> : <TrendingDown sx={{ color: colors.error, fontSize: 20 }} />}
              color={stats?.profit >= 0 ? colors.success : colors.error}
              onClick={() => navigate('/reports')}
            />
          )}
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Occupancy Rate</Typography>
                    <Chip label={`${occupancyPercentage}%`} size="small" sx={{ bgcolor: `${colors.primary[700]}15`, color: colors.primary[700], fontWeight: 600 }} />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress variant="determinate" value={occupancyPercentage} sx={{ height: 10, borderRadius: 5, bgcolor: colors.border.main, '& .MuiLinearProgress-bar': { borderRadius: 5, background: `linear-gradient(90deg, ${colors.primary[700]}, ${colors.primary[500]})` } }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats?.activeTenants || 0}</Typography>
                      <Typography variant="caption" sx={{ color: colors.text.secondary }}>Occupied</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats?.totalRooms || 0}</Typography>
                      <Typography variant="caption" sx={{ color: colors.text.secondary }}>Total Rooms</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{(stats?.totalRooms || 0) - (stats?.activeTenants || 0)}</Typography>
                      <Typography variant="caption" sx={{ color: colors.text.secondary }}>Vacant</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Rent Collection</Typography>
                    <Chip label={`${collectionPercentage}% Collected`} size="small" sx={{ bgcolor: `${colors.success}15`, color: colors.success, fontWeight: 600 }} />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress variant="determinate" value={collectionPercentage} sx={{ height: 10, borderRadius: 5, bgcolor: colors.border.main, '& .MuiLinearProgress-bar': { borderRadius: 5, background: `linear-gradient(90deg, ${colors.success}, ${colors.primary[700]})` } }} />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: colors.text.secondary }}>Expected</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(stats?.expectedRent)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: colors.text.secondary }}>Collected</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.success }}>{formatCurrency(stats?.totalPayments)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: colors.text.secondary }}>Pending</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.error }}>{formatCurrency(stats?.pendingAmount)}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Payments</Typography>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/payments')}>View All</Button>
              </Box>
              {loading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)
              ) : recentPayments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Payments sx={{ fontSize: 40, color: colors.text.secondary, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: colors.text.secondary }}>No payments recorded this month</Typography>
                  <Button variant="outlined" size="small" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => navigate('/payments')}>Record Payment</Button>
                </Box>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentPayments.map((payment, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: colors.primary[700], fontSize: 14 }}>{getTenantName(payment).charAt(0)}</Avatar>
                              <Typography variant="body2">{getTenantName(payment)}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Typography variant="body2" sx={{ fontWeight: 600, color: colors.success }}>{formatCurrency(payment.amount)}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{formatDate(payment.paymentDate || payment.payment_date)}</Typography></TableCell>
                          <TableCell align="right">
                            <Tooltip title="View"><IconButton size="small" onClick={() => navigate('/payments')}><Visibility fontSize="small" /></IconButton></Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Tenants</Typography>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/tenants')}>View All</Button>
              </Box>
              {loading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)
              ) : recentTenants.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <People sx={{ fontSize: 40, color: colors.text.secondary, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: colors.text.secondary }}>No tenants added yet</Typography>
                  <Button variant="outlined" size="small" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => navigate('/tenants')}>Add Tenant</Button>
                </Box>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentTenants.map((tenant, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: colors.primary[700], fontSize: 14 }}>{tenant.name?.charAt(0) || 'T'}</Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{tenant.name}</Typography>
                                <Typography variant="caption" sx={{ color: colors.text.secondary }}>{tenant.email || tenant.occupation || 'N/A'}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell><Typography variant="body2">{tenant.phone}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{tenant.roomNumber || 'N/A'}</Typography></TableCell>
                          <TableCell>
                            <Chip label={tenant.status === 'active' ? 'Active' : tenant.status} size="small" sx={{ bgcolor: tenant.status === 'active' ? `${colors.success}15` : `${colors.warning}15`, color: tenant.status === 'active' ? colors.success : colors.warning, fontWeight: 500, textTransform: 'capitalize' }} />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View"><IconButton size="small" onClick={() => navigate('/tenants')}><Visibility fontSize="small" /></IconButton></Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Pending Payments</Typography>
              {loading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} height={60} sx={{ mb: 1 }} />)
              ) : pendingPayments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CheckCircle sx={{ fontSize: 40, color: colors.success, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: colors.success }}>All caught up!</Typography>
                  <Typography variant="caption" sx={{ color: colors.text.secondary }}>No pending payments</Typography>
                </Box>
              ) : (
                <Box>
                  {pendingPayments.map((tenant, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: idx < pendingPayments.length - 1 ? `1px solid ${colors.border.main}` : 'none' }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: colors.warning + '20', color: colors.warning }}>{tenant.name?.charAt(0)}</Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{tenant.name}</Typography>
                        <Typography variant="caption" sx={{ color: colors.text.secondary }}>{tenant.roomNumber ? `Room ${tenant.roomNumber}` : 'No room assigned'}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.warning }}>{formatCurrency(tenant.monthlyRent || tenant.rent)}</Typography>
                        <Typography variant="caption" sx={{ color: colors.error }}>Overdue</Typography>
                      </Box>
                    </Box>
                  ))}
                  {pendingPayments.length > 0 && (
                    <Button fullWidth size="small" sx={{ mt: 2 }} onClick={() => navigate('/payments')}>View All Pending</Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Quick Actions</Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Box onClick={() => navigate('/tenants')} sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: `${colors.primary[700]}10`, cursor: 'pointer', '&:hover': { bgcolor: `${colors.primary[700]}20` } }}>
                    <People sx={{ fontSize: 28, color: colors.primary[700], mb: 0.5 }} />
                    <Typography variant="caption" sx={{ fontWeight: 500, display: 'block' }}>Add Tenant</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box onClick={() => navigate('/payments')} sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: `${colors.success}10`, cursor: 'pointer', '&:hover': { bgcolor: `${colors.success}20` } }}>
                    <Payments sx={{ fontSize: 28, color: colors.success, mb: 0.5 }} />
                    <Typography variant="caption" sx={{ fontWeight: 500, display: 'block' }}>Add Payment</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box onClick={() => navigate('/rooms')} sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: `${colors.accent.purple}10`, cursor: 'pointer', '&:hover': { bgcolor: `${colors.accent.purple}20` } }}>
                    <MeetingRoom sx={{ fontSize: 28, color: colors.accent.purple, mb: 0.5 }} />
                    <Typography variant="caption" sx={{ fontWeight: 500, display: 'block' }}>Manage Rooms</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box onClick={() => navigate('/expenses')} sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: `${colors.error}10`, cursor: 'pointer', '&:hover': { bgcolor: `${colors.error}20` } }}>
                    <Receipt sx={{ fontSize: 28, color: colors.error, mb: 0.5 }} />
                    <Typography variant="caption" sx={{ fontWeight: 500, display: 'block' }}>Add Expense</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box onClick={() => navigate('/reports')} sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: `${colors.warning}10`, cursor: 'pointer', '&:hover': { bgcolor: `${colors.warning}20` } }}>
                    <AccountBalance sx={{ fontSize: 28, color: colors.warning, mb: 0.5 }} />
                    <Typography variant="caption" sx={{ fontWeight: 500, display: 'block' }}>Reports</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box onClick={() => navigate('/support')} sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: `${colors.primary[500]}10`, cursor: 'pointer', '&:hover': { bgcolor: `${colors.primary[500]}20` } }}>
                    <Warning sx={{ fontSize: 28, color: colors.primary[500], mb: 0.5 }} />
                    <Typography variant="caption" sx={{ fontWeight: 500, display: 'block' }}>Support</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2, bgcolor: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[900]})` }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <AttachMoney sx={{ fontSize: 48, color: 'white', mb: 1, opacity: 0.8 }} />
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>{formatCurrency(stats?.expectedRent - stats?.totalPayments || 0)}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Pending Amount to Collect</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
