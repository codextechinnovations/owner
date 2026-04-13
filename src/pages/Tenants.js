import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Avatar,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Visibility,
  Phone,
  Email,
  LocationOn,
  Person,
  CalendarToday,
  Payment,
  Work,
  Badge,
  ContactEmergency,
  DocumentScanner,
  History,
  Close,
  Save,
  CheckCircle,
  Warning,
  Receipt,
} from '@mui/icons-material';
import { tenantService } from '../services/services';
import { roomService } from '../services/services';
import { paymentService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const initialFormData = {
  name: '',
  phone: '',
  email: '',
  altPhone: '',
  aadhaar: '',
  occupation: '',
  address: '',
  roomId: '',
  bedNumber: '',
  monthlyRent: '',
  securityDeposit: '',
  joiningDate: new Date().toISOString().split('T')[0],
  emergencyContact: '',
  emergencyPhone: '',
  status: 'active',
};

const initialPaymentData = {
  recordPayment: false,
  amount: '',
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMonth: new Date().toISOString().slice(0, 7),
  paymentMethod: 'UPI',
  notes: '',
};

const Tenants = () => {
  const { selectedPg } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [paymentData, setPaymentData] = useState(initialPaymentData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchTenants();
    fetchRooms();
  }, [selectedPg]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const response = await tenantService.getAll({ pgId: selectedPg?._id });
      if (Array.isArray(response)) {
        setTenants(response);
      } else if (response?.data && Array.isArray(response.data)) {
        setTenants(response.data);
      } else {
        setTenants([]);
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await roomService.getAll({ pgId: selectedPg?._id });
      if (Array.isArray(response)) {
        setRooms(response);
      } else if (response?.rooms && Array.isArray(response.rooms)) {
        setRooms(response.rooms);
      } else {
        setRooms([]);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setRooms([]);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetail = (tenant) => {
    setSelectedTenant(tenant);
    setDetailOpen(true);
  };

  const handleAddOpen = () => {
    setFormData(initialFormData);
    setPaymentData(initialPaymentData);
    setFormError('');
    setFormSuccess('');
    setAddOpen(true);
  };

  const handleEditOpen = (tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name || '',
      phone: tenant.phone || '',
      email: tenant.email || '',
      altPhone: tenant.altPhone || '',
      aadhaar: tenant.aadhaar || '',
      occupation: tenant.occupation || '',
      address: tenant.address || '',
      roomId: tenant.roomId || '',
      bedNumber: tenant.bedNumber || '',
      monthlyRent: tenant.monthlyRent || '',
      securityDeposit: tenant.securityDeposit || '',
      joiningDate: tenant.joiningDate || new Date().toISOString().split('T')[0],
      emergencyContact: tenant.emergencyContact || '',
      emergencyPhone: tenant.emergencyPhone || '',
      status: tenant.status || 'active',
    });
    setFormError('');
    setFormSuccess('');
    setEditOpen(true);
  };

  const handleDeleteOpen = (tenant) => {
    setSelectedTenant(tenant);
    setDeleteOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePaymentFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    setPaymentData({ 
      ...paymentData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = async (type) => {
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      if (type === 'add') {
        const newTenant = await tenantService.create({ ...formData, pgId: selectedPg?._id });
        const tenantId = newTenant?._id || newTenant;
        
        if (paymentData.recordPayment && paymentData.amount) {
          const [year, month] = paymentData.paymentMonth.split('-');
          await paymentService.create({
            tenantId: tenantId,
            amount: parseFloat(paymentData.amount),
            month: parseInt(month),
            year: parseInt(year),
            mode: paymentData.paymentMethod,
            paymentDate: paymentData.paymentDate,
            note: paymentData.notes || 'Initial payment on tenant registration',
            pgId: selectedPg?._id,
          });
          setFormSuccess('Tenant added and payment recorded successfully!');
        } else {
          setFormSuccess('Tenant added successfully!');
        }
        setTimeout(() => {
          setAddOpen(false);
          setPaymentData(initialPaymentData);
          fetchTenants();
        }, 1500);
      } else if (type === 'edit') {
        await tenantService.update(selectedTenant._id, formData);
        setFormSuccess('Tenant updated successfully!');
        setTimeout(() => {
          setEditOpen(false);
          fetchTenants();
        }, 1500);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await tenantService.delete(selectedTenant._id);
      setDeleteOpen(false);
      fetchTenants();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to delete tenant.');
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return { bg: `${colors.success}15`, color: colors.success };
      case 'inactive':
        return { bg: `${colors.error}15`, color: colors.error };
      case 'pending':
        return { bg: `${colors.warning}15`, color: colors.warning };
      default:
        return { bg: colors.border.main, color: colors.text.secondary };
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.phone?.includes(search) ||
      t.roomNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
            Tenants
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            {tenants.length} total
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddOpen}
          sx={{
            background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})`,
          }}
        >
          Add
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5 }}>
          <TextField
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: colors.text.secondary }} />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.border.main }}>
                <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rent</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Stay</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                      No tenants found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((tenant) => (
                    <TableRow key={tenant._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: colors.primary[700], width: 40, height: 40 }}>
                            {tenant.name?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {tenant.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                              ID: {tenant._id?.slice(-8).toUpperCase()}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Room {tenant.roomNumber || 'N/A'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                          Bed {tenant.bedNumber || 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Phone sx={{ fontSize: 14, color: colors.text.secondary }} />
                            <Typography variant="caption">{tenant.phone}</Typography>
                          </Box>
                          {tenant.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Email sx={{ fontSize: 14, color: colors.text.secondary }} />
                              <Typography variant="caption">{tenant.email}</Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.primary[700] }}>
                          {formatCurrency(tenant.monthlyRent || tenant.rent)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                          /month
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={(tenant.stayType || 'monthly').toLowerCase() === 'daily' ? 'Daily' : 'Monthly'}
                          size="small"
                          sx={{
                            bgcolor: (tenant.stayType || 'monthly').toLowerCase() === 'daily' ? `${colors.warning}15` : `${colors.primary[700]}15`,
                            color: (tenant.stayType || 'monthly').toLowerCase() === 'daily' ? colors.warning : colors.primary[700],
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tenant.status || 'active'}
                          size="small"
                          sx={{
                            ...getStatusColor(tenant.status),
                            fontWeight: 500,
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleViewDetail(tenant)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleEditOpen(tenant)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: colors.error }} onClick={() => handleDeleteOpen(tenant)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredTenants.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Tenant Details</Typography>
          <IconButton onClick={() => setDetailOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTenant && (
            <Grid container spacing={3}>
              {/* Basic Info */}
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Avatar sx={{ bgcolor: colors.primary[700], width: 100, height: 100, fontSize: '2.5rem', mx: 'auto', mb: 2 }}>
                    {selectedTenant.name?.charAt(0)}
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{selectedTenant.name}</Typography>
                  <Chip
                    label={selectedTenant.status || 'active'}
                    sx={{ ...getStatusColor(selectedTenant.status), fontWeight: 500, textTransform: 'capitalize' }}
                  />
                  <Typography variant="body2" sx={{ color: colors.text.secondary, mt: 2 }}>
                    ID: {selectedTenant._id?.slice(-8).toUpperCase()}
                  </Typography>
                </Box>
              </Grid>

              {/* Contact Info */}
              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.primary[700] }}>Contact Information</Typography>
                <List dense>
                  <ListItem><ListItemIcon><Phone color="primary" /></ListItemIcon><ListItemText primary="Phone" secondary={selectedTenant.phone} /></ListItem>
                  {selectedTenant.altPhone && <ListItem><ListItemIcon><Phone color="action" /></ListItemIcon><ListItemText primary="Alt. Phone" secondary={selectedTenant.altPhone} /></ListItem>}
                  <ListItem><ListItemIcon><Email color="primary" /></ListItemIcon><ListItemText primary="Email" secondary={selectedTenant.email || 'N/A'} /></ListItem>
                  <ListItem><ListItemIcon><LocationOn color="primary" /></ListItemIcon><ListItemText primary="Address" secondary={selectedTenant.address || 'N/A'} /></ListItem>
                </List>
              </Grid>

              {/* Accommodation Info */}
              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.primary[700] }}>Accommodation</Typography>
                <List dense>
                  <ListItem><ListItemIcon><Badge color="primary" /></ListItemIcon><ListItemText primary="Room" secondary={`Room ${selectedTenant.roomNumber || 'N/A'}`} /></ListItem>
                  <ListItem><ListItemIcon><Person color="primary" /></ListItemIcon><ListItemText primary="Bed Number" secondary={`Bed ${selectedTenant.bedNumber || 1}`} /></ListItem>
                  <ListItem><ListItemIcon><Payment color="primary" /></ListItemIcon><ListItemText primary="Monthly Rent" secondary={formatCurrency(selectedTenant.monthlyRent || selectedTenant.rent)} /></ListItem>
                  <ListItem><ListItemIcon><Receipt color="primary" /></ListItemIcon><ListItemText primary="Stay Type" secondary={(selectedTenant.stayType || 'monthly').toLowerCase() === 'daily' ? 'Daily' : 'Monthly'} /></ListItem>
                  <ListItem><ListItemIcon><Payment color="action" /></ListItemIcon><ListItemText primary="Security Deposit" secondary={formatCurrency(selectedTenant.securityDeposit)} /></ListItem>
                  <ListItem><ListItemIcon><CalendarToday color="primary" /></ListItemIcon><ListItemText primary="Join Date" secondary={formatDate(selectedTenant.joiningDate)} /></ListItem>
                </List>
              </Grid>

              {/* Additional Info */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.primary[700] }}>Additional Details</Typography>
                <List dense>
                  <ListItem><ListItemIcon><DocumentScanner color="primary" /></ListItemIcon><ListItemText primary="Aadhaar" secondary={selectedTenant.aadhaar || 'N/A'} /></ListItem>
                  <ListItem><ListItemIcon><Work color="primary" /></ListItemIcon><ListItemText primary="Occupation" secondary={selectedTenant.occupation || 'N/A'} /></ListItem>
                </List>
              </Grid>

              {/* ContactEmergency Contact */}
              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.error }}>Emergencyi Contact</Typography>
                <List dense>
                  <ListItem><ListItemIcon><ContactEmergency color="error" /></ListItemIcon><ListItemText primary="Name" secondary={selectedTenant.emergencyContact || 'N/A'} /></ListItem>
                  <ListItem><ListItemIcon><Phone color="error" /></ListItemIcon><ListItemText primary="Phone" secondary={selectedTenant.emergencyPhone || 'N/A'} /></ListItem>
                </List>
              </Grid>

              {/* Payment History */}
              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.success }}>Payment Status</Typography>
                <Paper sx={{ p: 2, bgcolor: `${colors.success}10` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CheckCircle sx={{ color: colors.success }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>All payments up to date</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                    Last payment: March 2026
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Edit />} onClick={() => { setDetailOpen(false); handleEditOpen(selectedTenant); }}>
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen || editOpen} onClose={() => { setAddOpen(false); setEditOpen(false); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{addOpen ? 'Add New Tenant' : 'Edit Tenant'}</Typography>
          <IconButton onClick={() => { setAddOpen(false); setEditOpen(false); }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}
          
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Full Name" name="name" value={formData.name} onChange={handleFormChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Phone Number" name="phone" value={formData.phone} onChange={handleFormChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleFormChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Alternate Phone" name="altPhone" value={formData.altPhone} onChange={handleFormChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Aadhaar Number" name="aadhaar" value={formData.aadhaar} onChange={handleFormChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Occupation" name="occupation" value={formData.occupation} onChange={handleFormChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleFormChange} />
            </Grid>
            
            <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption" color="text.secondary">ACCOMMODATION DETAILS</Typography></Divider></Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Room</InputLabel>
                <Select name="roomId" value={formData.roomId} onChange={handleFormChange} label="Room">
                  <MenuItem value="">Select Room</MenuItem>
                  {rooms.map(room => (
                    <MenuItem key={room._id} value={room._id}>
                      Room {room.roomNumber} ({room.type}) - {room.capacity - (room.occupied_beds || 0)} beds available
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Bed Number" name="bedNumber" type="number" value={formData.bedNumber} onChange={handleFormChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Monthly Rent (₹)" name="monthlyRent" type="number" value={formData.monthlyRent} onChange={handleFormChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Security Deposit (₹)" name="securityDeposit" type="number" value={formData.securityDeposit} onChange={handleFormChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Joining Date" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleFormChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select name="status" value={formData.status} onChange={handleFormChange} label="Status">
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>

<Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption" color="text.secondary">EMERGENCY CONTACT</Typography></Divider></Grid>
            
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Emergency Contact Name" name="emergencyContact" value={formData.emergencyContact} onChange={handleFormChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Emergency Contact Phone" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleFormChange} />
            </Grid>

            {addOpen && (
              <>
                <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption" color="text.secondary">INITIAL PAYMENT</Typography></Divider></Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="checkbox"
                      id="recordPayment"
                      name="recordPayment"
                      checked={paymentData.recordPayment}
                      onChange={handlePaymentFormChange}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <Typography variant="body2" component="label" htmlFor="recordPayment" sx={{ cursor: 'pointer' }}>
                      Record initial payment with tenant registration
                    </Typography>
                  </Box>
                </Grid>

                {paymentData.recordPayment && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Payment Amount (₹)" name="amount" type="number" value={paymentData.amount} onChange={handlePaymentFormChange} required={paymentData.recordPayment} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Payment Date" name="paymentDate" type="date" value={paymentData.paymentDate} onChange={handlePaymentFormChange} InputLabelProps={{ shrink: true }} required={paymentData.recordPayment} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Payment Month" name="paymentMonth" type="month" value={paymentData.paymentMonth} onChange={handlePaymentFormChange} InputLabelProps={{ shrink: true }} required={paymentData.recordPayment} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Payment Method</InputLabel>
                        <Select name="paymentMethod" value={paymentData.paymentMethod} onChange={handlePaymentFormChange} label="Payment Method">
                          <MenuItem value="Cash">Cash</MenuItem>
                          <MenuItem value="UPI">UPI</MenuItem>
                          <MenuItem value="GPay">GPay</MenuItem>
                          <MenuItem value="PhonePe">PhonePe</MenuItem>
                          <MenuItem value="Paytm">Paytm</MenuItem>
                          <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                          <MenuItem value="NEFT">NEFT</MenuItem>
                          <MenuItem value="IMPS">IMPS</MenuItem>
                          <MenuItem value="Card">Card</MenuItem>
                          <MenuItem value="Cheque">Cheque</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Notes" name="notes" value={paymentData.notes} onChange={handlePaymentFormChange} placeholder="e.g., First month rent + security deposit" />
                    </Grid>
                  </>
                )}
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setAddOpen(false); setEditOpen(false); }}>Cancel</Button>
          <Button variant="contained" startIcon={formLoading ? <CircularProgress size={20} /> : <Save />} onClick={() => handleSubmit(addOpen ? 'add' : 'edit')} disabled={formLoading}>
            {addOpen ? 'Add Tenant' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning sx={{ color: colors.error }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Delete Tenant</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete <strong>{selectedTenant?.name}</strong>?
          </Typography>
          <Alert severity="warning">This action cannot be undone. All tenant data will be permanently removed.</Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={formLoading ? <CircularProgress size={20} /> : <Delete />} onClick={handleDelete} disabled={formLoading}>
            Delete Tenant
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tenants;
