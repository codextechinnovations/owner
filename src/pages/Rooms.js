import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  MeetingRoom,
  Person,
  Hotel,
  Groups,
  FourK,
  Close,
  Save,
  DeleteSweep,
  CheckCircle,
  Warning,
  Bed,
  CurrencyRupee,
  ArrowForward,
  Download,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { roomService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { exportToCsv } from '../utils/exportHelpers';

const roomTypes = [
  { value: 'single', label: 'Single Sharing', icon: <Person />, beds: 1 },
  { value: 'double', label: 'Double Sharing', icon: <Groups />, beds: 2 },
  { value: 'triple', label: 'Triple Sharing', icon: <Hotel />, beds: 3 },
  { value: 'four', label: '4 Sharing', icon: <FourK />, beds: 4 },
];

const initialSingleForm = {
  roomNumber: '',
  type: 'single',
  floor: '1',
  capacity: 1,
  rentPerBed: '',
  description: '',
  ac: false,
  attachedBathroom: false,
  balcony: false,
};

const Rooms = () => {
  const navigate = useNavigate();
  const { selectedPg } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [floorFilter, setFloorFilter] = useState('All Floors');
  const [expandedId, setExpandedId] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formData, setFormData] = useState(initialSingleForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchRooms();
  }, [selectedPg]);

  const fetchRooms = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const getTotalBeds = (room) => Number(room.capacity || 0);
  const getOccupiedBeds = (room) => Number(room.occupied_beds || room.occupiedBeds || 0);
  const getAvailableBeds = (room) => getTotalBeds(room) - getOccupiedBeds(room);

  const getRoomStatus = (room) => {
    const occupied = getOccupiedBeds(room);
    const capacity = getTotalBeds(room);
    if (occupied === 0) return 'Vacant';
    if (occupied === capacity) return 'Occupied';
    return 'Partial';
  };

  const getFloorRank = (floor) => {
    if (!floor) return 999;
    const lower = String(floor).toLowerCase();
    if (lower.includes('ground')) return 0;
    const match = String(floor).match(/(\d+)/);
    return match ? parseInt(match[1]) : 999;
  };

  const getRoomNumberValue = (roomNumber) => {
    if (!roomNumber) return 0;
    const match = String(roomNumber).match(/(\d+)/);
    return match ? parseInt(match[1]) : roomNumber;
  };

  const floorOptions = [
    'All Floors',
    ...Array.from(new Set(rooms.map((r) => r.floor || '1'))).sort(
      (a, b) => getFloorRank(a) - getFloorRank(b)
    ),
  ];

  const filteredRooms = rooms
    .filter((room) => {
      const occupied = getOccupiedBeds(room);
      const capacity = getTotalBeds(room);
      let statusMatch = true;
      if (filter === 'Vacant') statusMatch = occupied === 0;
      else if (filter === 'Partial') statusMatch = occupied > 0 && occupied < capacity;
      else if (filter === 'Occupied') statusMatch = occupied === capacity;

      const floorMatch = floorFilter === 'All Floors' || String(room.floor) === String(floorFilter);
      const searchMatch =
        (room.roomNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (room.type || '').toLowerCase().includes(search.toLowerCase());

      return statusMatch && floorMatch && searchMatch;
    })
    .sort((a, b) => {
      const floorDiff = getFloorRank(a.floor) - getFloorRank(b.floor);
      if (floorDiff !== 0) return floorDiff;
      const roomDiff = getRoomNumberValue(a.roomNumber) - getRoomNumberValue(b.roomNumber);
      if (typeof roomDiff === 'number' && !isNaN(roomDiff)) return roomDiff;
      return String(a.roomNumber || '').localeCompare(String(b.roomNumber || ''));
    });

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => getOccupiedBeds(r) === getTotalBeds(r) && getTotalBeds(r) !== 0).length;
  const partialRooms = rooms.filter((r) => getOccupiedBeds(r) > 0 && getOccupiedBeds(r) < getTotalBeds(r)).length;
  const vacantRooms = rooms.filter((r) => getOccupiedBeds(r) === 0).length;
  const totalRevenue = rooms.reduce((sum, r) => sum + getOccupiedBeds(r) * (r.rentPerBed || r.rent_per_bed || 0), 0);

  const handleViewDetail = (room) => {
    navigate(`/rooms/${room._id || room.id}`);
  };

  const handleAddOpen = () => {
    setFormData(initialSingleForm);
    setFormError('');
    setFormSuccess('');
    setAddOpen(true);
  };

  const handleEditOpen = (room) => {
    setSelectedRoom(room);
    setFormData({
      roomNumber: room.roomNumber || '',
      type: room.type || 'single',
      floor: room.floor || '1',
      capacity: room.capacity || 1,
      rentPerBed: room.rentPerBed || room.rent_per_bed || '',
      description: room.description || '',
      ac: room.ac || false,
      attachedBathroom: room.attachedBathroom || false,
      balcony: room.balcony || false,
    });
    setFormError('');
    setFormSuccess('');
    setEditOpen(true);
  };

  const handleDeleteOpen = (room) => {
    setSelectedRoom(room);
    setDeleteOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (type) => {
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      if (type === 'add') {
        await roomService.create({ ...formData, pgId: selectedPg?._id });
        setFormSuccess('Room added successfully!');
        setTimeout(() => {
          setAddOpen(false);
          fetchRooms();
        }, 1500);
      } else if (type === 'edit') {
        await roomService.update(selectedRoom._id, formData);
        setFormSuccess('Room updated successfully!');
        setTimeout(() => {
          setEditOpen(false);
          fetchRooms();
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
      await roomService.delete(selectedRoom._id);
      setDeleteOpen(false);
      fetchRooms();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to delete room.');
    } finally {
      setFormLoading(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'single': return { bg: `${colors.primary[700]}15`, color: colors.primary[700] };
      case 'double': return { bg: `${colors.accent.blue}15`, color: colors.accent.blue };
      case 'triple': return { bg: `${colors.accent.purple}15`, color: colors.accent.purple };
      case 'four': return { bg: `${colors.accent.amber}15`, color: colors.accent.amber };
      default: return { bg: colors.border.main, color: colors.text.secondary };
    }
  };

  const getTypeIcon = (type) => {
    const typeInfo = roomTypes.find((r) => r.value === type);
    return typeInfo?.icon || <MeetingRoom />;
  };

  const getStatusStyle = (status) => {
    if (status === 'Occupied') return { bg: '#DCFCE7', color: '#15803D', bar: '#16A34A' };
    if (status === 'Partial') return { bg: '#DBEAFE', color: '#1E40AF', bar: '#3B82F6' };
    return { bg: '#FEF3C7', color: '#92400E', bar: '#F59E0B' };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleExport = () => {
    exportToCsv('rooms', [
      { label: 'Room', key: 'roomNumber' },
      { label: 'Floor', key: 'floor' },
      { label: 'Type', key: 'roomType' },
      { label: 'Total Beds', key: (r) => getTotalBeds(r) },
      { label: 'Occupied', key: (r) => getOccupiedBeds(r) },
      { label: 'Available', key: (r) => getAvailableBeds(r) },
      { label: 'Rent', key: 'rent' },
      { label: 'Status', key: (r) => getStatus(r).label },
    ], filteredRooms);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: colors.text.primary, mb: 0.5 }}>
            Rooms
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            {rooms.length} total, {rooms.reduce((acc, r) => acc + getAvailableBeds(r), 0)} beds available
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={handleExport}
            disabled={filteredRooms.length === 0}
            sx={{ borderRadius: 3 }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DeleteSweep />}
            onClick={() => navigate('/rooms/bulk-add')}
            sx={{ borderRadius: 3, borderColor: colors.accent.purple, color: colors.accent.purple }}
          >
            Bulk
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={handleAddOpen}
            sx={{ borderRadius: 3, background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})` }}
          >
            Add Room
          </Button>
        </Box>
      </Box>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: 'Total', value: totalRooms, color: '#111827' },
          { label: 'Occupied', value: occupiedRooms, color: '#16A34A' },
          { label: 'Partial', value: partialRooms, color: '#3B82F6' },
          { label: 'Vacant', value: vacantRooms, color: '#F97316' },
        ].map((s) => (
          <Grid item xs={3} key={s.label}>
            <Card sx={{ borderRadius: 3, textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 2, borderRadius: 4, background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[900]})`, color: 'white' }}>
        <CardContent sx={{ py: 2.5 }}>
          <Typography variant="body2" sx={{ opacity: 0.85, mb: 0.5 }}>Monthly Revenue</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85, mt: 0.5, display: 'block' }}>
            From {occupiedRooms} fully occupied room{occupiedRooms === 1 ? '' : 's'}
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2, borderRadius: 4 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search by room number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: colors.text.secondary }} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select value={filter} label="Status" onChange={(e) => setFilter(e.target.value)} sx={{ borderRadius: 3 }}>
                {['All', 'Vacant', 'Partial', 'Occupied'].map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Floor</InputLabel>
              <Select value={floorFilter} label="Floor" onChange={(e) => setFloorFilter(e.target.value)} sx={{ borderRadius: 3 }}>
                {floorOptions.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
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
      ) : filteredRooms.length === 0 ? (
        <Card sx={{ borderRadius: 4, textAlign: 'center', py: 6 }}>
          <Avatar sx={{ bgcolor: '#F3F4F6', color: '#9CA3AF', width: 64, height: 64, mx: 'auto', mb: 2 }}>
            <MeetingRoom sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" sx={{ color: '#111827', fontWeight: 700, mb: 0.5 }}>No rooms found</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>Add your first room to get started</Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filteredRooms.map((room) => {
            const id = room._id || room.id;
            const status = getRoomStatus(room);
            const statusStyle = getStatusStyle(status);
            const occupied = getOccupiedBeds(room);
            const capacity = getTotalBeds(room);
            const isExpanded = expandedId === id;
            const progress = capacity > 0 ? (occupied / capacity) * 100 : 0;

            return (
              <Grid item xs={12} md={6} key={id}>
                <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #F3F4F6', cursor: 'pointer' }} onClick={() => toggleExpand(id)}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>Room {room.roomNumber || room.room_number}</Typography>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>{room.type || 'Room'} • {capacity} Bed{capacity !== 1 ? 's' : ''}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          size="small"
                          label={status.toUpperCase()}
                          sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 700, fontSize: '10px', height: 22 }}
                        />
                        <IconButton size="small" sx={{ color: '#6B7280', p: 0.5 }} onClick={(e) => { e.stopPropagation(); toggleExpand(id); }}>
                          {isExpanded ? <Close fontSize="small" /> : <ArrowForward fontSize="small" />}
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 1.5, borderTop: '1px solid #F3F4F6' }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', flex: 1, gap: 0.3 }}>
                        {Array.from({ length: capacity }).map((_, index) => (
                          <Bed key={index} sx={{ fontSize: 16, color: index < occupied ? '#16A34A' : '#EF4444' }} />
                        ))}
                      </Box>
                      <Typography variant="body2" sx={{ color: '#374151', fontWeight: 600 }}>{occupied}/{capacity}</Typography>
                    </Box>

                    {isExpanded && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #F3F4F6' }}>
                        <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, mb: 1, display: 'block' }}>Bed Occupancy</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#FEE2E2',
                            '& .MuiLinearProgress-bar': { bgcolor: statusStyle.bar, borderRadius: 4 },
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#6B7280', mt: 0.5, display: 'block' }}>
                          {occupied} out of {capacity} beds filled
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2, p: 1.5, bgcolor: '#F5F3FF', borderRadius: 3 }}>
                          <Avatar sx={{ bgcolor: '#E0E7FF', color: '#7C3AED', width: 34, height: 34 }}>
                            <CurrencyRupee fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>Rent Per Bed</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#111827' }}>
                              ₹{Number(room.rentPerBed || room.rent_per_bed || 0).toLocaleString('en-IN')}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            endIcon={<ArrowForward />}
                            onClick={(e) => { e.stopPropagation(); handleViewDetail(room); }}
                            sx={{ borderRadius: 3, background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})`, textTransform: 'none', fontWeight: 700 }}
                          >
                            View Details
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={(e) => { e.stopPropagation(); handleEditOpen(room); }}
                            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
                          >
                            Edit
                          </Button>
                        </Box>

                        {status === 'Vacant' && (
                          <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={(e) => { e.stopPropagation(); handleDeleteOpen(room); }}
                            sx={{ mt: 1.5, borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
                          >
                            Delete Room
                          </Button>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add Room Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
          Add New Room
          <IconButton onClick={() => setAddOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{formSuccess}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Room Number" name="roomNumber" value={formData.roomNumber} onChange={handleFormChange} required placeholder="e.g., 101, A1" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Floor" name="floor" type="number" value={formData.floor} onChange={handleFormChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Capacity (Beds)" name="capacity" type="number" value={formData.capacity} onChange={handleFormChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Rent per Bed (₹)" name="rentPerBed" type="number" value={formData.rentPerBed} onChange={handleFormChange} required />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Room Type</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {roomTypes.map((type) => (
                  <Chip
                    key={type.value}
                    icon={type.icon}
                    label={type.label}
                    onClick={() => setFormData({ ...formData, type: type.value, capacity: type.beds })}
                    color={formData.type === type.value ? 'primary' : 'default'}
                    variant={formData.type === type.value ? 'filled' : 'outlined'}
                    sx={{ cursor: 'pointer', borderRadius: 2 }}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Amenities</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {[
                  { name: 'ac', label: 'AC' },
                  { name: 'attachedBathroom', label: 'Attached Bathroom' },
                  { name: 'balcony', label: 'Balcony' },
                ].map((amenity) => (
                  <Box key={amenity.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <input type="checkbox" id={`add-${amenity.name}`} name={amenity.name} checked={formData[amenity.name]} onChange={handleFormChange} style={{ width: 16, height: 16 }} />
                    <Typography variant="body2" component="label" htmlFor={`add-${amenity.name}`} sx={{ cursor: 'pointer' }}>{amenity.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Description" name="description" value={formData.description} onChange={handleFormChange} multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddOpen(false)} sx={{ borderRadius: 3 }}>Cancel</Button>
          <Button variant="contained" startIcon={formLoading ? <CircularProgress size={20} /> : <Save />} onClick={() => handleSubmit('add')} disabled={formLoading} sx={{ borderRadius: 3 }}>
            Add Room
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
          Edit Room {selectedRoom?.roomNumber}
          <IconButton onClick={() => setEditOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{formSuccess}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Room Number" name="roomNumber" value={formData.roomNumber} onChange={handleFormChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Floor" name="floor" type="number" value={formData.floor} onChange={handleFormChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Capacity (Beds)" name="capacity" type="number" value={formData.capacity} onChange={handleFormChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Rent per Bed (₹)" name="rentPerBed" type="number" value={formData.rentPerBed} onChange={handleFormChange} required />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Amenities</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {[
                  { name: 'ac', label: 'AC' },
                  { name: 'attachedBathroom', label: 'Attached Bathroom' },
                  { name: 'balcony', label: 'Balcony' },
                ].map((amenity) => (
                  <Box key={amenity.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <input type="checkbox" id={`edit-${amenity.name}`} name={amenity.name} checked={formData[amenity.name]} onChange={handleFormChange} style={{ width: 16, height: 16 }} />
                    <Typography variant="body2" component="label" htmlFor={`edit-${amenity.name}`} sx={{ cursor: 'pointer' }}>{amenity.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ borderRadius: 3 }}>Cancel</Button>
          <Button variant="contained" startIcon={formLoading ? <CircularProgress size={20} /> : <Save />} onClick={() => handleSubmit('edit')} disabled={formLoading} sx={{ borderRadius: 3 }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800 }}>
          <Warning sx={{ color: colors.error }} />
          Delete Room
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete <strong>Room {selectedRoom?.roomNumber}</strong>?
          </Typography>
          {selectedRoom?.occupied_beds > 0 && (
            <Alert severity="warning" sx={{ borderRadius: 3, mb: 2 }}>
              This room has {selectedRoom.occupied_beds} tenant(s). Please vacate them before deleting.
            </Alert>
          )}
          <Alert severity="error" sx={{ borderRadius: 3 }}>This action cannot be undone.</Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ borderRadius: 3 }}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={formLoading ? <CircularProgress size={20} /> : <Delete />} onClick={handleDelete} disabled={formLoading || selectedRoom?.occupied_beds > 0} sx={{ borderRadius: 3 }}>
            Delete Room
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Rooms;
