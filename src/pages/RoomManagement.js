import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import { Bed, Refresh, MeetingRoom, Hotel } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { roomService } from '../services/services';
import { colors } from '../theme';
import { getFloorRank, getRoomNumberValue, getRoomStatus } from '../utils/formatters';

const FILTERS = ['All', 'Vacant', 'Partial', 'Occupied'];

const RoomManagement = () => {
  const { selectedPg } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [floorFilter, setFloorFilter] = useState('All Floors');

  const loadRooms = useCallback(async () => {
    if (!selectedPg?._id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await roomService.getAll({ pgId: selectedPg._id });
      const data = res?.data?.data || res?.data || [];
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load rooms:', err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPg]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const floorOptions = [
    'All Floors',
    ...Array.from(new Set(rooms.map((r) => r.floor || '1'))).sort(
      (a, b) => getFloorRank(a) - getFloorRank(b)
    ),
  ];

  const filteredRooms = [...rooms]
    .filter((room) => {
      const status = getRoomStatus(room);
      const statusMatch = filter === 'All' || filter === status;
      const floorMatch = floorFilter === 'All Floors' || room.floor === floorFilter;
      return statusMatch && floorMatch;
    })
    .sort((a, b) => {
      const floorDiff = getFloorRank(a.floor) - getFloorRank(b.floor);
      if (floorDiff !== 0) return floorDiff;
      const roomA = getRoomNumberValue(a.roomNumber || a.room_number);
      const roomB = getRoomNumberValue(b.roomNumber || b.room_number);
      if (typeof roomA === 'number' && typeof roomB === 'number') return roomA - roomB;
      return String(a.roomNumber || a.room_number || '').localeCompare(String(b.roomNumber || b.room_number || ''));
    });

  const statusColor = (status) => {
    switch (status) {
      case 'Vacant':
        return { bg: '#FFF7ED', text: '#F97316', border: '#FDBA74' };
      case 'Occupied':
        return { bg: '#F0FDF4', text: '#16A34A', border: '#86EFAC' };
      case 'Partial':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
    }
  };

  const totalRooms = rooms.length;
  const vacantRooms = rooms.filter((r) => getRoomStatus(r) === 'Vacant').length;
  const occupiedRooms = rooms.filter((r) => getRoomStatus(r) === 'Occupied').length;
  const partialRooms = rooms.filter((r) => getRoomStatus(r) === 'Partial').length;
  const totalBeds = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const occupiedBeds = rooms.reduce((sum, r) => sum + (r.occupiedBeds || r.occupied_beds || 0), 0);
  const bedOccupancy = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const StatCard = ({ title, value, color }) => (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
            Room Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visual overview of room occupancy and bed status
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={loadRooms} disabled={loading}>
          Refresh
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><StatCard title="Total Rooms" value={totalRooms} color={colors.primary[700]} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Vacant" value={vacantRooms} color={colors.warning} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Partial" value={partialRooms} color={colors.info || colors.primary[500]} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Occupied" value={occupiedRooms} color={colors.success} /></Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Bed Occupancy: {bedOccupancy}%
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {FILTERS.map((f) => (
                <Chip
                  key={f}
                  label={f}
                  onClick={() => setFilter(f)}
                  color={filter === f ? 'primary' : 'default'}
                  variant={filter === f ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>
          <FormControl sx={{ minWidth: 160 }} size="small">
            <InputLabel>Floor</InputLabel>
            <Select value={floorFilter} label="Floor" onChange={(e) => setFloorFilter(e.target.value)}>
              {floorOptions.map((f) => (
                <MenuItem key={f} value={f}>{f}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {loading ? (
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={160} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {filteredRooms.map((room) => {
            const status = getRoomStatus(room);
            const color = statusColor(status);
            const occupied = room.occupiedBeds || room.occupied_beds || 0;
            const capacity = room.capacity || 0;
            return (
              <Grid item xs={12} sm={6} md={4} key={room._id || room.id}>
                <Card
                  sx={{
                    borderLeft: `4px solid ${color.border}`,
                    transition: '0.2s',
                    '&:hover': { boxShadow: 4 },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MeetingRoom sx={{ color: color.text }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {room.roomNumber || room.room_number}
                        </Typography>
                      </Box>
                      <Chip
                        label={status}
                        size="small"
                        sx={{ bgcolor: color.bg, color: color.text, fontWeight: 600, border: `1px solid ${color.border}` }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Floor: {room.floor || '1'} &nbsp;|&nbsp; Rent/Bed: ₹{room.rentPerBed || room.rent_per_bed || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mt: 2 }}>
                      {[...Array(capacity)].map((_, i) => (
                        <Tooltip key={i} title={i < occupied ? 'Occupied' : 'Vacant'}>
                          <Bed sx={{ color: i < occupied ? colors.success : colors.border?.main || '#e5e7eb', fontSize: 20 }} />
                        </Tooltip>
                      ))}
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      {room.ac && <Chip label="AC" size="small" variant="outlined" />}
                      {room.attachedBathroom && <Chip label="Attached Bath" size="small" variant="outlined" />}
                      {room.balcony && <Chip label="Balcony" size="small" variant="outlined" />}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default RoomManagement;
