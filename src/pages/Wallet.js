import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  IconButton,
  Skeleton,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Add,
  Remove,
  WhatsApp,
  Refresh,
  AutoFixHigh,
  Close,
  Receipt,
  Alarm,
  Download,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { walletService } from '../services/services';
import { colors } from '../theme';
import { exportToCsv } from '../utils/exportHelpers';

const ADMIN_WHATSAPP_NUMBER = '919741821179';

const Wallet = () => {
  const { selectedPg } = useAuth();
  const [balance, setBalance] = useState(0);
  const [totalCredited, setTotalCredited] = useState(0);
  const [totalUsed, setTotalUsed] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoReminder, setAutoReminder] = useState(false);
  const [updatingReminder, setUpdatingReminder] = useState(false);
  const [error, setError] = useState('');
  const [rechargeOpen, setRechargeOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!selectedPg?._id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [walletRes, txRes, reminderRes] = await Promise.all([
        walletService.getWallet(selectedPg._id),
        walletService.getTransactions(selectedPg._id),
        walletService.getAutoReminder(selectedPg._id),
      ]);

      const wallet = walletRes?.data?.data || walletRes?.data?.wallet || walletRes?.data || walletRes;
      if (wallet && typeof wallet === 'object') {
        setBalance(wallet.balance ?? wallet.credits ?? wallet.credit ?? wallet.amount ?? 0);
        setTotalCredited(wallet.totalCredited ?? wallet.total_credited ?? wallet.totalCredit ?? 0);
        setTotalUsed(wallet.totalUsed ?? wallet.total_used ?? 0);
      }

      const txData = txRes?.data?.data || txRes?.data?.transactions || txRes?.data || [];
      setTransactions(Array.isArray(txData) ? txData : []);

      const reminderData = reminderRes?.data?.data || reminderRes?.data;
      if (reminderData) {
        setAutoReminder(!!reminderData.autoRentReminder);
      }
    } catch (err) {
      console.error('Failed to load wallet:', err);
      setError(err.response?.data?.message || 'Failed to load wallet data.');
    } finally {
      setLoading(false);
    }
  }, [selectedPg]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleAutoReminder = async () => {
    if (!selectedPg?._id) return;
    const newValue = !autoReminder;
    setUpdatingReminder(true);
    try {
      await walletService.updateAutoReminder(selectedPg._id, {
        autoRentReminder: newValue,
      });
      setAutoReminder(newValue);
    } catch (err) {
      console.error('Failed to update auto reminder:', err);
      setError('Failed to update auto-reminder setting.');
    } finally {
      setUpdatingReminder(false);
    }
  };

  const openWhatsAppRecharge = () => {
    const text = encodeURIComponent(
      `Hi, I want to recharge WhatsApp credits for my PG ${selectedPg?.name || ''}.`
    );
    const url = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${text}`;
    window.open(url, '_blank');
    setRechargeOpen(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExport = () => {
    exportToCsv('wallet-transactions', [
      { label: 'Date', key: (item) => formatDate(item.createdAt) },
      { label: 'Time', key: (item) => formatTime(item.createdAt) },
      { label: 'Type', key: 'type' },
      { label: 'Amount', key: 'amount' },
      { label: 'Reason', key: 'reason' },
    ], transactions);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: colors.text.primary, mb: 0.5 }}>
            WhatsApp Credits
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your WhatsApp messaging balance and auto-reminders
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={handleExport} disabled={transactions.length === 0} sx={{ borderRadius: 3 }}>
            Export
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadData} disabled={loading} sx={{ borderRadius: 3 }}>
            Refresh
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4, bgcolor: '#1a1a4e', color: 'white', mb: 2, boxShadow: '0 8px 30px rgba(26,26,78,0.3)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>Available Credits</Typography>
                  <Typography variant="h2" sx={{ fontWeight: 800, fontSize: '3rem' }}>
                    {loading ? <CircularProgress size={40} color="inherit" /> : balance}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.12)', width: 56, height: 56, borderRadius: 4 }}>
                  <WhatsApp sx={{ fontSize: 30 }} />
                </Avatar>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>1 credit = 1 WhatsApp reminder</Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setRechargeOpen(true)}
                  sx={{ bgcolor: '#22C55E', borderRadius: 3, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#16A34A' } }}
                >
                  Add Credit
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            {[
              { label: 'Total Credited', value: totalCredited, color: '#10B981', icon: Add },
              { label: 'Total Used', value: totalUsed, color: '#EF4444', icon: Remove },
            ].map((s) => (
              <Grid item xs={6} key={s.label}>
                <Card sx={{ borderRadius: 4, textAlign: 'center', border: '1px solid #F3F4F6' }}>
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: s.color, mb: 0.5 }}>{s.value}</Typography>
                    <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card sx={{ borderRadius: 4, border: '1px solid #F3F4F6' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, pr: 2 }}>
                <Avatar sx={{ bgcolor: '#E0E7FF', color: '#1a1a4e', width: 44, height: 44 }}>
                  <Alarm />
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>Automatic Rent Reminder</Typography>
                  <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Send daily WhatsApp reminders to tenants with pending rent. Each reminder uses 1 credit.</Typography>
                </Box>
              </Box>
              <Switch
                checked={autoReminder}
                onChange={toggleAutoReminder}
                disabled={updatingReminder || loading}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>Credit History</Typography>
                <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600 }}>{transactions.length} transactions</Typography>
              </Box>

              {loading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} height={60} sx={{ mb: 1, borderRadius: 3 }} />
                  ))}
                </>
              ) : transactions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Avatar sx={{ bgcolor: '#F3F4F6', color: '#9CA3AF', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                    <Receipt sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ color: '#374151', fontWeight: 700, mb: 0.5 }}>No transactions yet</Typography>
                  <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Your WhatsApp credit usage will appear here.</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {transactions.map((item, index) => {
                    const isCredit = item.type === 'credit';
                    const color = isCredit ? '#10B981' : '#EF4444';
                    return (
                      <Box key={item._id || index}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
                          <Avatar sx={{ bgcolor: `${color}15`, color, width: 40, height: 40, borderRadius: 3 }}>
                            {isCredit ? <Add fontSize="small" /> : <Remove fontSize="small" />}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }} noWrap>
                              {item.reason || (isCredit ? 'Credit' : 'Debit')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                              {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
                            </Typography>
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color }}>
                            {isCredit ? '+' : '-'}{item.amount}
                          </Typography>
                        </Box>
                        {index < transactions.length - 1 && <Box sx={{ height: 1, bgcolor: '#F3F4F6' }} />}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={rechargeOpen} onClose={() => setRechargeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <Avatar sx={{ bgcolor: '#DCFCE7', color: '#25D366', width: 64, height: 64, mx: 'auto', mb: 2 }}>
            <WhatsApp sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>Contact Admin for Recharge</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
            To add WhatsApp credits, please message our admin on WhatsApp.
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827', mb: 2 }}>
            +91 {ADMIN_WHATSAPP_NUMBER.replace('91', '').replace(/(\d{5})(\d{5})/, '$1 $2')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<WhatsApp />}
            onClick={openWhatsAppRecharge}
            sx={{ bgcolor: '#25D366', borderRadius: 3, textTransform: 'none', fontWeight: 700, py: 1.2 }}
          >
            Chat on WhatsApp
          </Button>
          <Button fullWidth variant="outlined" onClick={() => setRechargeOpen(false)} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, py: 1.2 }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Wallet;
