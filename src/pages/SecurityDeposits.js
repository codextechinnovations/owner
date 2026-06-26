import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Skeleton,
  Avatar,
  Alert,
  Grid,
  Button,
} from '@mui/material';
import { Search, AccountBalanceWallet, Person, ArrowForward, Download } from '@mui/icons-material';
import { tenantService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { exportToCsv } from '../utils/exportHelpers';

const statusMap = {
  active: { label: 'Active', bg: '#DCFCE7', color: '#15803D' },
  notice: { label: 'Notice', bg: '#FEF3C7', color: '#92400E' },
  notice_period: { label: 'Notice', bg: '#FEF3C7', color: '#92400E' },
  moved_out: { label: 'Vacated', bg: '#FEE2E2', color: '#991B1B' },
  vacated: { label: 'Vacated', bg: '#FEE2E2', color: '#991B1B' },
};

const getDeposit = (t) => Number(t.securityDeposit || t.advanceAmount || t.deposit || 0);

const SecurityDeposits = () => {
  const { selectedPg } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchDeposits = async () => {
    if (!selectedPg?._id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await tenantService.getAll({ pgId: selectedPg._id, limit: 1000 });
      const data = response.data?.data || response.data || [];
      const list = (Array.isArray(data) ? data : []).map((t) => ({
        ...t,
        depositAmount: getDeposit(t),
      }));
      list.sort((a, b) => b.depositAmount - a.depositAmount);
      setTenants(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load security deposits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [selectedPg]);

  const filtered = tenants.filter((t) => {
    const term = search.toLowerCase();
    return (
      (t.name || t.tenantName || '').toLowerCase().includes(term) ||
      (t.phone || '').toLowerCase().includes(term) ||
      String(t.roomNumber || t.room_number || '').toLowerCase().includes(term)
    );
  });

  const totalDeposits = tenants.reduce((sum, t) => sum + (Number(t.depositAmount) || 0), 0);
  const tenantsWithDeposits = tenants.filter((t) => Number(t.depositAmount) > 0).length;

  const handleExport = () => {
    exportToCsv('security-deposits', [
      { label: 'Tenant', key: 'name' },
      { label: 'Phone', key: 'phone' },
      { label: 'Room', key: 'roomNumber' },
      { label: 'Deposit', key: 'depositAmount' },
      { label: 'Status', key: 'status' },
    ], filtered);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: colors.text.primary, mb: 0.5 }}>
            Security Deposits
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track advance and security deposit amounts collected from tenants
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleExport}
          disabled={filtered.length === 0}
          sx={{ borderRadius: 3 }}
        >
          Export
        </Button>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchDeposits} disabled={loading}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 4, background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[900]})`, color: 'white' }}>
            <CardContent sx={{ py: 2.5 }}>
              <Typography variant="body2" sx={{ opacity: 0.85, mb: 0.5 }}>Total Deposits</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                ₹{totalDeposits.toLocaleString('en-IN')}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85, mt: 0.5, display: 'block' }}>
                {tenants.length} tenants
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5, height: '100%' }}>
              <Avatar sx={{ bgcolor: `${colors.accent.green}15`, color: colors.accent.green }}>
                <AccountBalanceWallet />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">Tenants with Deposits</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: colors.text.primary }}>
                  {tenantsWithDeposits}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by name, phone, or room number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: colors.text.secondary }} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />

          {loading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={90} sx={{ mb: 2, borderRadius: 3 }} />
              ))}
            </>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Avatar sx={{ bgcolor: '#F3F4F6', color: '#9CA3AF', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                <AccountBalanceWallet sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" sx={{ color: '#111827', fontWeight: 700, mb: 0.5 }}>No deposits found</Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>Try adjusting your search</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filtered.map((t) => {
                const deposit = Number(t.depositAmount) || 0;
                const statusKey = t.status || 'active';
                const status = statusMap[statusKey] || { label: statusKey.toUpperCase(), bg: '#F3F4F6', color: '#374151' };
                const initials = (t.name || t.tenantName || 'T').slice(0, 2).toUpperCase();

                return (
                  <Grid item xs={12} md={6} key={t._id || t.id}>
                    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #F3F4F6' }}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          {t.userPhoto ? (
                            <Avatar src={t.userPhoto} sx={{ width: 50, height: 50, border: '2px solid #E5E7EB' }} />
                          ) : (
                            <Avatar sx={{ width: 50, height: 50, bgcolor: '#1a1a4e', color: '#fff', fontWeight: 700 }}>
                              {initials}
                            </Avatar>
                          )}
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#111827' }}>{t.name || t.tenantName || '—'}</Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>Room {t.roomNumber || t.room_number || '—'}</Typography>
                            <Chip
                              size="small"
                              label={status.label}
                              sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700, fontSize: '10px', display: 'block', mt: 0.5, width: 'fit-content' }}
                            />
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a1a4e' }}>
                            ₹{deposit.toLocaleString('en-IN')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>Deposit</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SecurityDeposits;
