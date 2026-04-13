import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const Profile = () => {
  const { user, selectedPg } = useAuth();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Profile updated successfully!');
      setEditMode(false);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
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
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: colors.primary[700],
                  fontSize: '2.5rem',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {formData.name?.charAt(0) || 'U'}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                {formData.name || 'User'}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2 }}>
                {user?.role || 'PG Owner'}
              </Typography>
              <Chip
                label="Active"
                size="small"
                sx={{
                  bgcolor: `${colors.success}15`,
                  color: colors.success,
                  fontWeight: 500,
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
                <ListItem>
                  <ListItemIcon><Person color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="User ID" 
                    secondary={user?._id?.slice(-8).toUpperCase() || 'N/A'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CalendarToday color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Member Since" 
                    secondary={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Business color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="PGs Owned" 
                    secondary={selectedPg ? '1' : '0'} 
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
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Current PG
              </Typography>
              {selectedPg ? (
                <Box sx={{ p: 2, bgcolor: `${colors.primary[700]}10`, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: colors.primary[700], width: 50, height: 50 }}>
                      <Business sx={{ fontSize: 25 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedPg.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                        {selectedPg.address || 'No address specified'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Alert severity="info">No PG selected. Go to Dashboard to select a PG.</Alert>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Security
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><Lock color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Change Password" 
                    secondary="Update your password regularly for security"
                  />
                  <Button size="small" variant="outlined">
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
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Notifications
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><Notifications color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Email Notifications" 
                    secondary="Receive updates about payments and tenants"
                  />
                  <Switch defaultChecked />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Phone color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="SMS Notifications" 
                    secondary="Get SMS alerts for important updates"
                  />
                  <Switch defaultChecked />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
