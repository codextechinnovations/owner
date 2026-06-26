import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Skeleton,
  Divider,
  Tabs,
  Tab,
  Avatar,
} from '@mui/material';
import {
  Search,
  Visibility,
  CheckCircle,
  Close,
  Delete,
  Hotel,
  CalendarToday,
  Phone,
  Email,
  Person,
  Home,
  AccessTime,
  Work,
  LocationOn,
  People,
  Description,
  WbSunny,
  Calculate,
  CurrencyRupee,
  Expand,
    Refresh

} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { roomService, tenantRequestService, bankAccountService } from '../services/services';
import { resolveLogoUrl } from '../utils/logoHelper';

const FALLBACK_QR = 'https://i.ibb.co/QvRGGsnK/8d2b316f609a.png';

const statusStyles = {
  PENDING: { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  APPROVED: { bg: '#DCFCE7', color: '#15803D', dot: '#22C55E' },
  REJECTED: { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatShortDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

const maskAadhaar = (aadhaar) => {
  if (!aadhaar || String(aadhaar).length < 4) return 'XXXX XXXX XXXX';
  const s = String(aadhaar).replace(/\s/g, '');
  return `XXXX XXXX ${s.slice(-4)}`;
};

const stayInfo = (request) => {
  if (!request?.stayType) return null;

  if (request.stayType === 'daily' && request.checkinDate && request.checkoutDate) {
    const ci = new Date(request.checkinDate);
    const co = new Date(request.checkoutDate);
    const days = Math.max(1, Math.ceil((co - ci) / 86400000));
    return {
      label: 'Daily Stay',
      date: `${formatShortDate(request.checkinDate)} → ${formatShortDate(request.checkoutDate)}`,
      fullDate: `${formatDate(request.checkinDate)} to ${formatDate(request.checkoutDate)}`,
      duration: `${days} day${days > 1 ? 's' : ''}`,
      time: request.checkinTime ? `Check-in: ${formatTime(request.checkinTime)}${request.checkoutTime ? ` · Check-out: ${formatTime(request.checkoutTime)}` : ''}` : null,
      days,
    };
  }

  if (request.stayType === 'monthly' && request.checkinDate) {
    const m = Number(request.stayMonths) > 0 ? Number(request.stayMonths) : 1;
    const co = new Date(request.checkinDate);
    co.setMonth(co.getMonth() + m);
    return {
      label: 'Monthly Stay',
      date: `From ${formatDate(request.checkinDate)}`,
      duration: `${m} month${m > 1 ? 's' : ''}`,
      time: request.checkinTime ? `Check-in: ${formatTime(request.checkinTime)}` : null,
      checkout: `Approx. check-out: ${formatDate(co)}`,
    };
  }

  return { label: request.stayType, date: '', duration: '', time: null, checkout: null };
};

const getRoomRentFields = (room) => {
  const rt = room?.rentType || 'monthly';
  const dailyRent = room?.dailyRent || room?.rentPerBed || room?.rent_per_bed || 0;
  const monthlyRent = room?.monthlyRent || room?.rentPerBed || room?.rent_per_bed || 0;
  return { rentType: rt, dailyRent: Number(dailyRent) || 0, monthlyRent: Number(monthlyRent) || 0 };
};

const TenantRequests = () => {
  const { user, selectedPg } = useAuth();
  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bankAccount, setBankAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [approveData, setApproveData] = useState({ roomId: '', rent: '', advance: '' });

  const fetchData = async () => {
    const ownerId = user?._id || user?.id;
    if (!ownerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [requestRes, roomRes, bankRes] = await Promise.all([
        tenantRequestService.getOwnerRequests(ownerId),
        selectedPg?._id ? roomService.getAll({ pgId: selectedPg._id }) : Promise.resolve({ rooms: [] }),
        selectedPg?._id ? bankAccountService.getAll(selectedPg._id) : Promise.resolve({ data: null }),
      ]);

      const requestList = Array.isArray(requestRes)
        ? requestRes
        : (Array.isArray(requestRes?.data) ? requestRes.data : []);

      const roomList = Array.isArray(roomRes)
        ? roomRes
        : (Array.isArray(roomRes?.rooms) ? roomRes.rooms : []);

      const bankData = bankRes?.data?.data || bankRes?.data;
      setBankAccount(Array.isArray(bankData) ? bankData[0] : bankData);
      setRequests(selectedPg?._id ? requestList.filter((r) => String(r.pgId) === String(selectedPg._id)) : requestList);
      setRooms(roomList);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tenant requests.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPg, user]);

  const availableRooms = useMemo(() => {
    return rooms.filter((room) => {
      const occupied = Number(room.occupied_beds || room.occupiedBeds || 0);
      const capacity = Number(room.capacity || room.maxOccupancy || 1);
      return occupied < capacity;
    });
  }, [rooms]);

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((req) => {
      const matchesStatus = statusTab === 'ALL' || (req.status || 'PENDING') === statusTab;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        req.name?.toLowerCase().includes(q)
        || req.phone?.includes(q)
        || req.email?.toLowerCase().includes(q)
        || req.status?.toLowerCase().includes(q)
        || req.stayType?.toLowerCase().includes(q)
      );
    });
  }, [requests, search, statusTab]);

  const tabCounts = useMemo(() => ({
    ALL: requests.length,
    PENDING: requests.filter((req) => (req.status || 'PENDING') === 'PENDING').length,
    APPROVED: requests.filter((req) => req.status === 'APPROVED').length,
    REJECTED: requests.filter((req) => req.status === 'REJECTED').length,
  }), [requests]);

  const selectedRoom = useMemo(() => rooms.find((r) => r._id === approveData.roomId), [rooms, approveData.roomId]);

  const calcBreakdown = useMemo(() => {
    if (!selectedRoom || !selectedRequest) return null;
    const stay = stayInfo(selectedRequest);
    if (!stay?.days || selectedRequest.stayType !== 'daily') return null;
    const { rentType, dailyRent, monthlyRent } = getRoomRentFields(selectedRoom);
    if (rentType === 'daily') {
      return {
        line1: `₹${dailyRent.toLocaleString('en-IN')}/day`,
        line2: `× ${stay.days} day${stay.days > 1 ? 's' : ''}`,
        total: dailyRent * stay.days,
      };
    }
    const dailyRate = Math.ceil(monthlyRent / 30);
    return {
      line1: `₹${monthlyRent.toLocaleString('en-IN')}/mo ÷ 30`,
      line2: `= ₹${dailyRate.toLocaleString('en-IN')}/day × ${stay.days} day${stay.days > 1 ? 's' : ''}`,
      total: dailyRate * stay.days,
    };
  }, [selectedRoom, selectedRequest]);

  const roomRentType = useMemo(() => getRoomRentFields(selectedRoom).rentType, [selectedRoom]);

  const isMismatch = selectedRequest?.stayType && roomRentType && selectedRequest.stayType !== roomRentType && selectedRequest.stayType !== 'daily';

  const handleRoomSelect = (roomId) => {
    setApproveData((prev) => ({ ...prev, roomId, rent: '', advance: prev.advance }));
    const room = rooms.find((r) => r._id === roomId);
    if (!room) return;

    const stay = stayInfo(selectedRequest);
    const { rentType, dailyRent, monthlyRent } = getRoomRentFields(room);

    if (selectedRequest?.stayType === 'daily' && stay?.days > 0) {
      if (rentType === 'daily') {
        setApproveData((prev) => ({ ...prev, roomId, rent: String(dailyRent * stay.days) }));
      } else {
        const dailyRate = Math.ceil(monthlyRent / 30);
        setApproveData((prev) => ({ ...prev, roomId, rent: String(dailyRate * stay.days) }));
      }
    } else {
      setApproveData((prev) => ({ ...prev, roomId, rent: String(rentType === 'daily' ? dailyRent : monthlyRent) }));
    }
  };

  const handleOpenApprove = (request) => {
    setSelectedRequest(request);
    setApproveData({ roomId: '', rent: '', advance: '' });
    setError('');
    setSuccess('');
    setApproveOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    if (!approveData.roomId) {
      setError('Please select a room before approving.');
      return;
    }
    if (!approveData.rent || Number(approveData.rent) <= 0) {
      setError('Please enter a valid rent amount.');
      return;
    }

    const ownerId = user?._id || user?.id;
    if (!ownerId) {
      setError('Owner information missing. Please re-login and try again.');
      return;
    }

    const dueDay = '05';
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const dueDate = `${dueDay}/${String(nextMonth.getMonth() + 1).padStart(2, '0')}/${nextMonth.getFullYear()}`;

    setSaving(true);
    setError('');
    try {
      await tenantRequestService.updateStatus(selectedRequest._id, {
        status: 'APPROVED',
        owner_id: ownerId,
        roomId: approveData.roomId,
        monthlyRent: Number(approveData.rent),
        advance: Number(approveData.advance || 0),
        invoice: {
          monthlyRent: Number(approveData.rent),
          securityDeposit: Number(approveData.advance || 0),
          billingMonth: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
          dueDate,
          discount: 0,
        },
      });

      setSuccess('Request approved successfully. Tenant account has been created.');
      setApproveOpen(false);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request.');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    const ownerId = user?._id || user?.id;
    if (!ownerId) {
      setError('Owner information missing. Please re-login and try again.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await tenantRequestService.updateStatus(selectedRequest._id, {
        status: 'REJECTED',
        owner_id: ownerId,
      });
      setSuccess('Request rejected successfully.');
      setRejectOpen(false);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRequest?._id) return;
    setSaving(true);
    setError('');
    try {
      await tenantRequestService.delete(selectedRequest._id);
      setDeleteOpen(false);
      setSuccess('Request deleted successfully.');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete request.');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = (request) => {
    setSelectedRequest(request);
    setDetailOpen(true);
  };

  const qrUrl = useMemo(() => {
    const url = bankAccount?.qrCode || bankAccount?.qr_code || FALLBACK_QR;
    return resolveLogoUrl(url);
  }, [bankAccount]);

  const getAvatarUrl = (request) => resolveLogoUrl(request?.passportPhoto);
  const getDocUrl = (url) => resolveLogoUrl(url);

  const renderRequestCard = (request) => {
    const stay = stayInfo(request);
    const status = request.status || 'PENDING';
    const style = statusStyles[status] || statusStyles.PENDING;

    return (
      <Card key={request._id} sx={{ borderRadius: 4, mb: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid #F1F5F9' }}>
        <Box sx={{ height: 3, bgcolor: '#F97316' }} />
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            {request.passportPhoto ? (
              <Avatar src={getAvatarUrl(request)} sx={{ width: 48, height: 48, border: '2px solid #E2E8F0' }} />
            ) : (
              <Avatar sx={{ width: 48, height: 48, bgcolor: '#F1F5F9', color: '#94A3B8', border: '2px solid #E2E8F0' }}>
                <Person />
              </Avatar>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>{request.name}</Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>{request.phone}</Typography>
            </Box>
            {request.stayType && (
              <Chip
                size="small"
                icon={request.stayType === 'daily' ? <WbSunny sx={{ fontSize: 12, color: '#9A3412 !important' }} /> : <CalendarToday sx={{ fontSize: 12, color: '#1E3A8A !important' }} />}
                label={request.stayType === 'daily' ? 'DAILY' : 'MONTHLY'}
                sx={{
                  bgcolor: request.stayType === 'daily' ? '#FFF7ED' : '#F0F4FF',
                  color: request.stayType === 'daily' ? '#9A3412' : '#1E3A8A',
                  border: '1px solid',
                  borderColor: request.stayType === 'daily' ? '#FDBA74' : '#A5B4FC',
                  fontWeight: 700,
                  fontSize: '10px',
                  letterSpacing: 0.5,
                }}
              />
            )}
          </Box>

          {stay && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: request.stayType === 'daily' ? '#FFF7ED' : '#F0F4FF', borderRadius: 2, mb: 1.5 }}>
              <AccessTime sx={{ fontSize: 16, color: request.stayType === 'daily' ? '#9A3412' : '#1E3A8A' }} />
              <Typography variant="caption" sx={{ color: request.stayType === 'daily' ? '#9A3412' : '#1E3A8A', fontWeight: 600 }}>
                {stay.text || stay.date} {stay.duration ? `· ${stay.duration}` : ''} {stay.time ? `· ${stay.time}` : ''}
              </Typography>
            </Box>
          )}

          <Grid container spacing={1} sx={{ mb: 1.5 }}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#F8FAFC', p: 1, borderRadius: 2 }}>
                <Email sx={{ fontSize: 14, color: '#94A3B8' }} />
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{request.email || '—'}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#F8FAFC', p: 1, borderRadius: 2 }}>
                <Work sx={{ fontSize: 14, color: '#94A3B8' }} />
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{request.occupation || '—'}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#F8FAFC', p: 1, borderRadius: 2 }}>
                <Description sx={{ fontSize: 14, color: '#94A3B8' }} />
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500, fontFamily: 'monospace' }}>{maskAadhaar(request.aadhaar)}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#F8FAFC', p: 1, borderRadius: 2 }}>
                <Phone sx={{ fontSize: 14, color: '#94A3B8' }} />
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>{request.altPhone || '—'}</Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: status === 'PENDING' ? 1.5 : 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarToday sx={{ fontSize: 12, color: '#94A3B8' }} />
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                Applied {formatDate(request.createdAt)}
              </Typography>
            </Box>
            <Chip
              size="small"
              icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: style.dot, mr: -0.5 }} />}
              label={status}
              sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, fontSize: '10px', letterSpacing: 0.3 }}
            />
          </Box>

          {status === 'PENDING' && (
            <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<CheckCircle />}
                onClick={() => handleOpenApprove(request)}
                disabled={saving}
                sx={{ bgcolor: '#059669', borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
              >
                Accept
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Close />}
                onClick={() => { setSelectedRequest(request); setRejectOpen(true); }}
                disabled={saving}
                sx={{ bgcolor: '#DC2626', borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
              >
                Decline
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: colors.text.primary, mb: 0.5 }}>
            Check-In Requests
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            {filteredRequests.length} shown of {requests.length} total request{requests.length === 1 ? '' : 's'}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{success}</Alert>}

      <Card sx={{ mb: 2, borderRadius: 4 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Tabs
            value={statusTab}
            onChange={(_, value) => setStatusTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ mb: 1.5 }}
          >
            <Tab value="ALL" label={`All (${tabCounts.ALL})`} />
            <Tab value="PENDING" label={`Pending (${tabCounts.PENDING})`} />
            <Tab value="APPROVED" label={`Approved (${tabCounts.APPROVED})`} />
            <Tab value="REJECTED" label={`Rejected (${tabCounts.REJECTED})`} />
          </Tabs>
          <TextField
            placeholder="Search by name, phone, email or stay type"
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
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
        </CardContent>
      </Card>

      {loading ? (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} height={180} sx={{ mb: 2, borderRadius: 3 }} />
            ))}
          </CardContent>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card sx={{ borderRadius: 4, textAlign: 'center', py: 6 }}>
          <Avatar sx={{ bgcolor: '#F1F5F9', color: '#94A3B8', width: 64, height: 64, mx: 'auto', mb: 2 }}>
            <Email sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" sx={{ color: '#0F172A', fontWeight: 700, mb: 0.5 }}>No Check-In Requests</Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>Tenant requests will appear here</Typography>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData} sx={{ borderRadius: 3 }}>Refresh</Button>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filteredRequests.map((request) => (
            <Grid item xs={12} md={6} key={request._id}>
              <Box onClick={() => openDetail(request)} sx={{ cursor: 'pointer' }}>
                {renderRequestCard(request)}
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
          Request Details
          <IconButton onClick={() => setDetailOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #F1F5F9' }}>
                  <Box sx={{ height: 4, bgcolor: '#F97316' }} />
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ position: 'relative' }}>
                      {selectedRequest.passportPhoto ? (
                        <Avatar src={getAvatarUrl(selectedRequest)} sx={{ width: 72, height: 72, border: '2px solid #E2E8F0' }} />
                      ) : (
                        <Avatar sx={{ width: 72, height: 72, bgcolor: '#F1F5F9', color: '#94A3B8', border: '2px solid #E2E8F0' }}>
                          <Person sx={{ fontSize: 32 }} />
                        </Avatar>
                      )}
                      <Box sx={{ position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', bgcolor: statusStyles[selectedRequest.status || 'PENDING'].dot }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>{selectedRequest.name}</Typography>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>{selectedRequest.phone}</Typography>
                    </Box>
                    <Chip
                      size="small"
                      icon={<Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: statusStyles[selectedRequest.status || 'PENDING'].dot }} />}
                      label={selectedRequest.status || 'PENDING'}
                      sx={{ bgcolor: statusStyles[selectedRequest.status || 'PENDING'].bg, color: statusStyles[selectedRequest.status || 'PENDING'].color, fontWeight: 700 }}
                    />
                  </CardContent>
                  <Box sx={{ px: 2, pb: 2, display: 'flex', alignItems: 'center', gap: 0.5, borderTop: '1px solid #F1F5F9', pt: 1.5, mx: 2 }}>
                    <CalendarToday sx={{ fontSize: 14, color: '#94A3B8' }} />
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>Applied on {formatDate(selectedRequest.createdAt)}</Typography>
                  </Box>
                </Card>
              </Grid>

              {stayInfo(selectedRequest) && (
                <Grid item xs={12}>
                  <Card sx={{
                    borderRadius: 4,
                    bgcolor: selectedRequest.stayType === 'daily' ? '#FFF7ED' : '#F0F4FF',
                    border: '1px solid',
                    borderColor: selectedRequest.stayType === 'daily' ? '#FDBA74' : '#A5B4FC',
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <Avatar sx={{ bgcolor: selectedRequest.stayType === 'daily' ? '#EA580C' : '#234681', color: '#fff', width: 40, height: 40 }}>
                          {selectedRequest.stayType === 'daily' ? <WbSunny /> : <CalendarToday />}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>{stayInfo(selectedRequest).label}</Typography>
                          <Typography variant="body2" sx={{ color: '#64748B' }}>{stayInfo(selectedRequest).duration}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 2, mb: 1 }}>
                        <LocationOn sx={{ fontSize: 16, color: selectedRequest.stayType === 'daily' ? '#9A3412' : '#1A365D' }} />
                        <Typography variant="body2" sx={{ color: selectedRequest.stayType === 'daily' ? '#9A3412' : '#1A365D', fontWeight: 600 }}>{stayInfo(selectedRequest).date}</Typography>
                      </Box>
                      {stayInfo(selectedRequest).time && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, mb: 0.5 }}>
                          <AccessTime sx={{ fontSize: 14, color: '#64748B' }} />
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>{stayInfo(selectedRequest).time}</Typography>
                        </Box>
                      )}
                      {stayInfo(selectedRequest).checkout && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                          <Hotel sx={{ fontSize: 14, color: '#64748B' }} />
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>{stayInfo(selectedRequest).checkout}</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 4, border: '1px solid #F1F5F9', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 1, borderBottom: '1px solid #F1F5F9' }}>
                      <People sx={{ color: colors.primary[700], fontSize: 18 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>Contact Details</Typography>
                    </Box>
                    {[
                      { icon: Phone, value: selectedRequest.phone },
                      { icon: Phone, value: selectedRequest.altPhone || 'Not provided' },
                      { icon: Email, value: selectedRequest.email },
                      { icon: Description, value: maskAadhaar(selectedRequest.aadhaar), mono: true },
                    ].map((row, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, mb: 1, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                        <Avatar sx={{ width: 30, height: 30, bgcolor: '#F1F5F9', color: '#94A3B8' }}>
                          <row.icon sx={{ fontSize: 14 }} />
                        </Avatar>
                        <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500, fontFamily: row.mono ? 'monospace' : 'inherit' }}>{row.value}</Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 4, border: '1px solid #F1F5F9', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 1, borderBottom: '1px solid #F1F5F9' }}>
                      <LocationOn sx={{ color: colors.primary[700], fontSize: 18 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>Permanent Address</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6, p: 1, bgcolor: '#F8FAFC', borderRadius: 2 }}>{selectedRequest.address || '—'}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card sx={{ borderRadius: 4, border: '1px solid #F1F5F9' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 1, borderBottom: '1px solid #F1F5F9' }}>
                      <Work sx={{ color: colors.primary[700], fontSize: 18 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>Occupation Details</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Profession</Typography>
                          <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>{selectedRequest.occupation || '—'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Work / College Address</Typography>
                          <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>{selectedRequest.occupationAddress || '—'}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {(selectedRequest.aadhaarPhoto || selectedRequest.passportPhoto) && (
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 4, border: '1px solid #F1F5F9' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 1, borderBottom: '1px solid #F1F5F9' }}>
                        <Description sx={{ color: colors.primary[700], fontSize: 18 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>Documents</Typography>
                      </Box>
                      <Grid container spacing={2}>
                        {selectedRequest.aadhaarPhoto && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, mb: 1, display: 'block' }}>Aadhaar Card</Typography>
                            <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>
                              <img src={getDocUrl(selectedRequest.aadhaarPhoto)} alt="Aadhaar" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, border: '1px solid #E2E8F0' }} />
                              <IconButton sx={{ position: 'absolute', bottom: 12, right: 12, bgcolor: 'rgba(15,23,42,0.6)', color: '#fff', '&:hover': { bgcolor: 'rgba(15,23,42,0.8)' } }} onClick={() => window.open(getDocUrl(selectedRequest.aadhaarPhoto), '_blank')}>
                                <Expand />
                              </IconButton>
                            </Box>
                          </Grid>
                        )}
                        {selectedRequest.passportPhoto && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, mb: 1, display: 'block' }}>Passport Size Photo</Typography>
                            <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>
                              <img src={getDocUrl(selectedRequest.passportPhoto)} alt="Passport" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, border: '1px solid #E2E8F0' }} />
                              <IconButton sx={{ position: 'absolute', bottom: 12, right: 12, bgcolor: 'rgba(15,23,42,0.6)', color: '#fff', '&:hover': { bgcolor: 'rgba(15,23,42,0.8)' } }} onClick={() => window.open(getDocUrl(selectedRequest.passportPhoto), '_blank')}>
                                <Expand />
                              </IconButton>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {selectedRequest.status === 'PENDING' && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button fullWidth variant="contained" startIcon={<CheckCircle />} onClick={() => { setDetailOpen(false); handleOpenApprove(selectedRequest); }} sx={{ bgcolor: '#059669', borderRadius: 3, textTransform: 'none', fontWeight: 700, py: 1.2 }}>
                      Approve
                    </Button>
                    <Button fullWidth variant="contained" startIcon={<Close />} onClick={() => { setDetailOpen(false); setRejectOpen(true); }} sx={{ bgcolor: '#DC2626', borderRadius: 3, textTransform: 'none', fontWeight: 700, py: 1.2 }}>
                      Reject
                    </Button>
                    <Button fullWidth variant="outlined" color="error" startIcon={<Delete />} onClick={() => { setDetailOpen(false); setDeleteOpen(true); }} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, py: 1.2 }}>
                      Delete
                    </Button>
                  </Box>
                </Grid>
              )}

              {selectedRequest.status === 'APPROVED' && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, p: 2, bgcolor: '#DCFCE7', borderRadius: 3, border: '1px solid #BBF7D0' }}>
                    <CheckCircle sx={{ color: '#059669' }} />
                    <Typography variant="body2" sx={{ color: '#15803D', fontWeight: 600 }}>This request has been approved</Typography>
                  </Box>
                </Grid>
              )}

              {selectedRequest.status === 'REJECTED' && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, p: 2, bgcolor: '#FEE2E2', borderRadius: 3, border: '1px solid #FECACA' }}>
                    <Close sx={{ color: '#DC2626' }} />
                    <Typography variant="body2" sx={{ color: '#991B1B', fontWeight: 600 }}>This request has been rejected</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)} sx={{ borderRadius: 3 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onClose={() => setApproveOpen(false)} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
          Approve Check-In
          <IconButton onClick={() => setApproveOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#059669', color: '#fff' }}><CheckCircle /></Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedRequest.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>{selectedRequest.phone}</Typography>
                  </Box>
                </Box>
              </Grid>

              {stayInfo(selectedRequest) && (
                <Grid item xs={12}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2,
                    bgcolor: selectedRequest.stayType === 'daily' ? '#FFF7ED' : '#F0F4FF',
                    border: '1px solid', borderColor: selectedRequest.stayType === 'daily' ? '#FDBA74' : '#A5B4FC',
                  }}>
                    {selectedRequest.stayType === 'daily' ? <WbSunny sx={{ color: '#9A3412' }} /> : <CalendarToday sx={{ color: '#1E3A8A' }} />}
                    <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
                      {stayInfo(selectedRequest).label} · {stayInfo(selectedRequest).date} · {stayInfo(selectedRequest).duration}
                    </Typography>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Room</InputLabel>
                  <Select
                    value={approveData.roomId}
                    label="Select Room"
                    onChange={(e) => handleRoomSelect(e.target.value)}
                  >
                    <MenuItem value=""><em>Select Room</em></MenuItem>
                    {availableRooms.map((room) => {
                      const { rentType, dailyRent, monthlyRent } = getRoomRentFields(room);
                      const amount = rentType === 'daily' ? dailyRent : monthlyRent;
                      const occupied = Number(room.occupied_beds || room.occupiedBeds || 0);
                      const capacity = Number(room.capacity || room.maxOccupancy || 1);
                      return (
                        <MenuItem key={room._id} value={room._id}>
                          <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                            <Typography variant="body2">Room {room.roomNumber || room.room_number}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>₹{amount.toLocaleString('en-IN')}/{rentType === 'daily' ? 'day' : 'mo'}/bed</Typography>
                              <Chip size="small" label={`${Math.max(0, capacity - occupied)}/${capacity} beds`} sx={{ fontWeight: 600 }} />
                            </Box>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>

              {selectedRoom && (
                <Grid item xs={12}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 2,
                    bgcolor: roomRentType === 'daily' ? '#FFF7ED' : '#F0F4FF',
                    border: '1px solid', borderColor: roomRentType === 'daily' ? '#FDBA74' : '#A5B4FC',
                  }}>
                    {roomRentType === 'daily' ? <WbSunny sx={{ color: '#9A3412' }} /> : <CalendarToday sx={{ color: '#1E3A8A' }} />}
                    <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>
                      Room pricing: {roomRentType === 'daily' ? 'Daily' : 'Monthly'} · {selectedRoom.capacity || selectedRoom.maxOccupancy || 0} bed{(selectedRoom.capacity || selectedRoom.maxOccupancy || 0) !== 1 ? 's' : ''} available
                    </Typography>
                  </Box>
                </Grid>
              )}

              {calcBreakdown && (
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: 3 }}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Calculate sx={{ fontSize: 16, color: '#EA580C' }} />
                        <Typography variant="caption" sx={{ color: '#9A3412', fontWeight: 700 }}>Auto-Calculated Rent</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>{calcBreakdown.line1}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>{calcBreakdown.line2}</Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Total stay rent</Typography>
                        <Typography variant="h6" sx={{ color: '#EA580C', fontWeight: 800 }}>₹{calcBreakdown.total.toLocaleString('en-IN')}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {isMismatch && (
                <Grid item xs={12}>
                  <Alert severity="warning" icon={<Close sx={{ transform: 'rotate(180deg)' }} />} sx={{ borderRadius: 3 }}>
                    Tenant requested monthly stay but this room has daily pricing. Est. monthly: ₹{approveData.rent ? (parseFloat(approveData.rent) * 30).toLocaleString('en-IN') : '—'}.
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={selectedRequest.stayType === 'daily' ? `Total Rent (${stayInfo(selectedRequest).days} day${stayInfo(selectedRequest).days > 1 ? 's' : ''})` : roomRentType === 'daily' ? 'Rent per Bed (Daily) ₹' : 'Monthly Rent per Bed (₹)'}
                  type="number"
                  value={approveData.rent}
                  onChange={(e) => setApproveData((prev) => ({ ...prev, rent: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><CurrencyRupee fontSize="small" /></InputAdornment>,
                    endAdornment: <InputAdornment position="end">{selectedRequest.stayType === 'daily' ? 'total' : roomRentType === 'daily' ? '/day' : '/mo'}</InputAdornment>,
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>

              {selectedRequest.stayType !== 'daily' && roomRentType === 'daily' && approveData.rent && (
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Est. monthly: ₹{(parseFloat(approveData.rent || 0) * 30).toLocaleString('en-IN')} (×30 days)
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Advance / Security Deposit"
                  type="number"
                  value={approveData.advance}
                  onChange={(e) => setApproveData((prev) => ({ ...prev, advance: e.target.value }))}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CurrencyRupee fontSize="small" /></InputAdornment> }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>

              {(approveData.rent || approveData.advance) && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>{selectedRequest.stayType === 'daily' ? `Total Rent (${stayInfo(selectedRequest).days} day${stayInfo(selectedRequest).days > 1 ? 's' : ''})` : roomRentType === 'daily' ? 'Daily Rent per Bed' : 'Monthly Rent per Bed'}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{Number(approveData.rent || 0).toLocaleString('en-IN')}</Typography>
                      </Box>
                      {selectedRequest.stayType !== 'daily' && roomRentType === 'daily' && approveData.rent && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ color: '#64748B' }}>Est. Monthly per Bed</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{(parseFloat(approveData.rent || 0) * 30).toLocaleString('en-IN')}/mo</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Security Deposit</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{Number(approveData.advance || 0).toLocaleString('en-IN')}</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>Total to Collect</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#F97316' }}>₹{((Number(approveData.rent || 0) + Number(approveData.advance || 0))).toLocaleString('en-IN')}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 1 }}>Payment QR Code</Typography>
                <Box sx={{ border: '1px solid #E2E8F0', borderRadius: 3, p: 2, bgcolor: '#F8FAFC', textAlign: 'center' }}>
                  <img src={qrUrl} alt="QR" style={{ maxWidth: 200, width: '100%', height: 'auto', borderRadius: 8 }} />
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setApproveOpen(false)} sx={{ borderRadius: 3 }}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <CheckCircle />}
            onClick={handleApprove}
            disabled={saving}
            sx={{ bgcolor: '#059669', borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 800 }}>Reject Request?</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Avatar sx={{ bgcolor: '#FEE2E2', color: '#DC2626', width: 56, height: 56, mx: 'auto', mb: 2 }}><Close sx={{ fontSize: 28 }} /></Avatar>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Are you sure you want to reject <strong>{selectedRequest?.name}</strong>'s check-in request? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 1 }}>
          <Button onClick={() => setRejectOpen(false)} variant="outlined" sx={{ borderRadius: 3 }}>Cancel</Button>
          <Button color="error" variant="contained" startIcon={saving ? <CircularProgress size={16} /> : <Close />} onClick={handleReject} disabled={saving} sx={{ borderRadius: 3 }}>
            Yes, Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 800 }}>Delete Request</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Avatar sx={{ bgcolor: '#FEE2E2', color: '#DC2626', width: 56, height: 56, mx: 'auto', mb: 2 }}><Delete sx={{ fontSize: 28 }} /></Avatar>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Are you sure you want to delete this request from <strong>{selectedRequest?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 1 }}>
          <Button onClick={() => setDeleteOpen(false)} variant="outlined" sx={{ borderRadius: 3 }}>Cancel</Button>
          <Button color="error" variant="contained" startIcon={saving ? <CircularProgress size={16} /> : <Delete />} onClick={handleDelete} disabled={saving} sx={{ borderRadius: 3 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TenantRequests;
