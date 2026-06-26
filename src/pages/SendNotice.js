import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  Grid,
  Chip,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import { Send, Email, WhatsApp, AccountBalanceWallet, Info } from '@mui/icons-material';
import { noticeService, tenantService, walletService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const TENANT_TYPES = [
  { value: 'active', label: 'Active Tenants' },
  { value: 'notice', label: 'Tenants on Notice' },
  { value: 'moved_out', label: 'Moved Out Tenants' },
];

const SendNotice = () => {
  const { selectedPg, pgs } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tenantType, setTenantType] = useState('active');
  const [pgId, setPgId] = useState('');
  const [estimatedCount, setEstimatedCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (selectedPg?._id) {
      setPgId(selectedPg._id);
    }
  }, [selectedPg]);

  useEffect(() => {
    if (!pgId) return;
    const estimateCount = async () => {
      setLoadingCount(true);
      try {
        const params = { status: tenantType, limit: 1000 };
        const response = await tenantService.getAll(params);
        const data = response.data?.data || response.data || [];
        const tenants = Array.isArray(data) ? data : [];
        setEstimatedCount(tenants.length);
      } catch (err) {
        setEstimatedCount(0);
      } finally {
        setLoadingCount(false);
      }
    };
    estimateCount();
  }, [pgId, tenantType]);

  useEffect(() => {
    if (!pgId) return;
    const loadWallet = async () => {
      try {
        const res = await walletService.getWallet(pgId);
        const wallet = res?.data?.data;
        setWalletBalance(wallet?.balance || 0);
      } catch (err) {
        setWalletBalance(0);
      }
    };
    loadWallet();
  }, [pgId]);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Please enter both title and message.');
      return;
    }
    if (!sendEmail && !sendWhatsApp) {
      setError('Please select at least one sending method (Email or WhatsApp).');
      return;
    }
    if (sendWhatsApp && estimatedCount > 0 && walletBalance < estimatedCount) {
      setError(`Not enough credits. Need ${estimatedCount - walletBalance} more credit${estimatedCount - walletBalance === 1 ? '' : 's'}.`);
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        subject: subject.trim(),
        message: message.trim(),
        tenantType,
        sendEmail,
        sendWhatsApp,
      };
      if (pgId) payload.pgId = pgId;

      const res = await noticeService.sendBulk(payload);
      const results = res.data?.results || {};
      const emailPart = sendEmail
        ? `Email: ${results.email?.success || 0}/${results.email?.total || 0}`
        : '';
      const whatsappPart = sendWhatsApp
        ? `WhatsApp: ${results.whatsapp?.success || 0}/${results.whatsapp?.total || 0} (used ${results.whatsapp?.creditsUsed || 0} credit${results.whatsapp?.creditsUsed === 1 ? '' : 's'})`
        : '';
      const summary = [emailPart, whatsappPart].filter(Boolean).join(' | ');
      setSuccess(`Notice Sent. ${summary || `Total: ${results.total || 0}`}`);
      setSubject('');
      setMessage('');
      if (sendWhatsApp) {
        const walletRes = await walletService.getWallet(pgId);
        setWalletBalance(walletRes?.data?.data?.balance || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notice');
    } finally {
      setSending(false);
    }
  };

  const recipientLabel = tenantType === 'active' ? 'active' : tenantType === 'notice' ? 'tenants on notice' : 'moved out';
  const sendChannel = sendEmail && sendWhatsApp ? 'via Email and WhatsApp' : sendEmail ? 'via Email' : sendWhatsApp ? 'via WhatsApp' : '';
  const enoughCredits = walletBalance >= estimatedCount || estimatedCount === 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: colors.text.primary, mb: 0.5 }}>
            Send Notice
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Send important updates to your tenants via email and/or WhatsApp
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <CardContent sx={{ p: 3 }}>
              {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{success}</Alert>}

              {(pgs || []).length > 1 && (
                <TextField
                  select
                  fullWidth
                  label="Select PG (Optional)"
                  value={pgId}
                  onChange={(e) => setPgId(e.target.value)}
                  size="small"
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                >
                  <MenuItem value="">All PGs</MenuItem>
                  {pgs.map((pg) => (
                    <MenuItem key={pg._id || pg.id} value={pg._id || pg.id}>
                      {pg.name || 'PG'}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                fullWidth
                label="Title"
                placeholder="Eg. Monthly Maintenance Update"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                size="small"
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />

              <TextField
                fullWidth
                label="Message"
                placeholder="Write your notice message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                multiline
                rows={6}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />

              <TextField
                select
                fullWidth
                label="Send To"
                value={tenantType}
                onChange={(e) => setTenantType(e.target.value)}
                size="small"
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              >
                {TENANT_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#374151' }}>
                Send Via
              </Typography>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      icon={<Box sx={{ width: 22, height: 22, borderRadius: 1, border: '2px solid #9CA3AF' }} />}
                      checkedIcon={<Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: '#1a1a4e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Email sx={{ fontSize: 14 }} /></Box>}
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>Email</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sendWhatsApp}
                      onChange={(e) => setSendWhatsApp(e.target.checked)}
                      icon={<Box sx={{ width: 22, height: 22, borderRadius: 1, border: '2px solid #9CA3AF' }} />}
                      checkedIcon={<Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: '#1a1a4e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><WhatsApp sx={{ fontSize: 14 }} /></Box>}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>WhatsApp</Typography>
                      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>1 credit per tenant</Typography>
                    </Box>
                  }
                />
              </Box>

              {sendWhatsApp && (
                <Card sx={{ mb: 2, borderRadius: 3, bgcolor: '#E0E7FF', border: '1px solid #C7D2FE' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <AccountBalanceWallet sx={{ color: '#1a1a4e', mt: 0.2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: '#1E1B4B' }}>
                          Estimated usage: <strong>{estimatedCount} credit{estimatedCount === 1 ? '' : 's'}</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#4338CA', mt: 0.5 }}>
                          Wallet balance: <strong style={{ color: enoughCredits ? '#16A34A' : '#DC2626' }}>{walletBalance} credit{walletBalance === 1 ? '' : 's'}</strong>
                        </Typography>
                        {!enoughCredits && estimatedCount > 0 && (
                          <Typography variant="caption" sx={{ color: '#DC2626', display: 'block', mt: 1 }}>
                            Not enough credits. Please add credits from Credit History.
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, bgcolor: '#F3F4F6', borderRadius: 3 }}>
                <Info sx={{ color: '#6B7280', fontSize: 18, mt: 0.2 }} />
                <Typography variant="caption" sx={{ color: '#6B7280', lineHeight: 1.6 }}>
                  This notice will be sent to {recipientLabel} tenants {sendChannel}.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, bgcolor: '#DC2626', color: 'white', mb: 2, boxShadow: '0 4px 20px rgba(220,38,38,0.2)' }}>
            <CardContent sx={{ py: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {sendWhatsApp ? <WhatsApp sx={{ fontSize: 32 }} /> : <Email sx={{ fontSize: 32 }} />}
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Create Notice</Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                {sendWhatsApp
                  ? 'WhatsApp messages will be sent to tenants with a valid phone number.'
                  : 'Emails will be sent to tenants with a valid email address matching the selected filter.'}
              </Typography>
              <Chip
                label={loadingCount ? 'Counting...' : `${estimatedCount} tenant${estimatedCount === 1 ? '' : 's'} selected`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
              />
            </CardContent>
          </Card>

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={sending ? null : <Send />}
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim() || (!sendEmail && !sendWhatsApp) || (sendWhatsApp && !enoughCredits && estimatedCount > 0)}
            sx={{
              borderRadius: 999,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #DC2626, #7F1D1D)',
              boxShadow: '0 8px 24px rgba(220,38,38,0.3)',
            }}
          >
            {sending ? 'Sending...' : 'Send Notice'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SendNotice;
