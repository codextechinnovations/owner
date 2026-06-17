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
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Paper,
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { roomService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

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

const initialBulkForm = {
  single: { count: 0, rentPerBed: '', floor: '1' },
  double: { count: 0, rentPerBed: '', floor: '1' },
  triple: { count: 0, rentPerBed: '', floor: '1' },
  four: { count: 0, rentPerBed: '', floor: '1' },
};

const Rooms = () => {
  const navigate = useNavigate();
  const { selectedPg } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState(initialSingleForm);
  const [bulkForm, setBulkForm] = useState(initialBulkForm);
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
      setRooms(response.data || []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setRooms([
        { _id: 'r1', roomNumber: '101', type: 'single', floor: '1', capacity: 1, occupied_beds: 0, rentPerBed: 8000, ac: true, attachedBathroom: true, balcony: false },
        { _id: 'r2', roomNumber: '102', type: 'double', floor: '1', capacity: 2, occupied_beds: 1, rentPerBed: 6000, ac: true, attachedBathroom: false, balcony: false },
        { _id: 'r3', roomNumber: '103', type: 'double', floor: '1', capacity: 2, occupied_beds: 2, rentPerBed: 6000, ac: false, attachedBathroom: false, balcony: false },
        { _id: 'r4', roomNumber: '201', type: 'triple', floor: '2', capacity: 3, occupied_beds: 1, rentPerBed: 5000, ac: true, attachedBathroom: true, balcony: true },
        { _id: 'r5', roomNumber: '202', type: 'triple', floor: '2', capacity: 3, occupied_beds: 0, rentPerBed: 5000, ac: true, attachedBathroom: true, balcony: true },
        { _id: 'r6', roomNumber: '301', type: 'four', floor: '3', capacity: 4, occupied_beds: 2, rentPerBed: 4000, ac: false, attachedBathroom: false, balcony: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetail = (room) => {
    setSelectedRoom(room);
    setDetailOpen(true);
  };

  const handleAddOpen = () => {
    setFormData(initialSingleForm);
    setFormError('');
    setFormSuccess('');
    setAddOpen(true);
  };

  const handleBulkOpen = () => {
    navigate('/rooms/bulk-add');
  };

  const handleEditOpen = (room) => {
    setSelectedRoom(room);
    setFormData({
      roomNumber: room.roomNumber || '',
      type: room.type || 'single',
      floor: room.floor || '1',
      capacity: room.capacity || 1,
      rentPerBed: room.rentPerBed || '',
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

  const handleBulkChange = (type, field, value) => {
    setBulkForm({
      ...bulkForm,
      [type]: { ...bulkForm[type], [field]: value },
    });
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
      } else if (type === 'bulk') {
        const roomsToCreate = [];
        Object.entries(bulkForm).forEach(([type, data]) => {
          if (data?.count > 0) {
            for (let i = 0; i < data.count; i++) {
              roomsToCreate.push({
                pgId: selectedPg?._id,
                type,
                floor: data.floor,
                capacity: roomTypes.find(r => r.value === type)?.beds || 1,
                rentPerBed: data.rentPerBed,
              });
            }
          }
        });

        if (roomsToCreate.length === 0) {
          setFormError('Please add at least one room.');
          setFormLoading(false);
          return;
        }

        for (const roomData of roomsToCreate) {
          await roomService.create(roomData);
        }
        setFormSuccess(`${roomsToCreate.length} rooms added successfully!`);
        setTimeout(() => {
          setBulkOpen(false);
          fetchRooms();
        }, 2000);
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
    const typeInfo = roomTypes.find(r => r.value === type);
    return typeInfo?.icon || <MeetingRoom />;
  };

  const filteredRooms = rooms.filter(
    (r) =>
      r.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
      r.type?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const getTotalBeds = (room) => room.capacity || 0;
  const getOccupiedBeds = (room) => room.occupied_beds || 0;
  const getAvailableBeds = (room) => getTotalBeds(room) - getOccupiedBeds(room);

  const tabRooms = tabValue === 0 ? filteredRooms : filteredRooms.filter(r => r.type === roomTypes[tabValue - 1]?.value);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
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
            startIcon={<DeleteSweep />}
            onClick={handleBulkOpen}
            sx={{ borderColor: colors.accent.purple, color: colors.accent.purple }}
          >
            Bulk
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={handleAddOpen}
            sx={{
              background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})`,
            }}
          >
            Add
          </Button>
        </Box>
      </Box>

      {/* Room Type Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {roomTypes.map((type) => {
          const count = rooms.filter(r => r.type === type.value).length;
          return (
            <Grid item xs={6} sm={3} key={type.value}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  border: tabValue === roomTypes.indexOf(type) + 1 ? `2px solid ${colors.primary[700]}` : '1px solid #e0e0e0',
                  '&:hover': { borderColor: colors.primary[700] },
                }}
                onClick={() => setTabValue(tabValue === roomTypes.indexOf(type) + 1 ? 0 : roomTypes.indexOf(type) + 1)}
              >
                <Avatar sx={{ bgcolor: `${getTypeColor(type.value).bg}`, color: getTypeColor(type.value).color }}>
                  {type.icon}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{count}</Typography>
                  <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                    {type.label}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <TextField
            placeholder="Search by room number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', sm: 300 } }}
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
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.border.main }}>
                <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Floor</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Beds (Occupied/Available)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rent/Bed</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amenities</TableCell>
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
              ) : tabRooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                      No rooms found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tabRooms.map((room) => (
                  <TableRow key={room._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: colors.primary[700], width: 40, height: 40 }}>
                          <MeetingRoom />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Room {room.roomNumber}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                            ID: {room._id?.slice(-6).toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getTypeIcon(room.type)}
                        label={room.type}
                        size="small"
                        sx={{
                          ...getTypeColor(room.type),
                          fontWeight: 500,
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">Floor {room.floor || '1'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {getOccupiedBeds(room)}/{getTotalBeds(room)}
                        </Typography>
                        <Chip
                          label={`${getAvailableBeds(room)} free`}
                          size="small"
                          sx={{
                            bgcolor: getAvailableBeds(room) > 0 ? `${colors.success}15` : `${colors.error}15`,
                            color: getAvailableBeds(room) > 0 ? colors.success : colors.error,
                            fontWeight: 500,
                            fontSize: '0.7rem',
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.primary[700] }}>
                        {formatCurrency(room.rentPerBed)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: colors.text.secondary }}>/bed/month</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {room.ac && <Chip label="AC" size="small" sx={{ bgcolor: `${colors.accent.blue}15`, color: colors.accent.blue, fontSize: '0.7rem' }} />}
                        {room.attachedBathroom && <Chip label="Attach" size="small" sx={{ bgcolor: `${colors.accent.green}15`, color: colors.accent.green, fontSize: '0.7rem' }} />}
                        {room.balcony && <Chip label="Balcony" size="small" sx={{ bgcolor: `${colors.accent.purple}15`, color: colors.accent.purple, fontSize: '0.7rem' }} />}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleViewDetail(room)}>
                        <MeetingRoom fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleEditOpen(room)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" sx={{ color: colors.error }} onClick={() => handleDeleteOpen(room)}>
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
          count={tabRooms.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Room Details</Typography>
          <IconButton onClick={() => setDetailOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRoom && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: colors.primary[700], width: 60, height: 60 }}>
                    <MeetingRoom sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>Room {selectedRoom.roomNumber}</Typography>
                    <Chip label={selectedRoom.type} size="small" sx={{ ...getTypeColor(selectedRoom.type), fontWeight: 500, textTransform: 'capitalize', mt: 0.5 }} />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>Floor</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>Floor {selectedRoom.floor || '1'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>Capacity</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedRoom.capacity} Beds</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>Occupied</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: colors.primary[700] }}>{getOccupiedBeds(selectedRoom)} Beds</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>Available</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: colors.success }}>{getAvailableBeds(selectedRoom)} Beds</Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>Rent per Bed</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: colors.primary[700] }}>{formatCurrency(selectedRoom.rentPerBed)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>Monthly Revenue</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: colors.success }}>{formatCurrency(selectedRoom.rentPerBed * getOccupiedBeds(selectedRoom))}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: colors.text.secondary }}>Amenities</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip icon={selectedRoom.ac ? <CheckCircle /> : <Close />} label="AC" color={selectedRoom.ac ? 'success' : 'default'} size="small" />
                  <Chip icon={selectedRoom.attachedBathroom ? <CheckCircle /> : <Close />} label="Attached Bathroom" color={selectedRoom.attachedBathroom ? 'success' : 'default'} size="small" />
                  <Chip icon={selectedRoom.balcony ? <CheckCircle /> : <Close />} label="Balcony" color={selectedRoom.balcony ? 'success' : 'default'} size="small" />
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Edit />} onClick={() => { setDetailOpen(false); handleEditOpen(selectedRoom); }}>Edit</Button>
        </DialogActions>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Add New Room</Typography>
          <IconButton onClick={() => setAddOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Room Number" name="roomNumber" value={formData.roomNumber} onChange={handleFormChange} required placeholder="e.g., 101, A1" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Floor" name="floor" type="number" value={formData.floor} onChange={handleFormChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Capacity (Beds)" name="capacity" type="number" value={formData.capacity} onChange={handleFormChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Rent per Bed (₹)" name="rentPerBed" type="number" value={formData.rentPerBed} onChange={handleFormChange} required />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Room Type</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {roomTypes.map((type) => (
                  <Chip
                    key={type.value}
                    icon={type.icon}
                    label={type.label}
                    onClick={() => setFormData({ ...formData, type: type.value, capacity: type.beds })}
                    color={formData.type === type.value ? 'primary' : 'default'}
                    variant={formData.type === type.value ? 'filled' : 'outlined'}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Amenities</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input type="checkbox" id="ac" name="ac" checked={formData.ac} onChange={handleFormChange} />
                  <label htmlFor="ac">AC</label>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input type="checkbox" id="attachedBathroom" name="attachedBathroom" checked={formData.attachedBathroom} onChange={handleFormChange} />
                  <label htmlFor="attachedBathroom">Attached Bathroom</label>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input type="checkbox" id="balcony" name="balcony" checked={formData.balcony} onChange={handleFormChange} />
                  <label htmlFor="balcony">Balcony</label>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" name="description" value={formData.description} onChange={handleFormChange} multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={formLoading ? <CircularProgress size={20} /> : <Save />} onClick={() => handleSubmit('add')} disabled={formLoading}>
            Add Room
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Edit Room {selectedRoom?.roomNumber}</Typography>
          <IconButton onClick={() => setEditOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Room Number" name="roomNumber" value={formData.roomNumber} onChange={handleFormChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Floor" name="floor" type="number" value={formData.floor} onChange={handleFormChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Capacity (Beds)" name="capacity" type="number" value={formData.capacity} onChange={handleFormChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Rent per Bed (₹)" name="rentPerBed" type="number" value={formData.rentPerBed} onChange={handleFormChange} required />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Amenities</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input type="checkbox" id="edit-ac" name="ac" checked={formData.ac} onChange={handleFormChange} />
                  <label htmlFor="edit-ac">AC</label>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input type="checkbox" id="edit-attachedBathroom" name="attachedBathroom" checked={formData.attachedBathroom} onChange={handleFormChange} />
                  <label htmlFor="edit-attachedBathroom">Attached Bathroom</label>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input type="checkbox" id="edit-balcony" name="balcony" checked={formData.balcony} onChange={handleFormChange} />
                  <label htmlFor="edit-balcony">Balcony</label>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={formLoading ? <CircularProgress size={20} /> : <Save />} onClick={() => handleSubmit('edit')} disabled={formLoading}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteSweep sx={{ color: colors.accent.purple }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Bulk Add Rooms</Typography>
          </Box>
          <IconButton onClick={() => setBulkOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Add multiple rooms at once. Enter the count and rent for each room type you want to create.
          </Alert>

          <Grid container spacing={3}>
            {roomTypes.map((type) => (
              <Grid item xs={12} md={6} key={type.value}>
                <Paper sx={{ p: 3, border: `2px solid ${bulkForm[type.value].count > 0 ? colors.primary[700] : colors.border.light}`, bgcolor: bulkForm[type.value].count > 0 ? `${colors.primary[700]}05` : 'transparent' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: getTypeColor(type.value).bg, color: getTypeColor(type.value).color }}>
                      {type.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{type.label}</Typography>
                      <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                        {type.beds} {type.beds === 1 ? 'bed' : 'beds'} per room
                      </Typography>
                    </Box>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Number of Rooms"
                        type="number"
                        value={bulkForm[type.value].count}
                        onChange={(e) => handleBulkChange(type.value, 'count', parseInt(e.target.value) || 0)}
                        inputProps={{ min: 0 }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Rent per Bed (₹)"
                        type="number"
                        value={bulkForm[type.value].rentPerBed}
                        onChange={(e) => handleBulkChange(type.value, 'rentPerBed', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Floor"
                        type="number"
                        value={bulkForm[type.value].floor}
                        onChange={(e) => handleBulkChange(type.value, 'floor', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                          Total: <strong>{bulkForm[type.value].count * type.beds} beds</strong>
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Summary */}
          <Box sx={{ mt: 3, p: 2, bgcolor: `${colors.accent.purple}10`, borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: colors.text.secondary }}>Total Rooms</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {Object.values(bulkForm).reduce((acc, r) => acc + r.count, 0)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: colors.text.secondary }}>Total Beds</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {Object.entries(bulkForm).reduce((acc, [type, data]) => {
                    const beds = roomTypes.find(r => r.value === type)?.beds || 1;
                    return acc + (data.count * beds);
                  }, 0)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBulkOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={formLoading ? <CircularProgress size={20} /> : <Save />}
            onClick={() => handleSubmit('bulk')}
            disabled={formLoading || Object.values(bulkForm).every(r => r.count === 0)}
            sx={{ background: `linear-gradient(135deg, ${colors.accent.purple}, ${colors.primary[700]})` }}
          >
            Add All Rooms
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning sx={{ color: colors.error }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Delete Room</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete <strong>Room {selectedRoom?.roomNumber}</strong>?
          </Typography>
          {selectedRoom?.occupied_beds > 0 && (
            <Alert severity="warning">
              This room has {selectedRoom.occupied_beds} tenant(s). Please vacate them before deleting.
            </Alert>
          )}
          <Alert severity="error" sx={{ mt: 2 }}>This action cannot be undone.</Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            startIcon={formLoading ? <CircularProgress size={20} /> : <Delete />}
            onClick={handleDelete}
            disabled={formLoading || selectedRoom?.occupied_beds > 0}
          >
            Delete Room
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Rooms;
