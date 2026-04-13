import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Notifications,
  Security,
  Language,
  Palette,
  Payment,
  Backup,
  Delete,
  Info,
  ToggleOn,
  ToggleOff,
  ColorLens,
  PaymentSharp,
  Business,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const Settings = () => {
  const { selectedPg } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,
    paymentReminders: true,
    tenantAlerts: true,
    darkMode: false,
    compactMode: false,
    rtlMode: false,
    autoBackup: true,
    maintenance: false,
  });
  const [currency, setCurrency] = useState('INR');
  const [language, setLanguage] = useState('en');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [pgSettingsOpen, setPgSettingsOpen] = useState(false);
  const [pgSettings, setPgSettings] = useState({
    name: selectedPg?.name || '',
    address: selectedPg?.address || '',
    phone: selectedPg?.phone || '',
    email: selectedPg?.email || '',
  });
  const [success, setSuccess] = useState('');

  const handleToggle = (setting) => {
    setSettings({ ...settings, [setting]: !settings[setting] });
  };

  const handleSavePgSettings = () => {
    setSuccess('PG settings updated successfully!');
    setPgSettingsOpen(false);
  };

  const handleExportData = () => {
    const data = {
      pg: selectedPg,
      settings,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `manageyourpg_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccess('Data exported successfully!');
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
          Settings
        </Typography>
        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
          Configure your application preferences
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Business sx={{ color: colors.primary[700] }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  PG Information
                </Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="PG Name" 
                    secondary={selectedPg?.name || 'Not set'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Address" 
                    secondary={selectedPg?.address || 'Not set'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Contact" 
                    secondary={selectedPg?.phone || 'Not set'} 
                  />
                </ListItem>
              </List>
              <Button 
                variant="outlined" 
                size="small" 
                sx={{ mt: 1 }}
                onClick={() => setPgSettingsOpen(true)}
              >
                Edit PG Details
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Notifications sx={{ color: colors.primary[700] }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Notifications
                </Typography>
              </Box>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Email Notifications" 
                    secondary="Receive updates via email"
                  />
                  <ListItemSecondaryAction>
                    <Switch 
                      checked={settings.emailNotifications}
                      onChange={() => handleToggle('emailNotifications')}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="SMS Notifications" 
                    secondary="Get text messages for alerts"
                  />
                  <ListItemSecondaryAction>
                    <Switch 
                      checked={settings.smsNotifications}
                      onChange={() => handleToggle('smsNotifications')}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Push Notifications" 
                    secondary="Browser push notifications"
                  />
                  <ListItemSecondaryAction>
                    <Switch 
                      checked={settings.pushNotifications}
                      onChange={() => handleToggle('pushNotifications')}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider sx={{ my: 1 }} />
                <ListItem>
                  <ListItemText 
                    primary="Payment Reminders" 
                    secondary="Remind tenants about rent"
                  />
                  <ListItemSecondaryAction>
                    <Switch 
                      checked={settings.paymentReminders}
                      onChange={() => handleToggle('paymentReminders')}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Tenant Alerts" 
                    secondary="Alerts for new tenants, complaints"
                  />
                  <ListItemSecondaryAction>
                    <Switch 
                      checked={settings.tenantAlerts}
                      onChange={() => handleToggle('tenantAlerts')}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Palette sx={{ color: colors.primary[700] }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Appearance
                </Typography>
              </Box>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Dark Mode" 
                    secondary="Use dark theme"
                  />
                  <ListItemSecondaryAction>
                    <Switch 
                      checked={settings.darkMode}
                      onChange={() => handleToggle('darkMode')}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Compact Mode" 
                    secondary="Reduce spacing in UI"
                  />
                  <ListItemSecondaryAction>
                    <Switch 
                      checked={settings.compactMode}
                      onChange={() => handleToggle('compactMode')}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Language sx={{ color: colors.primary[700] }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Regional Settings
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      label="Currency"
                    >
                      <MenuItem value="INR">Indian Rupee (INR)</MenuItem>
                      <MenuItem value="USD">US Dollar (USD)</MenuItem>
                      <MenuItem value="EUR">Euro (EUR)</MenuItem>
                      <MenuItem value="GBP">British Pound (GBP)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      label="Language"
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="hi">Hindi</MenuItem>
                      <MenuItem value="kn">Kannada</MenuItem>
                      <MenuItem value="ta">Tamil</MenuItem>
                      <MenuItem value="te">Telugu</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Date Format</InputLabel>
                    <Select
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      label="Date Format"
                    >
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Time Zone</InputLabel>
                    <Select
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value)}
                      label="Time Zone"
                    >
                      <MenuItem value="Asia/Kolkata">IST (UTC+5:30)</MenuItem>
                      <MenuItem value="Asia/Dubai">GST (UTC+4)</MenuItem>
                      <MenuItem value="Asia/Singapore">SGT (UTC+8)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Payment sx={{ color: colors.primary[700] }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Payment Settings
                </Typography>
              </Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Configure your payment gateway settings to accept online payments from tenants.
              </Alert>
              <Button variant="outlined" fullWidth>
                Configure Payment Gateway
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Backup sx={{ color: colors.primary[700] }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Data Management
                </Typography>
              </Box>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Auto Backup" 
                    secondary="Automatically backup data daily"
                  />
                  <ListItemSecondaryAction>
                    <Switch 
                      checked={settings.autoBackup}
                      onChange={() => handleToggle('autoBackup')}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<Backup />}
                  onClick={handleExportData}
                >
                  Export Data
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<Backup />}
                >
                  Import Data
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Security sx={{ color: colors.primary[700] }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Maintenance Mode
                </Typography>
              </Box>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Enable Maintenance Mode" 
                    secondary="Show maintenance page to tenants"
                  />
                  <ListItemSecondaryAction>
                    <Switch 
                      checked={settings.maintenance}
                      onChange={() => handleToggle('maintenance')}
                      color="error"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3, bgcolor: `${colors.error}10` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Delete sx={{ color: colors.error }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: colors.error }}>
                  Danger Zone
                </Typography>
              </Box>
              <Alert severity="error" sx={{ mb: 2 }}>
                These actions are irreversible. Please proceed with caution.
              </Alert>
              <Button variant="outlined" color="error" size="small">
                Delete All Data
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Info sx={{ color: colors.primary[700] }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  About ManageYourPG
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: colors.primary[700] }}>
                      v1.0.0
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                      Version
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip label="Stable" color="success" size="small" />
                    <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block', mt: 0.5 }}>
                      Build Status
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: colors.primary[700] }}>
                      {new Date().getFullYear()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                      Copyright
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Button size="small" variant="text">
                      Check for Updates
                    </Button>
                    <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block' }}>
                      Last checked: Never
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={pgSettingsOpen} onClose={() => setPgSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit PG Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="PG Name"
                value={pgSettings.name}
                onChange={(e) => setPgSettings({ ...pgSettings, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={pgSettings.address}
                onChange={(e) => setPgSettings({ ...pgSettings, address: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phone"
                value={pgSettings.phone}
                onChange={(e) => setPgSettings({ ...pgSettings, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Email"
                value={pgSettings.email}
                onChange={(e) => setPgSettings({ ...pgSettings, email: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPgSettingsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePgSettings}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
