import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Button,
  TextField,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Edit,
  Save,
  Security,
  Notifications,
  Business,
  CalendarToday,
  Lock,
  CameraAlt,
  Apartment,
  VerifiedUser,
  Shield,
  Badge,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { resolveLogoUrl } from '../utils/logoHelper';
import api from '../services/api';

const Profile = () => {
  const { user, selectedPg, setUser, selectPg } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    altPhone: user?.altPhone || '',
    address: user?.address || '',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [pgEditOpen, setPgEditOpen] = useState(false);
  const [pgFormData, setPgFormData] = useState({
    name: selectedPg?.name || '',
    address: selectedPg?.address || '',
  });
  const [savingPg, setSavingPg] = useState(false);

  useEffect(() => {
    const fetchPgDetails = async () => {
      if (!selectedPg?._id) return;
      try {
        const res = await api.get(`/pg-owner/pgs/${selectedPg._id}`);
        const pgData = res?.data?.data || res?.data;
        if (pgData) {
          const updatedPg = { ...selectedPg, ...pgData };
          selectPg(updatedPg);
          const storedPgs = JSON.parse(localStorage.getItem('pgs') || '[]');
          const updatedPgs = storedPgs.map((p) => (p._id === updatedPg._id ? { ...p, ...pgData } : p));
          localStorage.setItem('pgs', JSON.stringify(updatedPgs));
        }
      } catch (err) {
        console.error('Failed to fetch PG details:', err);
      }
    };
    fetchPgDetails();
  }, [selectedPg?._id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!user?._id) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.put(`/pg-owner/${user._id}`, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        altPhone: formData.altPhone.trim(),
        address: formData.address.trim(),
      });
      const updated = res?.data?.data || { ...user, ...formData };
      setUser(updated);
      localStorage.setItem('owner', JSON.stringify(updated));
      setSuccess('Profile updated successfully!');
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      altPhone: user?.altPhone || '',
      address: user?.address || '',
    });
    setEditMode(false);
    setError('');
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPg?._id) return;

    setUploadingLogo(true);
    setError('');
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        try {
          const res = await api.put(`/pg-owner/pgs/${selectedPg._id}`, { logo: base64 });
          const updatedPg = { ...selectedPg, ...(res?.data?.data || {}), logo: base64 };
          selectPg(updatedPg);
          const storedPgs = JSON.parse(localStorage.getItem('pgs') || '[]');
          const updatedPgs = storedPgs.map((p) => (p._id === updatedPg._id ? { ...p, ...updatedPg } : p));
          localStorage.setItem('pgs', JSON.stringify(updatedPgs));
          setSuccess('PG logo updated successfully!');
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to upload logo');
        } finally {
          setUploadingLogo(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to read image');
      setUploadingLogo(false);
    }
  };

  const handlePgEditOpen = () => {
    setPgFormData({
      name: selectedPg?.name || '',
      address: selectedPg?.address || '',
    });
    setPgEditOpen(true);
    setError('');
    setSuccess('');
  };

  const handlePgSave = async () => {
    if (!selectedPg?._id) return;
    setSavingPg(true);
    setError('');
    try {
      const res = await api.put(`/pg/${selectedPg._id}`, {
        name: pgFormData.name.trim(),
        address: pgFormData.address.trim(),
      });
      const updatedPg = { ...selectedPg, ...(res?.data?.data || {}) };
      selectPg(updatedPg);
      const storedPgs = JSON.parse(localStorage.getItem('pgs') || '[]');
      const updatedPgs = storedPgs.map((p) => (p._id === updatedPg._id ? { ...p, ...updatedPg } : p));
      localStorage.setItem('pgs', JSON.stringify(updatedPgs));
      setSuccess('PG details updated successfully!');
      setPgEditOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update PG details');
    } finally {
      setSavingPg(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
            Profile
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Manage your account information
          </Typography>
        </Box>
        {!editMode ? (
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => setEditMode(true)}
            sx={{
              background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})`,
            }}
          >
            Edit Profile
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})`,
              }}
            >
              Save Changes
            </Button>
          </Box>
        )}
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 8px 32px rgba(26,26,78,0.08)' }}>
            <Box sx={{ height: 80, background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[900]})` }} />
            <CardContent sx={{ textAlign: 'center', pt: 0, pb: 4, px: 3 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'white',
                  color: colors.primary[700],
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  mx: 'auto',
                  mb: 2,
                  mt: '-50px',
                  border: '4px solid white',
                  boxShadow: '0 8px 24px rgba(26,26,78,0.15)',
                }}
              >
                {formData.name?.charAt(0) || 'U'}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: '#111827' }}>
                {formData.name || 'User'}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2 }}>
                {user?.role || 'PG Owner'}
              </Typography>
              <Chip
                icon={<VerifiedUser sx={{ fontSize: 14, color: '#22c55e !important' }} />}
                label="Active Account"
                size="small"
                sx={{
                  bgcolor: '#F0FDF4',
                  color: '#059669',
                  fontWeight: 600,
                  border: '1px solid #BBF7D0',
                }}
              />
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Account Details
              </Typography>
              <List dense>
                <ListItem sx={{ mb: 1 }}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: '#E0E7FF', color: colors.primary[700], width: 36, height: 36 }}>
                      <Badge fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>User ID</Typography>}
                    secondary={<Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>{user?._id?.slice(-8).toUpperCase() || 'N/A'}</Typography>}
                  />
                </ListItem>
                <ListItem sx={{ mb: 1 }}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: '#F0FDF4', color: '#059669', width: 36, height: 36 }}>
                      <CalendarToday fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Member Since</Typography>}
                    secondary={<Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A'}</Typography>}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: '#F3E8FF', color: '#9333EA', width: 36, height: 36 }}>
                      <Business fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>PGs Owned</Typography>}
                    secondary={<Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>{selectedPg ? '1' : '0'}</Typography>}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Personal Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editMode}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!editMode}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Alternate Phone"
                    name="altPhone"
                    value={formData.altPhone}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!editMode}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Current PG
                </Typography>
                <Button size="small" variant="outlined" startIcon={<Edit />} onClick={handlePgEditOpen}>
                  Edit
                </Button>
              </Box>
              {selectedPg ? (
                <Card
                  elevation={0}
                  sx={{
                    background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[900]})`,
                    color: 'white',
                    borderRadius: 4,
                    overflow: 'visible',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          src={resolveLogoUrl(selectedPg.logo)}
                          sx={{
                            width: 80,
                            height: 80,
                            bgcolor: 'rgba(255,255,255,0.15)',
                            border: '3px solid rgba(255,255,255,0.3)',
                            fontSize: 28,
                            fontWeight: 800,
                          }}
                          imgProps={{
                            onError: (e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            },
                          }}
                        >
                          {(selectedPg.name || 'PG').slice(0, 2).toUpperCase()}
                        </Avatar>
                        <IconButton
                          component="label"
                          sx={{
                            position: 'absolute',
                            bottom: -6,
                            right: -6,
                            bgcolor: 'white',
                            color: colors.primary[700],
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            width: 32,
                            height: 32,
                            '&:hover': { bgcolor: '#f5f5f5' },
                          }}
                          disabled={uploadingLogo}
                        >
                          {uploadingLogo ? (
                            <CircularProgress size={16} sx={{ color: colors.primary[700] }} />
                          ) : (
                            <CameraAlt sx={{ fontSize: 16 }} />
                          )}
                          <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                        </IconButton>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            {selectedPg.name}
                          </Typography>
                          <VerifiedUser sx={{ fontSize: 20, color: '#22c55e' }} />
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.85, mb: 1 }}>
                          {selectedPg.address || 'No address specified'}
                        </Typography>
                        <Chip
                          icon={<Apartment sx={{ color: 'white !important' }} />}
                          label="Active PG"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.15)',
                            color: 'white',
                            fontWeight: 600,
                            '& .MuiChip-icon': { color: 'white' },
                          }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <Alert severity="info">No PG selected. Go to Dashboard to select a PG.</Alert>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Shield sx={{ color: colors.primary[700] }} />
                Security
              </Typography>
              <List>
                <ListItem sx={{ bgcolor: '#F8FAFC', borderRadius: 3, mb: 1 }}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: '#E0E7FF', color: colors.primary[700], width: 40, height: 40 }}>
                      <Lock fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827' }}>Change Password</Typography>}
                    secondary={<Typography variant="caption" sx={{ color: '#6B7280' }}>Update your password regularly for security</Typography>}
                  />
                  <Button size="small" variant="outlined" sx={{ borderRadius: 3 }}>
                    Change
                  </Button>
                </ListItem>
              </List>
              <Divider sx={{ my: 2 }} />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Enable two-factor authentication"
              />
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notifications sx={{ color: colors.primary[700] }} />
                Notifications
              </Typography>
              <List>
                <ListItem sx={{ bgcolor: '#F8FAFC', borderRadius: 3, mb: 1 }}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: '#F0FDF4', color: '#059669', width: 40, height: 40 }}>
                      <Email fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827' }}>Email Notifications</Typography>}
                    secondary={<Typography variant="caption" sx={{ color: '#6B7280' }}>Receive updates about payments and tenants</Typography>}
                  />
                  <Switch defaultChecked />
                </ListItem>
                <ListItem sx={{ bgcolor: '#F8FAFC', borderRadius: 3, mb: 1 }}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: '#FEF3C7', color: '#D97706', width: 40, height: 40 }}>
                      <Phone fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827' }}>SMS Notifications</Typography>}
                    secondary={<Typography variant="caption" sx={{ color: '#6B7280' }}>Get SMS alerts for important updates</Typography>}
                  />
                  <Switch defaultChecked />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={pgEditOpen} onClose={() => setPgEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit PG Details</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="PG Name"
            value={pgFormData.name}
            onChange={(e) => setPgFormData({ ...pgFormData, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Address"
            value={pgFormData.address}
            onChange={(e) => setPgFormData({ ...pgFormData, address: e.target.value })}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPgEditOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePgSave}
            disabled={savingPg}
            startIcon={savingPg ? <CircularProgress size={18} color="inherit" /> : <Save />}
            sx={{
              background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})`,
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
