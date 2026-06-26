import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Avatar,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import { AccountBalance, Add, Edit, Delete, QrCode, Close } from '@mui/icons-material';
import { bankAccountService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const initialForm = {
  pgName: '',
  bankName: '',
  bankBranch: '',
  ifscCode: '',
  accountNumber: '',
  upiId: '',
  qrCode: '',
};

const BankAccounts = () => {
  const { selectedPg } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const fileInputRef = useRef(null);

  const fetchAccounts = async () => {
    if (!selectedPg?._id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await bankAccountService.getAll(selectedPg._id);
      const raw = response.data?.data ?? response.data ?? response ?? [];
      const data = Array.isArray(raw) ? raw : raw ? [raw] : [];
      setAccounts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bank accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [selectedPg]);

  const handleOpen = (account = null) => {
    setEditing(account);
    setFormData(
      account
        ? {
            pgName: account.pgName || '',
            bankName: account.bankName || '',
            bankBranch: account.bankBranch || '',
            ifscCode: account.ifscCode || '',
            accountNumber: account.accountNumber || '',
            upiId: account.upiId || '',
            qrCode: account.qrCode || '',
          }
        : { ...initialForm, pgName: selectedPg?.name || '' }
    );
    setOpen(true);
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setFormData(initialForm);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('QR image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, qrCode: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.pgName.trim()) {
      setError('PG/Beneficiary name is required');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = { ...formData, pgId: selectedPg._id };
      if (editing) {
        await bankAccountService.update(editing._id, payload);
      } else {
        await bankAccountService.create(payload);
      }
      setSuccess(editing ? 'Account updated' : 'Account added');
      handleClose();
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save account');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      await bankAccountService.delete(deleteId);
      setSuccess('Account deleted');
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
            Bank Accounts & UPI
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage payment details shared with tenants
          </Typography>
        </Box>
        {accounts.length === 0 && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            Add Account
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {loading ? (
        <Card>
          <CardContent>
            <Skeleton height={60} />
            <Skeleton height={120} />
          </CardContent>
        </Card>
      ) : accounts.length === 0 ? (
        <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(26,26,78,0.06)' }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Box sx={{ width: 90, height: 90, borderRadius: '50%', bgcolor: '#F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <AccountBalance sx={{ fontSize: 40, color: colors.primary[700] }} />
            </Box>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 700, color: '#111827' }}>No payment details added</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 360, mx: 'auto' }}>
              Add your bank account or UPI ID so tenants can pay rent directly. A QR code can also be uploaded for quick UPI payments.
            </Typography>
            <Button variant="contained" size="large" startIcon={<Add />} onClick={() => handleOpen()} sx={{ borderRadius: 3, px: 4 }}>
              Add Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {accounts.map((acc) => (
            <Grid item xs={12} key={acc._id}>
              <Card sx={{ overflow: 'hidden', boxShadow: '0 8px 32px rgba(26,26,78,0.08)', borderRadius: 4 }}>
                {/* Header */}
                <Box sx={{ background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[900]})`, color: 'white', p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }}>
                        <AccountBalance sx={{ fontSize: 28 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 1 }}>
                          Beneficiary
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                          {acc.pgName}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        onClick={() => handleOpen(acc)}
                        sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => confirmDelete(acc._id)}
                        sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>

                {/* Body */}
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    {/* Bank Details */}
                    <Grid item xs={12} md={acc.qrCode ? 7 : 12}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: colors.text.primary, mb: 2 }}>
                        Account Details
                      </Typography>

                      {acc.bankName && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, bgcolor: '#F8FAFC', borderRadius: 3 }}>
                          <Avatar sx={{ bgcolor: '#E0E7FF', color: '#1a1a4e', width: 40, height: 40 }}>
                            <AccountBalance fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Bank Name
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#111827' }}>
                              {acc.bankName} {acc.bankBranch && <span style={{ color: '#6B7280', fontWeight: 500 }}>— {acc.bankBranch}</span>}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {acc.ifscCode && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, bgcolor: '#F8FAFC', borderRadius: 3 }}>
                          <Avatar sx={{ bgcolor: '#FEF3C7', color: '#D97706', width: 40, height: 40 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: 12 }}>IFSC</Typography>
                          </Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              IFSC Code
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#111827', letterSpacing: 0.5 }}>
                              {acc.ifscCode}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {acc.accountNumber && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, bgcolor: '#F8FAFC', borderRadius: 3 }}>
                          <Avatar sx={{ bgcolor: '#F0FDF4', color: '#059669', width: 40, height: 40 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: 12 }}>A/C</Typography>
                          </Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Account Number
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#111827', letterSpacing: 0.5 }}>
                              {acc.accountNumber}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {acc.upiId && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, bgcolor: '#F8FAFC', borderRadius: 3 }}>
                          <Avatar sx={{ bgcolor: '#F3E8FF', color: '#9333EA', width: 40, height: 40 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: 12 }}>UPI</Typography>
                          </Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              UPI ID
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#111827' }}>
                              {acc.upiId}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Grid>

                    {/* QR Code */}
                    {acc.qrCode && (
                      <Grid item xs={12} md={5}>
                        <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 4, p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, mb: 2 }}>
                            Scan to Pay
                          </Typography>
                          <Box
                            component="img"
                            src={acc.qrCode}
                            alt="QR Code"
                            sx={{ width: '100%', maxWidth: 220, maxHeight: 220, borderRadius: 3, border: '1px solid #E5E7EB', mx: 'auto' }}
                          />
                          <Typography variant="caption" sx={{ color: '#9CA3AF', mt: 2 }}>
                            Use any UPI app to scan
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Account' : 'Add Account'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="PG / Beneficiary Name" name="pgName" value={formData.pgName} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Branch" name="bankBranch" value={formData.bankBranch} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="UPI ID" name="upiId" value={formData.upiId} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label" startIcon={<QrCode />} fullWidth>
                Upload QR Code
                <input type="file" accept="image/*" hidden onChange={handleFileChange} ref={fileInputRef} />
              </Button>
              {formData.qrCode && (
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <Box
                    component="img"
                    src={formData.qrCode}
                    alt="QR Preview"
                    sx={{ maxWidth: 120, maxHeight: 120, borderRadius: 2 }}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} startIcon={<Close />}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Account?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">This will permanently remove the account/UPI details.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BankAccounts;
