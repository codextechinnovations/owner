import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Avatar,
  Chip,
  TextField,
  Grid,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Skeleton,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack,
  Share,
  PersonAdd,
  Phone,
  WhatsApp,
  Edit,
  Save,
  Cancel,
  PersonRemove,
  Search,
  Add,
  MeetingRoom,
  Bed,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { roomService, tenantService } from '../services/services';
import { normalizeTenant } from '../utils/tenantHelpers';
import { colors } from '../theme';

const SHARING_OPTIONS = [
  { label: 'Single', capacity: 1 },
  { label: 'Double', capacity: 2 },
  { label: 'Triple', capacity: 3 },
  { label: 'Four', capacity: 4 },
  { label: 'Five', capacity: 5 },
  { label: 'Six', capacity: 6 },
  { label: 'Seven', capacity: 7 },
  { label: 'Eight', capacity: 8 },
  { label: 'Nine', capacity: 9 },
];

const FLOOR_OPTIONS = [
  'Ground Floor',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
  '4th Floor',
  '5th Floor',
  '6th Floor',
  '7th Floor',
  '8th Floor',
  '9th Floor',
  '10th Floor',
];

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedPg } = useAuth();

  const [room, setRoom] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vacantOpen, setVacantOpen] = useState(false);
  const [markingVacant, setMarkingVacant] = useState(false);

  const capitalize = (s) => {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatFloorLabel = (floor) => {
    if (!floor && floor !== 0) return 'Ground Floor';
    const str = String(floor).trim();
    const matched = FLOOR_OPTIONS.find((f) => f.toLowerCase() === str.toLowerCase());
    if (matched) return matched;
    const numeric = parseInt(str, 10);
    if (!isNaN(numeric)) {
      return FLOOR_OPTIONS[numeric] || `${numeric} Floor`;
    }
    return str;
  };

  const parseFloorValue = (floorLabel) => {
    const matched = FLOOR_OPTIONS.find((f) => f.toLowerCase() === String(floorLabel).toLowerCase());
    return matched || floorLabel;
  };

  const loadRoomDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await roomService.getById(id);
      const responseData = res?.data?.data || res?.data || res;
      if (!responseData) {
        setError('Room not found');
        return;
      }
      const r = responseData.room || responseData;
      const t = responseData.tenants || [];
      setRoom(r);
      setTenants(Array.isArray(t) ? t.map(normalizeTenant) : []);
      setEditForm({
        roomNumber: r.roomNumber || r.room_number || '',
        unitType: (r.unitType || 'ROOM').toUpperCase(),
        floor: formatFloorLabel(r.floor),
        type: capitalize(r.type || r.roomType || 'single'),
        capacity: String(r.capacity || 1),
        rentPerBed: String(r.rentPerBed || r.rent_per_bed || r.monthlyRent || 0),
        dailyRent: String(r.dailyRent || 0),
      });
    } catch (err) {
      console.error('Failed to load room details:', err);
      setError('Failed to load room details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRoomDetails();
  }, [loadRoomDetails]);

  const handleSaveRoom = async () => {
    if (!id) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const selected = SHARING_OPTIONS.find((s) => s.label === editForm.type);
      const payload = {
        roomNumber: editForm.roomNumber?.trim(),
        floor: parseFloorValue(editForm.floor),
        type: editForm.type?.toLowerCase(),
        roomType: editForm.type?.toLowerCase(),
        capacity: selected ? selected.capacity : parseInt(editForm.capacity) || 1,
        rentPerBed: parseFloat(editForm.rentPerBed) || 0,
        dailyRent: parseFloat(editForm.dailyRent) || 0,
      };
      await roomService.update(id, payload);
      setIsEditing(false);
      setSuccess('Room details updated successfully');
      loadRoomDetails();
    } catch (err) {
      console.error('Save room error:', err);
      setError(err.response?.data?.message || 'Failed to update room details');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!room) return;
    setEditForm({
      roomNumber: room.roomNumber || room.room_number || '',
      unitType: (room.unitType || 'ROOM').toUpperCase(),
      floor: formatFloorLabel(room.floor),
      type: capitalize(room.type || room.roomType || 'single'),
      capacity: String(room.capacity || 1),
      rentPerBed: String(room.rentPerBed || room.rent_per_bed || room.monthlyRent || 0),
      dailyRent: String(room.dailyRent || 0),
    });
    setIsEditing(false);
  };

  const handleMarkVacant = async () => {
    if (!tenants.length) return;
    setMarkingVacant(true);
    try {
      for (const tenant of tenants) {
        const tenantId = tenant._id || tenant.id;
        if (!tenantId) continue;
        await tenantService.update(tenantId, { status: 'left' });
      }
      setVacantOpen(false);
      loadRoomDetails();
    } catch (err) {
      console.error('Failed to mark room vacant:', err);
      setError('Failed to mark room vacant');
    } finally {
      setMarkingVacant(false);
    }
  };

  const handleCall = (phone) => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone) => {
    if (!phone) return;
    const clean = String(phone).replace(/\D/g, '');
    const url = `https://wa.me/+91${clean}`;
    window.open(url, '_blank');
  };

  const handleShareRoom = () => {
    if (!room) return;
    const text = `Room ${room.roomNumber || room.room_number} - ${capitalize(room.type || room.roomType)} sharing, ${formatCurrency(room.rentPerBed || room.rent_per_bed)}/bed`;
    if (navigator.share) {
      navigator.share({ title: 'Room Details', text });
    } else {
      navigator.clipboard.writeText(text);
      setSuccess('Room details copied to clipboard');
    }
  };

  const handleAddDues = (tenant) => {
    navigate('/payments', { state: { tenantId: tenant._id || tenant.id, amount: tenant.dues } });
  };

  const filteredTenants = tenants.filter((t) => {
    const term = search.toLowerCase();
    return (t.name || '').toLowerCase().includes(term) || (t.phone || '').includes(term);
  });

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  if (!room) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Room not found'}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/rooms')} sx={{ mt: 2 }}>
          Back to Rooms
        </Button>
      </Box>
    );
  }

  const capacity = room.capacity || 0;
  const occupied = tenants.filter((t) => t.status === 'active').length;
  const roomNumber = room.roomNumber || room.room_number || 'N/A';
  const roomType = capitalize(room.type || room.roomType || 'Room');
  const rentPerBed = room.rentPerBed || room.rent_per_bed || 0;

  const renderTenantCard = (tenant) => (
    <Card key={tenant._id || tenant.id} sx={{ mb: 2, boxShadow: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          {tenant.photo ? (
            <Box
              component="img"
              src={tenant.photo}
              alt={tenant.name}
              sx={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <Avatar sx={{ bgcolor: colors.primary[700], width: 56, height: 56 }}>
              <Typography sx={{ fontWeight: 700 }}>{(tenant.name || '').slice(0, 2).toUpperCase()}</Typography>
            </Avatar>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {tenant.name || tenant.tenantName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rent: {formatCurrency(tenant.monthlyRent || tenant.rent)}/{capitalize(tenant.stayType || 'monthly')}
            </Typography>
            {(tenant.dues || 0) > 0 && (
              <Chip label={`Dues: ${formatCurrency(tenant.dues)}`} size="small" color="warning" sx={{ mt: 0.5 }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" sx={{ bgcolor: '#FFF7ED', color: colors.warning }} onClick={() => handleCall(tenant.phone)}>
              <Phone fontSize="small" />
            </IconButton>
            <IconButton size="small" sx={{ bgcolor: '#F0FDF4', color: colors.success }} onClick={() => handleWhatsApp(tenant.phone)}>
              <WhatsApp fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          fullWidth
          onClick={() => handleAddDues(tenant)}
        >
          Add Dues / Payment
        </Button>
      </CardContent>
    </Card>
  );

  const renderTenantsTab = () => (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Type to search tenants"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
      <Chip
        icon={<MeetingRoom />}
        label={`${filteredTenants.length} Current Tenants`}
        sx={{ mb: 2, fontWeight: 600, bgcolor: colors.primary[100], color: colors.primary[800] }}
      />
      {filteredTenants.length === 0 ? (
        <Alert severity="info">No tenants in this room</Alert>
      ) : (
        filteredTenants.map(renderTenantCard)
      )}
    </Box>
  );

  const renderDetailsTab = () => {
    const sharingLabel = editForm.type;
    const bedIcons = [];
    for (let i = 0; i < Math.min(capacity, 9); i++) {
      const occupiedBed = i < occupied;
      bedIcons.push(
        <Box
          key={i}
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: occupiedBed ? colors.success : colors.error,
            color: 'white',
          }}
        >
          <Bed fontSize="small" />
        </Box>
      );
    }

    return (
      <Box>
        <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[900]})`, color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                  Room {roomNumber}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {roomType} • {capacity} Beds • {formatFloorLabel(room.floor)}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                startIcon={<Share />}
                onClick={handleShareRoom}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              >
                Share
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {bedIcons}
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              {formatCurrency(rentPerBed)}/bed
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Chip
                icon={<Bed />}
                label={`${occupied}/${capacity} Occupied`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
              />
              <Button
                variant="contained"
                size="small"
                startIcon={<PersonAdd />}
                onClick={() => navigate('/tenants', { state: { roomId: id } })}
                sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white' }}
              >
                Add Tenant
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setDetailsExpanded(!detailsExpanded)}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Room Renting Details
              </Typography>
              <IconButton>{detailsExpanded ? <Cancel /> : <Edit />}</IconButton>
            </Box>

            {detailsExpanded && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Room Name"
                    value={editForm.roomNumber}
                    onChange={(e) => setEditForm({ ...editForm, roomNumber: e.target.value })}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Unit Type"
                    value={editForm.unitType}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Floor</InputLabel>
                    <Select
                      value={editForm.floor}
                      label="Floor"
                      onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })}
                      disabled={!isEditing}
                    >
                      {FLOOR_OPTIONS.map((f) => (
                        <MenuItem key={f} value={f}>{f}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Sharing Type</InputLabel>
                    <Select
                      value={`${sharingLabel} Sharing`}
                      label="Sharing Type"
                      onChange={(e) => {
                        const label = e.target.value.replace(' Sharing', '');
                        const selected = SHARING_OPTIONS.find((s) => s.label === label);
                        setEditForm({
                          ...editForm,
                          type: label,
                          capacity: String(selected?.capacity || 1),
                        });
                      }}
                      disabled={!isEditing}
                    >
                      {SHARING_OPTIONS.map((s) => (
                        <MenuItem key={s.label} value={`${s.label} Sharing`}>{s.label} Sharing</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Rent/Bed (₹)"
                    type="number"
                    value={editForm.rentPerBed}
                    onChange={(e) => setEditForm({ ...editForm, rentPerBed: e.target.value })}
                    disabled={!isEditing}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Daily Stay Charges (₹)"
                    type="number"
                    value={editForm.dailyRent}
                    onChange={(e) => setEditForm({ ...editForm, dailyRent: e.target.value })}
                    disabled={!isEditing}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  />
                </Grid>

                {isEditing ? (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button variant="outlined" startIcon={<Cancel />} onClick={handleCancel} disabled={saving}>
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={saving ? null : <Save />}
                        onClick={handleSaveRoom}
                        disabled={saving}
                        sx={{ background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})` }}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </Box>
                  </Grid>
                ) : (
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Edit />}
                      onClick={() => setIsEditing(true)}
                      sx={{ background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})` }}
                    >
                      Edit
                    </Button>
                  </Grid>
                )}
              </Grid>
            )}
          </CardContent>
        </Card>

        {occupied > 0 && (
          <Button
            variant="outlined"
            color="error"
            fullWidth
            startIcon={<PersonRemove />}
            onClick={() => setVacantOpen(true)}
            sx={{ mt: 3, py: 1.5 }}
          >
            Mark Room as Vacant
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/rooms')}>
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary }}>
          Room {roomNumber}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="fullWidth"
        >
          <Tab label="Room's Tenants" />
          <Tab label="Room Details" />
        </Tabs>
      </Card>

      {activeTab === 0 && renderTenantsTab()}
      {activeTab === 1 && renderDetailsTab()}

      <Dialog open={vacantOpen} onClose={() => setVacantOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark Room as Vacant</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This will mark all <strong>{tenants.length}</strong> tenant(s) in Room {roomNumber} as left. Continue?
          </Typography>
          <Alert severity="warning">This action cannot be undone.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVacantOpen(false)} disabled={markingVacant}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleMarkVacant}
            disabled={markingVacant}
            startIcon={markingVacant ? null : <PersonRemove />}
          >
            {markingVacant ? 'Processing...' : 'Mark Vacant'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoomDetail;
