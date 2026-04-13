import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { roomService, tenantRequestService } from '../services/services';

const statusStyles = {
  PENDING: { bg: `${colors.warning}20`, color: colors.warning },
  APPROVED: { bg: `${colors.success}20`, color: colors.success },
  REJECTED: { bg: `${colors.error}20`, color: colors.error },
};

const TenantRequests = () => {
  const { user, selectedPg } = useAuth();
  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [approveData, setApproveData] = useState({
    roomId: '',
    monthlyRent: '',
    securityDeposit: '',
    dailyRent: '',
  });

  useEffect(() => {
    fetchData();
  }, [selectedPg, user]);

  const fetchData = async () => {
    const ownerId = user?._id || user?.id;
    if (!ownerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [requestRes, roomRes] = await Promise.all([
        tenantRequestService.getOwnerRequests(ownerId),
        roomService.getAll({ pgId: selectedPg?._id }),
      ]);

      const requestList = Array.isArray(requestRes)
        ? requestRes
        : (Array.isArray(requestRes?.data) ? requestRes.data : []);

      const roomList = Array.isArray(roomRes)
        ? roomRes
        : (Array.isArray(roomRes?.rooms) ? roomRes.rooms : []);

      setRequests(selectedPg?._id ? requestList.filter((r) => String(r.pgId) === String(selectedPg._id)) : requestList);
      setRooms(roomList);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tenant requests.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const stayInfo = (request) => {
    const type = request?.stayType || 'monthly';
    const checkin = request?.checkinDate ? new Date(request.checkinDate) : null;
    const checkout = request?.checkoutDate ? new Date(request.checkoutDate) : null;
    const checkinLabel = checkin ? checkin.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    if (type === 'daily') {
      const checkoutLabel = checkout ? checkout.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
      const days = checkout && checkin ? Math.max(1, Math.ceil((checkout - checkin) / 86400000)) : 1;
      return {
        label: `Daily (${days} day${days > 1 ? 's' : ''})`,
        detail: `${checkinLabel} to ${checkoutLabel}`,
        days,
      };
    }

    const months = Number(request?.stayMonths) > 0 ? Number(request.stayMonths) : 1;
    return {
      label: `Monthly (${months} month${months > 1 ? 's' : ''})`,
      detail: `From ${checkinLabel}`,
      days: 0,
    };
  };

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

  const availableRooms = useMemo(() => {
    return rooms.filter((room) => {
      const occupied = Number(room.occupied_beds || room.occupiedBeds || 0);
      const capacity = Number(room.capacity || room.maxOccupancy || 1);
      return occupied < capacity;
    });
  }, [rooms]);

  const sortedAvailableRooms = useMemo(() => {
    return [...availableRooms].sort((a, b) => {
      const aAvailable = Number(a.capacity || a.maxOccupancy || 1) - Number(a.occupied_beds || a.occupiedBeds || 0);
      const bAvailable = Number(b.capacity || b.maxOccupancy || 1) - Number(b.occupied_beds || b.occupiedBeds || 0);
      if (bAvailable !== aAvailable) return bAvailable - aAvailable;
      return String(a.roomNumber || a.room_number || '').localeCompare(String(b.roomNumber || b.room_number || ''), undefined, { numeric: true });
    });
  }, [availableRooms]);

  const tabCounts = useMemo(() => ({
    ALL: requests.length,
    PENDING: requests.filter((req) => (req.status || 'PENDING') === 'PENDING').length,
    APPROVED: requests.filter((req) => req.status === 'APPROVED').length,
    REJECTED: requests.filter((req) => req.status === 'REJECTED').length,
  }), [requests]);

  const getRoomAvailabilityLabel = (room) => {
    const occupied = Number(room.occupied_beds || room.occupiedBeds || 0);
    const capacity = Number(room.capacity || room.maxOccupancy || 1);
    const available = Math.max(0, capacity - occupied);
    return `${available}/${capacity} beds`;
  };

  const handleOpenApprove = (request) => {
    const suggestedRoomId = sortedAvailableRooms[0]?._id || '';
    setSelectedRequest(request);
    setApproveData({ roomId: suggestedRoomId, monthlyRent: '', securityDeposit: '', dailyRent: '' });
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

    const ownerId = user?._id || user?.id;
    if (!ownerId) {
      setError('Owner information missing. Please re-login and try again.');
      return;
    }

    const stay = stayInfo(selectedRequest);
    const isDaily = selectedRequest?.stayType === 'daily';
    const rentValue = isDaily
      ? Number(approveData.dailyRent || 0) * stay.days
      : Number(approveData.monthlyRent || 0);

    if (rentValue <= 0) {
      setError(isDaily ? 'Enter a valid daily rent to continue.' : 'Enter monthly rent to continue.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await tenantRequestService.updateStatus(selectedRequest._id, {
        status: 'APPROVED',
        owner_id: ownerId,
        roomId: approveData.roomId,
        monthlyRent: rentValue,
        advance: Number(approveData.securityDeposit || 0),
        invoice: {
          monthlyRent: rentValue,
          securityDeposit: Number(approveData.securityDeposit || 0),
          billingMonth: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
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

  const handleReject = async (request) => {
    const ownerId = user?._id || user?.id;
    if (!ownerId) {
      setError('Owner information missing. Please re-login and try again.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await tenantRequestService.updateStatus(request._id, {
        status: 'REJECTED',
        owner_id: ownerId,
      });
      setSuccess('Request rejected successfully.');
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
            Tenant Requests
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            {filteredRequests.length} shown of {requests.length} total request{requests.length === 1 ? '' : 's'}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card sx={{ mb: 2 }}>
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
          />
        </CardContent>
      </Card>

      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 780 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.border.main }}>
                <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Stay Plan</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((__, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                      No tenant requests found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => {
                  const stay = stayInfo(request);
                  const statusStyle = statusStyles[request.status] || { bg: colors.border.main, color: colors.text.secondary };

                  return (
                    <TableRow key={request._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${colors.primary[700]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Person sx={{ fontSize: 18, color: colors.primary[700] }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{request.name}</Typography>
                            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                              Requested {new Date(request.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{request.phone}</Typography>
                        <Typography variant="caption" sx={{ color: colors.text.secondary }}>{request.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={stay.label} sx={{ bgcolor: `${colors.primary[700]}15`, color: colors.primary[700], fontWeight: 500, mb: 0.5 }} />
                        <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block' }}>{stay.detail}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status || 'PENDING'}
                          size="small"
                          sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => { setSelectedRequest(request); setDetailOpen(true); }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: colors.success }} onClick={() => handleOpenApprove(request)} disabled={saving}>
                          <CheckCircle fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: colors.error }} onClick={() => handleReject(request)} disabled={saving}>
                          <Close fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: colors.error }} onClick={() => { setSelectedRequest(request); setDeleteOpen(true); }} disabled={saving}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.text.secondary, mb: 1 }}>Personal</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}><Person sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />{selectedRequest.name}</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}><Phone sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />{selectedRequest.phone}</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}><Email sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />{selectedRequest.email}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.text.secondary, mb: 1 }}>Stay</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <Hotel sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                  {stayInfo(selectedRequest).label}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <CalendarToday sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                  {stayInfo(selectedRequest).detail}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <Home sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                  Status: {selectedRequest.status || 'PENDING'}
                </Typography>
              </Grid>

              <Grid item xs={12}><Divider /></Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.text.secondary, mb: 1 }}>Address</Typography>
                <Typography variant="body2">{selectedRequest.address || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.text.secondary, mb: 1 }}>Occupation</Typography>
                <Typography variant="body2">{selectedRequest.occupation || 'N/A'}</Typography>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>{selectedRequest.occupationAddress || ''}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={approveOpen} onClose={() => setApproveOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Request</DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <Alert severity="info">
                  {selectedRequest.name} - {stayInfo(selectedRequest).label} ({stayInfo(selectedRequest).detail})
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                    Available rooms: {sortedAvailableRooms.length}
                  </Typography>
                  {!!approveData.roomId && (
                    <Chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      label={`Auto-selected ${sortedAvailableRooms.find((room) => room._id === approveData.roomId)?.roomNumber || sortedAvailableRooms.find((room) => room._id === approveData.roomId)?.room_number || ''}`}
                    />
                  )}
                </Box>
                <FormControl fullWidth>
                  <InputLabel>Assign Room</InputLabel>
                  <Select
                    value={approveData.roomId}
                    label="Assign Room"
                    onChange={(e) => setApproveData((prev) => ({ ...prev, roomId: e.target.value }))}
                  >
                    {sortedAvailableRooms.map((room) => {
                      return (
                        <MenuItem key={room._id} value={room._id}>
                          <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                            <Typography variant="body2">Room {room.roomNumber || room.room_number}</Typography>
                            <Chip size="small" label={getRoomAvailabilityLabel(room)} sx={{ fontWeight: 600 }} />
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>

              {selectedRequest.stayType === 'daily' ? (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Daily Rent (INR)"
                      type="number"
                      value={approveData.dailyRent}
                      onChange={(e) => setApproveData((prev) => ({ ...prev, dailyRent: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Security Deposit (Optional)"
                      type="number"
                      value={approveData.securityDeposit}
                      onChange={(e) => setApproveData((prev) => ({ ...prev, securityDeposit: e.target.value }))}
                    />
                  </Grid>
                </>
              ) : (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Monthly Rent (INR)"
                      type="number"
                      value={approveData.monthlyRent}
                      onChange={(e) => setApproveData((prev) => ({ ...prev, monthlyRent: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Security Deposit (INR)"
                      type="number"
                      value={approveData.securityDeposit}
                      onChange={(e) => setApproveData((prev) => ({ ...prev, securityDeposit: e.target.value }))}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleApprove} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : <CheckCircle />}>
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Request</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Are you sure you want to delete this request from {selectedRequest?.name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : <Delete />}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TenantRequests;
