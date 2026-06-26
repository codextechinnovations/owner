import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Alert,
  Divider,
  Paper,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
} from '@mui/material';
import {
  Badge as BadgeIcon,
  ContactEmergency,
  DocumentScanner,
  Close,
  Save,
  CheckCircle,
  Warning,
  Receipt,
  Logout,
  People,
  MailOutline,
  Add,
  Search,
  Download,
  Phone,
  Email,
  LocationOn,
  Person,
  Payment,
  CalendarToday,
  Work,
  Delete,
  Edit,
  Visibility,
} from '@mui/icons-material';
import { tenantService, roomService, paymentService, tenantRequestService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { normalizeTenant, denormalizeTenant } from '../utils/tenantHelpers';
import { exportToCsv } from '../utils/exportHelpers';

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
  photo: '',
  idProof: '',
};

const initialPaymentData = {
  recordPayment: false,
  amount: '',
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMonth: new Date().toISOString().slice(0, 7),
  paymentMethod: 'UPI',
  notes: '',
};

const FILTERS = ['All', 'Active', 'Vacated', 'Notice', 'Due'];
const STAY_TYPES = ['Stay Type', 'Daily Stay', 'Monthly Stay'];

const statusMap = {
  active: { label: 'Active', bg: '#DCFCE7', color: '#15803D' },
  inactive: { label: 'Inactive', bg: '#FEE2E2', color: '#991B1B' },
  pending: { label: 'Pending', bg: '#FEF3C7', color: '#92400E' },
  notice_period: { label: 'Notice', bg: '#FEF3C7', color: '#92400E' },
  notice: { label: 'Notice', bg: '#FEF3C7', color: '#92400E' },
  moved_out: { label: 'Vacated', bg: '#FEE2E2', color: '#991B1B' },
  left: { label: 'Vacated', bg: '#FEE2E2', color: '#991B1B' },
  vacated: { label: 'Vacated', bg: '#FEE2E2', color: '#991B1B' },
};

const Tenants = () => {
  const { selectedPg, user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Active');
  const [stayTypeFilter, setStayTypeFilter] = useState('Stay Type');
  const [requestCount, setRequestCount] = useState(0);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [vacateOpen, setVacateOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [paymentData, setPaymentData] = useState(initialPaymentData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchTenants();
    fetchRooms();
    fetchRequestCount();
  }, [selectedPg]);

  useEffect(() => {
    if ((addOpen || editOpen) && rooms.length === 0 && selectedPg?._id) {
      fetchRooms();
    }
  }, [addOpen, editOpen, rooms.length, selectedPg]);

  useEffect(() => {
    if (!editOpen || !selectedTenant?.roomNumber || formData.roomId || rooms.length === 0) return;
    const matchedRoom = rooms.find(
      (r) => String(r.roomNumber || r.room_number) === String(selectedTenant.roomNumber)
    );
    if (matchedRoom) {
      setFormData((prev) => ({ ...prev, roomId: matchedRoom._id || matchedRoom.id }));
    }
  }, [editOpen, rooms, selectedTenant, formData.roomId]);

  const fetchTenants = async () => {
    if (!selectedPg?._id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const month = String(new Date().getMonth() + 1);
      const year = String(new Date().getFullYear());
      const response = await tenantService.getAll({ pgId: selectedPg._id, month, year, limit: 1000 });
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response?.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      }
      setTenants(data.map(normalizeTenant));
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
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response?.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (response?.rooms && Array.isArray(response.rooms)) {
        data = response.rooms;
      }
      setRooms(data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setRooms([]);
    }
  };

  const fetchRequestCount = async () => {
    try {
      const ownerId = user?._id || user?.id;
      if (!ownerId) return;
      const res = await tenantRequestService.getOwnerRequests(ownerId);
      const list = Array.isArray(res) ? res : (res?.data || []);
      const pgRequests = selectedPg?._id
        ? list.filter((r) => String(r.pgId) === String(selectedPg._id))
        : list;
      setRequestCount(pgRequests.length);
    } catch (err) {
      setRequestCount(0);
    }
  };

  const handleViewDetail = async (tenant) => {
    setSelectedTenant(normalizeTenant(tenant));
    setDetailOpen(true);
    try {
      const id = tenant._id || tenant.id;
      if (!id) return;
      const res = await tenantService.getById(id);
      const responseData = res?.data?.data || res?.data || res;
      if (!responseData) return;
      const fullTenant = responseData.tenant || responseData;
      const room = responseData.room || fullTenant.room || null;
      if (fullTenant && (fullTenant._id || fullTenant.id)) {
        setSelectedTenant(normalizeTenant({ ...fullTenant, room }));
      }
    } catch (err) {
      console.error('Failed to fetch tenant details:', err);
    }
  };

  const handleAddOpen = () => {
    setFormData(initialFormData);
    setPaymentData(initialPaymentData);
    setFormError('');
    setFormSuccess('');
    setAddOpen(true);
  };

  const populateEditForm = (tenant) => {
    const normalized = normalizeTenant(tenant);
    let roomId = normalized.roomId || '';
    if (!roomId && normalized.roomNumber && rooms.length > 0) {
      const matchedRoom = rooms.find(
        (r) => String(r.roomNumber || r.room_number) === String(normalized.roomNumber)
      );
      if (matchedRoom) roomId = matchedRoom._id || matchedRoom.id;
    }
    let joiningDate = normalized.joiningDate || '';
    if (joiningDate) {
      let d = new Date(joiningDate);
      if (isNaN(d.getTime())) {
        const parts = joiningDate.split(/[-/]/);
        if (parts.length === 3) {
          const [p1, p2, p3] = parts.map(Number);
          if (p1 > 12 && p1 <= 31 && p2 <= 12) {
            d = new Date(p3, p2 - 1, p1);
          } else {
            d = new Date(p1, p2 - 1, p3);
          }
        }
      }
      if (!isNaN(d.getTime())) {
        joiningDate = d.toISOString().split('T')[0];
      }
    }

    setSelectedTenant(normalized);
    setFormData({
      name: normalized.name || '',
      phone: normalized.phone || '',
      email: normalized.email || '',
      altPhone: normalized.altPhone || '',
      aadhaar: normalized.aadhaar || '',
      occupation: normalized.occupation || '',
      address: normalized.address || '',
      roomId,
      bedNumber: normalized.bedNumber || '',
      monthlyRent: normalized.monthlyRent || '',
      securityDeposit: normalized.securityDeposit || '',
      joiningDate,
      emergencyContact: normalized.emergencyContact || '',
      emergencyPhone: normalized.emergencyPhone || '',
      status: normalized.status || 'active',
      photo: normalized.photo || '',
      idProof: normalized.idProof || '',
    });
  };

  const handleEditOpen = async (tenant) => {
    setFormError('');
    setFormSuccess('');
    setEditOpen(true);
    populateEditForm(tenant);
    try {
      const id = tenant._id || tenant.id;
      if (!id) return;
      const res = await tenantService.getById(id);
      const responseData = res?.data?.data || res?.data || res;
      if (!responseData) return;
      const fullTenant = responseData.tenant || responseData;
      const room = responseData.room || fullTenant.room || null;
      if (fullTenant && (fullTenant._id || fullTenant.id)) {
        populateEditForm({ ...fullTenant, room });
      }
    } catch (err) {
      console.error('Failed to fetch tenant details:', err);
    }
  };

  const handleDeleteOpen = (tenant) => {
    setSelectedTenant(normalizeTenant(tenant));
    setDeleteOpen(true);
  };

  const handleVacateOpen = (tenant) => {
    setSelectedTenant(normalizeTenant(tenant));
    setVacateOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, [field]: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handlePaymentFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    setPaymentData({
      ...paymentData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (type) => {
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      if (type === 'add') {
        const payload = denormalizeTenant({ ...formData, pgId: selectedPg?._id });
        const newTenant = await tenantService.create(payload);
        const tenantId = newTenant?._id || newTenant;

        if (paymentData.recordPayment && paymentData.amount) {
          const [year, month] = paymentData.paymentMonth.split('-');
          await paymentService.create({
            tenantId,
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
        const payload = denormalizeTenant({ ...formData, pgId: selectedPg?._id });
        await tenantService.update(selectedTenant._id, payload);
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
      fetchRequestCount();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to delete tenant.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleVacate = async () => {
    if (!selectedTenant?._id) return;
    setFormLoading(true);
    try {
      await tenantService.update(selectedTenant._id, { status: 'vacated' });
      setVacateOpen(false);
      fetchTenants();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to vacate tenant.');
    } finally {
      setFormLoading(false);
    }
  };

  const getStayType = (t) => (t.stayType || t.stay_type || t.rentType || t.rent_type || '').toLowerCase();

  const filteredTenants = tenants
    .filter((t) => {
      const status = t.status || t.tenantStatus;
      if (filter === 'Active') return status === 'active';
      if (filter === 'Vacated') return status === 'moved_out' || status === 'left' || status === 'vacated';
      if (filter === 'Notice') return status === 'notice_period' || status === 'notice';
      if (filter === 'Due') return status === 'active' && !(t.paidThisMonth || t.paid_this_month > 0);
      return true;
    })
    .filter((t) => {
      if (stayTypeFilter === 'Stay Type') return true;
      const stayType = getStayType(t);
      if (stayTypeFilter === 'Daily Stay') return stayType === 'daily' || stayType === 'daily stay';
      if (stayTypeFilter === 'Monthly Stay') return stayType === 'monthly' || stayType === 'monthly stay';
      return true;
    })
    .filter((t) =>
      (t.name || t.tenantName || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.phone || '').includes(search) ||
      (t.roomNumber || t.room_number || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const nameA = (a.name || a.tenantName || '').toLowerCase();
      const nameB = (b.name || b.tenantName || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

  const activeTenants = tenants.filter((t) => (t.status || t.tenantStatus) === 'active');
  const paidTenants = activeTenants.filter((t) => t.paidThisMonth || t.paid_this_month > 0);
  const dueTenants = activeTenants.filter((t) => !t.paidThisMonth && t.paid_this_month === 0);

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

  const handleExport = () => {
    exportToCsv('tenants', [
      { label: 'Name', key: 'name' },
      { label: 'Phone', key: 'phone' },
      { label: 'Email', key: 'email' },
      { label: 'Room', key: 'roomNumber' },
      { label: 'Rent', key: 'monthlyRent' },
      { label: 'Deposit', key: 'securityDeposit' },
      { label: 'Joining Date', key: 'joiningDate' },
      { label: 'Status', key: 'status' },
    ], filteredTenants);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: colors.text.primary, mb: 0.5 }}>
            Tenants
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            {filteredTenants.length} shown of {tenants.length} total
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
            disabled={filteredTenants.length === 0}
            sx={{ borderRadius: 3 }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddOpen}
            sx={{ background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})`, borderRadius: 3 }}
          >
            Add Tenant
          </Button>
          <Button
            variant="contained"
            startIcon={<MailOutline />}
            href="/tenant-requests"
            sx={{ background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: 3 }}
          >
            Requests
            {requestCount > 0 && (
              <Box component="span" sx={{ ml: 1, bgcolor: '#EF4444', color: '#fff', borderRadius: 10, px: 0.8, fontSize: 12, fontWeight: 700 }}>
                {requestCount}
              </Box>
            )}
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 2, borderRadius: 4 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search by name, room, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              fullWidth
              sx={{ flex: 1, minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: colors.text.secondary }} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Filter</InputLabel>
              <Select value={filter} label="Filter" onChange={(e) => setFilter(e.target.value)} sx={{ borderRadius: 3 }}>
                {FILTERS.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Stay Type</InputLabel>
              <Select value={stayTypeFilter} label="Stay Type" onChange={(e) => setStayTypeFilter(e.target.value)} sx={{ borderRadius: 3 }}>
                {STAY_TYPES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          <Grid container spacing={1.5}>
            {[
              { label: 'Active', value: activeTenants.length, color: '#111827' },
              { label: 'Paid', value: paidTenants.length, color: '#16A34A' },
              { label: 'Due', value: dueTenants.length, color: '#F97316' },
            ].map((s) => (
              <Grid item xs={4} key={s.label}>
                <Card sx={{ borderRadius: 3, textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>{s.label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={100} sx={{ mb: 2, borderRadius: 3 }} />
            ))}
          </CardContent>
        </Card>
      ) : filteredTenants.length === 0 ? (
        <Card sx={{ borderRadius: 4, textAlign: 'center', py: 6 }}>
          <Avatar sx={{ bgcolor: '#F3F4F6', color: '#9CA3AF', width: 64, height: 64, mx: 'auto', mb: 2 }}>
            <People sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" sx={{ color: '#111827', fontWeight: 700, mb: 0.5 }}>No tenants found</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            {filter !== 'All' ? `No tenants match the "${filter}" filter.` : 'Add your first tenant to get started.'}
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filteredTenants.map((tenant) => {
            const stayType = getStayType(tenant);
            const isDaily = stayType === 'daily' || stayType === 'daily stay';
            const isMonthly = stayType === 'monthly' || stayType === 'monthly stay';
            const status = tenant.status || tenant.tenantStatus;
            const statusInfo = statusMap[status] || { label: status || 'Unknown', bg: '#F3F4F6', color: '#374151' };
            const isVacated = status === 'moved_out' || status === 'left' || status === 'vacated';
            const initials = (tenant.name || tenant.tenantName || 'T').slice(0, 2).toUpperCase();

            return (
              <Grid item xs={12} md={6} key={tenant._id || tenant.id}>
                <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #F3F4F6' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1, minWidth: 0 }}>
                      {tenant.userPhoto ? (
                        <Avatar src={tenant.userPhoto} sx={{ width: 48, height: 48, border: '2px solid #E5E7EB' }} />
                      ) : (
                        <Avatar sx={{
                          width: 48, height: 48, color: '#fff', fontWeight: 700,
                          bgcolor: isDaily ? '#6366F1' : isMonthly ? '#F59E0B' : '#1a1a4e',
                        }}>
                          {initials}
                        </Avatar>
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827', lineHeight: 1.2 }} noWrap>
                          {tenant.name || tenant.tenantName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                          <LocationOn sx={{ fontSize: 12, color: '#6B7280' }} />
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>Room {tenant.roomNumber || tenant.room_number || '—'}</Typography>
                        </Box>
                        {stayType && (
                          <Chip
                            size="small"
                            icon={isDaily ? <CalendarToday sx={{ fontSize: 10, color: '#6366F1 !important' }} /> : <CalendarToday sx={{ fontSize: 10, color: '#F59E0B !important' }} />}
                            label={stayType.charAt(0).toUpperCase() + stayType.slice(1)}
                            sx={{
                              mt: 0.8,
                              bgcolor: isDaily ? '#EEF2FF' : '#FFFBEB',
                              color: isDaily ? '#6366F1' : '#F59E0B',
                              fontWeight: 600,
                              fontSize: '10px',
                              height: 22,
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, ml: 1 }}>
                      <Chip
                        size="small"
                        label={statusInfo.label}
                        sx={{ bgcolor: statusInfo.bg, color: statusInfo.color, fontWeight: 700, fontSize: '10px', height: 22 }}
                      />
                      {status === 'active' && (
                        <Chip
                          size="small"
                          label={(tenant.paidThisMonth || tenant.paid_this_month > 0) ? 'Paid' : 'Due'}
                          sx={{
                            bgcolor: (tenant.paidThisMonth || tenant.paid_this_month > 0) ? '#D1FAE5' : '#FEE2E2',
                            color: (tenant.paidThisMonth || tenant.paid_this_month > 0) ? '#16A34A' : '#DC2626',
                            fontWeight: 700,
                            fontSize: '10px',
                            height: 22,
                          }}
                        />
                      )}
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        <IconButton size="small" onClick={() => handleViewDetail(tenant)} sx={{ color: colors.primary[700] }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleEditOpen(tenant)} sx={{ color: colors.primary[700] }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        {isVacated ? (
                          <IconButton size="small" color="error" onClick={() => handleDeleteOpen(tenant)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        ) : (
                          <IconButton size="small" sx={{ color: '#F59E0B' }} onClick={() => handleVacateOpen(tenant)}>
                            <Logout fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Tenant Details</Typography>
          <IconButton onClick={() => setDetailOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTenant && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  {selectedTenant.photo ? (
                    <Box
                      component="img"
                      src={selectedTenant.photo}
                      alt={selectedTenant.name}
                      sx={{ width: 110, height: 110, objectFit: 'cover', borderRadius: '50%', mx: 'auto', mb: 2, border: `3px solid ${colors.primary[200]}` }}
                    />
                  ) : (
                    <Avatar sx={{ bgcolor: colors.primary[700], width: 100, height: 100, fontSize: '2.5rem', mx: 'auto', mb: 2 }}>
                      {selectedTenant.name?.charAt(0)}
                    </Avatar>
                  )}
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{selectedTenant.name}</Typography>
                  <Chip
                    label={statusMap[selectedTenant.status]?.label || selectedTenant.status || 'active'}
                    sx={{ bgcolor: statusMap[selectedTenant.status]?.bg || '#F3F4F6', color: statusMap[selectedTenant.status]?.color || '#374151', fontWeight: 500 }}
                  />
                  <Typography variant="body2" sx={{ color: colors.text.secondary, mt: 2 }}>
                    ID: {selectedTenant._id?.slice(-8).toUpperCase()}
                  </Typography>
                  {selectedTenant.idProof && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>ID Proof</Typography>
                      <Box component="img" src={selectedTenant.idProof} alt="ID Proof" sx={{ width: 140, height: 90, objectFit: 'cover', borderRadius: 1, border: `1px solid ${colors.border.main}` }} />
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.primary[700] }}>Contact Information</Typography>
                <List dense>
                  <ListItem><ListItemIcon><Phone color="primary" /></ListItemIcon><ListItemText primary="Phone" secondary={selectedTenant.phone} /></ListItem>
                  {selectedTenant.altPhone && <ListItem><ListItemIcon><Phone color="action" /></ListItemIcon><ListItemText primary="Alt. Phone" secondary={selectedTenant.altPhone} /></ListItem>}
                  <ListItem><ListItemIcon><Email color="primary" /></ListItemIcon><ListItemText primary="Email" secondary={selectedTenant.email || 'N/A'} /></ListItem>
                  <ListItem><ListItemIcon><LocationOn color="primary" /></ListItemIcon><ListItemText primary="Address" secondary={selectedTenant.address || 'N/A'} /></ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.primary[700] }}>Accommodation</Typography>
                <List dense>
                  <ListItem><ListItemIcon><BadgeIcon color="primary" /></ListItemIcon><ListItemText primary="Room" secondary={`Room ${selectedTenant.roomNumber || 'N/A'}`} /></ListItem>
                  <ListItem><ListItemIcon><Person color="primary" /></ListItemIcon><ListItemText primary="Bed Number" secondary={`Bed ${selectedTenant.bedNumber || 1}`} /></ListItem>
                  <ListItem><ListItemIcon><Payment color="primary" /></ListItemIcon><ListItemText primary="Monthly Rent" secondary={formatCurrency(selectedTenant.monthlyRent || selectedTenant.rent)} /></ListItem>
                  <ListItem><ListItemIcon><Receipt color="primary" /></ListItemIcon><ListItemText primary="Stay Type" secondary={(selectedTenant.stayType || 'monthly').toLowerCase() === 'daily' ? 'Daily' : 'Monthly'} /></ListItem>
                  <ListItem><ListItemIcon><Payment color="action" /></ListItemIcon><ListItemText primary="Security Deposit" secondary={formatCurrency(selectedTenant.securityDeposit)} /></ListItem>
                  <ListItem><ListItemIcon><CalendarToday color="primary" /></ListItemIcon><ListItemText primary="Join Date" secondary={formatDate(selectedTenant.joiningDate)} /></ListItem>
                </List>
              </Grid>

              <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.primary[700] }}>Additional Details</Typography>
                <List dense>
                  <ListItem><ListItemIcon><DocumentScanner color="primary" /></ListItemIcon><ListItemText primary="Aadhaar" secondary={selectedTenant.aadhaar || 'N/A'} /></ListItem>
                  <ListItem><ListItemIcon><Work color="primary" /></ListItemIcon><ListItemText primary="Occupation" secondary={selectedTenant.occupation || 'N/A'} /></ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.error }}>Emergency Contact</Typography>
                <List dense>
                  <ListItem><ListItemIcon><ContactEmergency color="error" /></ListItemIcon><ListItemText primary="Name" secondary={selectedTenant.emergencyContact || 'N/A'} /></ListItem>
                  <ListItem><ListItemIcon><Phone color="error" /></ListItemIcon><ListItemText primary="Phone" secondary={selectedTenant.emergencyPhone || 'N/A'} /></ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.success }}>Payment Status</Typography>
                <Paper sx={{ p: 2, bgcolor: `${colors.success}10` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CheckCircle sx={{ color: colors.success }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>All payments up to date</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: colors.text.secondary }}>Last payment: March 2026</Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Edit />} onClick={() => { setDetailOpen(false); handleEditOpen(selectedTenant); }}>Edit</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen || editOpen} onClose={() => { setAddOpen(false); setEditOpen(false); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{addOpen ? 'Add New Tenant' : 'Edit Tenant'}</Typography>
          <IconButton onClick={() => { setAddOpen(false); setEditOpen(false); }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{formSuccess}</Alert>}

          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Full Name" name="name" value={formData.name} onChange={handleFormChange} required size="small" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Phone Number" name="phone" value={formData.phone} onChange={handleFormChange} required size="small" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleFormChange} size="small" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Alternate Phone" name="altPhone" value={formData.altPhone} onChange={handleFormChange} size="small" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Aadhaar Number" name="aadhaar" value={formData.aadhaar} onChange={handleFormChange} size="small" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Occupation" name="occupation" value={formData.occupation} onChange={handleFormChange} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleFormChange} size="small" />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ border: `1px dashed ${colors.border.main}`, borderRadius: 2, p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Tenant Photo</Typography>
                {formData.photo ? (
                  <Box component="img" src={formData.photo} alt="Tenant" sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '50%', mb: 1 }} />
                ) : (
                  <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 1, bgcolor: colors.primary[100] }}>
                    <Person sx={{ fontSize: 40, color: colors.primary[700] }} />
                  </Avatar>
                )}
                <Button variant="outlined" size="small" component="label" sx={{ borderRadius: 3 }}>
                  Upload Photo
                  <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'photo')} />
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ border: `1px dashed ${colors.border.main}`, borderRadius: 2, p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>ID Proof (Aadhaar)</Typography>
                {formData.idProof ? (
                  <Box component="img" src={formData.idProof} alt="ID Proof" sx={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 1, mb: 1 }} />
                ) : (
                  <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 1, bgcolor: colors.primary[100], borderRadius: 1 }}>
                    <DocumentScanner sx={{ fontSize: 40, color: colors.primary[700] }} />
                  </Avatar>
                )}
                <Button variant="outlined" size="small" component="label" sx={{ borderRadius: 3 }}>
                  Upload ID Proof
                  <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'idProof')} />
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption" color="text.secondary">ACCOMMODATION DETAILS</Typography></Divider></Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Room</InputLabel>
                <Select name="roomId" value={formData.roomId} onChange={handleFormChange} label="Room" sx={{ borderRadius: 3 }}>
                  <MenuItem value="">Select Room</MenuItem>
                  {rooms.length === 0 && <MenuItem value="" disabled>No rooms available</MenuItem>}
                  {rooms.map((room) => {
                    const roomId = room._id || room.id;
                    const roomNumber = room.roomNumber || room.room_number;
                    const available = (room.capacity || 0) - (room.occupiedBeds || room.occupied_beds || 0);
                    return (
                      <MenuItem key={roomId} value={roomId}>
                        Room {roomNumber || 'N/A'} ({room.type || 'N/A'}) - {available} beds available
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Bed Number" name="bedNumber" type="number" value={formData.bedNumber} onChange={handleFormChange} size="small" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Monthly Rent (₹)" name="monthlyRent" type="number" value={formData.monthlyRent} onChange={handleFormChange} required size="small" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Security Deposit (₹)" name="securityDeposit" type="number" value={formData.securityDeposit} onChange={handleFormChange} size="small" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Joining Date" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleFormChange} InputLabelProps={{ shrink: true }} size="small" />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select name="status" value={formData.status} onChange={handleFormChange} label="Status" sx={{ borderRadius: 3 }}>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption" color="text.secondary">EMERGENCY CONTACT</Typography></Divider></Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Emergency Contact Name" name="emergencyContact" value={formData.emergencyContact} onChange={handleFormChange} size="small" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Emergency Contact Phone" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleFormChange} size="small" />
            </Grid>

            {addOpen && (
              <>
                <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption" color="text.secondary">INITIAL PAYMENT</Typography></Divider></Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input type="checkbox" id="recordPayment" name="recordPayment" checked={paymentData.recordPayment} onChange={handlePaymentFormChange} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    <Typography variant="body2" component="label" htmlFor="recordPayment" sx={{ cursor: 'pointer' }}>
                      Record initial payment with tenant registration
                    </Typography>
                  </Box>
                </Grid>
                {paymentData.recordPayment && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Payment Amount (₹)" name="amount" type="number" value={paymentData.amount} onChange={handlePaymentFormChange} required={paymentData.recordPayment} size="small" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Payment Date" name="paymentDate" type="date" value={paymentData.paymentDate} onChange={handlePaymentFormChange} InputLabelProps={{ shrink: true }} required={paymentData.recordPayment} size="small" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Payment Month" name="paymentMonth" type="month" value={paymentData.paymentMonth} onChange={handlePaymentFormChange} InputLabelProps={{ shrink: true }} required={paymentData.recordPayment} size="small" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Payment Method</InputLabel>
                        <Select name="paymentMethod" value={paymentData.paymentMethod} onChange={handlePaymentFormChange} label="Payment Method" sx={{ borderRadius: 3 }}>
                          {['Cash', 'UPI', 'GPay', 'PhonePe', 'Paytm', 'Bank Transfer', 'NEFT', 'IMPS', 'Card', 'Cheque'].map((m) => (
                            <MenuItem key={m} value={m}>{m}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Notes" name="notes" value={paymentData.notes} onChange={handlePaymentFormChange} placeholder="e.g., First month rent + security deposit" size="small" />
                    </Grid>
                  </>
                )}
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setAddOpen(false); setEditOpen(false); }} sx={{ borderRadius: 3 }}>Cancel</Button>
          <Button variant="contained" startIcon={formLoading ? <CircularProgress size={20} /> : <Save />} onClick={() => handleSubmit(addOpen ? 'add' : 'edit')} disabled={formLoading} sx={{ borderRadius: 3 }}>
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
          <Alert severity="warning" sx={{ borderRadius: 3 }}>This action cannot be undone. All tenant data will be permanently removed.</Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ borderRadius: 3 }}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={formLoading ? <CircularProgress size={20} /> : <Delete />} onClick={handleDelete} disabled={formLoading} sx={{ borderRadius: 3 }}>
            Delete Tenant
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vacate Confirmation Dialog */}
      <Dialog open={vacateOpen} onClose={() => setVacateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Logout sx={{ color: '#F59E0B' }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Vacate Tenant</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to mark <strong>{selectedTenant?.name}</strong> as vacated?
          </Typography>
          <Alert severity="info" sx={{ borderRadius: 3 }}>This will free up the bed and mark the tenant as moved out.</Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setVacateOpen(false)} sx={{ borderRadius: 3 }}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#F59E0B', borderRadius: 3 }} startIcon={formLoading ? <CircularProgress size={20} /> : <Logout />} onClick={handleVacate} disabled={formLoading}>
            Vacate Tenant
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tenants;
