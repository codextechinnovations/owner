import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Breadcrumbs,
  Link,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  DeleteSweep,
  Person,
  Groups,
  Hotel,
  FourK,
  Save,
  Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { roomService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const roomTypes = [
  { value: 'single', label: 'Single Sharing', icon: <Person />, beds: 1, description: '1 bed per room - Best for privacy' },
  { value: 'double', label: 'Double Sharing', icon: <Groups />, beds: 2, description: '2 beds per room - Share & save' },
  { value: 'triple', label: 'Triple Sharing', icon: <Hotel />, beds: 3, description: '3 beds per room - Budget friendly' },
  { value: 'four', label: '4 Sharing', icon: <FourK />, beds: 4, description: '4 beds per room - Most affordable' },
];

const initialBulkForm = {
  single: { count: 0, rentPerBed: '', floor: '1' },
  double: { count: 0, rentPerBed: '', floor: '1' },
  triple: { count: 0, rentPerBed: '', floor: '1' },
  four: { count: 0, rentPerBed: '', floor: '1' },
};

const BulkAddRooms = () => {
  const navigate = useNavigate();
  const { selectedPg } = useAuth();
  const [bulkForm, setBulkForm] = useState(initialBulkForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [existingRooms, setExistingRooms] = useState([]);

  useEffect(() => {
    fetchExistingRooms();
  }, [selectedPg]);

  const fetchExistingRooms = async () => {
    try {
      const response = await roomService.getAll({ pgId: selectedPg?._id });
      if (Array.isArray(response)) {
        setExistingRooms(response);
      } else {
        setExistingRooms(response?.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };

  const handleBulkChange = (type, field, value) => {
    setBulkForm({
      ...bulkForm,
      [type]: { ...bulkForm[type], [field]: value },
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'single': return { bg: `${colors.primary[700]}15`, color: colors.primary[700], border: colors.primary[700] };
      case 'double': return { bg: `${colors.accent.blue}15`, color: colors.accent.blue, border: colors.accent.blue };
      case 'triple': return { bg: `${colors.accent.purple}15`, color: colors.accent.purple, border: colors.accent.purple };
      case 'four': return { bg: `${colors.accent.amber}15`, color: colors.accent.amber, border: colors.accent.amber };
      default: return { bg: colors.border.main, color: colors.text.secondary, border: colors.border.light };
    }
  };

  const getTotalRooms = () => {
    return Object.values(bulkForm).reduce((acc, r) => acc + (r.count || 0), 0);
  };

  const getTotalBeds = () => {
    return Object.entries(bulkForm).reduce((acc, [type, data]) => {
      const beds = roomTypes.find(r => r.value === type)?.beds || 1;
      return acc + ((data.count || 0) * beds);
    }, 0);
  };

  const getTotalRevenue = () => {
    return Object.entries(bulkForm).reduce((acc, [type, data]) => {
      const beds = roomTypes.find(r => r.value === type)?.beds || 1;
      return acc + ((data.count || 0) * beds * (parseInt(data.rentPerBed) || 0));
    }, 0);
  };

  const buildPlannedRooms = () => {
    const roomsToCreate = [];
    const existingNumericRooms = existingRooms
      .map((room) => parseInt(room.roomNumber, 10))
      .filter((num) => Number.isFinite(num));

    const floorMaxSequence = {};
    existingNumericRooms.forEach((roomNumber) => {
      const floor = Math.floor(roomNumber / 100);
      const sequence = roomNumber % 100;
      if (!floorMaxSequence[floor] || sequence > floorMaxSequence[floor]) {
        floorMaxSequence[floor] = sequence;
      }
    });

    let globalCounter = existingNumericRooms.length > 0 ? Math.max(...existingNumericRooms) : 100;

    Object.entries(bulkForm).forEach(([type, data]) => {
      const count = Number(data.count) || 0;
      if (count <= 0) return;

      const beds = roomTypes.find((roomType) => roomType.value === type)?.beds || 1;

      for (let i = 0; i < count; i++) {
        const numericFloor = parseInt(data.floor, 10);
        let roomNumber;

        if (Number.isFinite(numericFloor) && numericFloor > 0) {
          const currentSequence = floorMaxSequence[numericFloor] || 0;
          const nextSequence = currentSequence + 1;
          floorMaxSequence[numericFloor] = nextSequence;
          roomNumber = String((numericFloor * 100) + nextSequence);
        } else {
          globalCounter += 1;
          roomNumber = String(globalCounter);
        }

        roomsToCreate.push({
          pgId: selectedPg?._id,
          type,
          roomNumber,
          floor: data.floor || String(roomNumber).charAt(0),
          capacity: beds,
          rentPerBed: parseInt(data.rentPerBed, 10) || 0,
        });
      }
    });

    return roomsToCreate;
  };

  const handleSubmit = async () => {
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const roomsToCreate = buildPlannedRooms();

      if (roomsToCreate.length === 0) {
        setFormError('Please add at least one room.');
        setFormLoading(false);
        return;
      }

      // Create rooms using bulk add API
      const response = await roomService.bulkCreate(roomsToCreate);

      if ((response?.totalCreated || 0) === 0 && (response?.totalErrors || 0) > 0) {
        const firstError = response?.errors?.[0]?.error;
        setFormError(firstError || 'No rooms were created. Please verify room details and try again.');
        return;
      }

      if ((response?.totalErrors || 0) > 0) {
        setFormSuccess(`Created ${response.totalCreated} room(s). ${response.totalErrors} room(s) failed validation.`);
      } else {
        setFormSuccess(`Successfully created ${response.totalCreated} rooms with ${getTotalBeds()} total beds!`);
      }
      
      // Navigate back after 2 seconds
      setTimeout(() => {
        navigate('/rooms');
      }, 2000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create rooms. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 1 }}>
          <Link
            component="button"
            onClick={() => navigate('/rooms')}
            sx={{ color: colors.text.secondary, textDecoration: 'none', cursor: 'pointer', '&:hover': { color: colors.primary[700] } }}
          >
            Rooms
          </Link>
          <Typography sx={{ color: colors.text.primary }}>Bulk Add</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/rooms')} sx={{ bgcolor: colors.border.light }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary }}>
              Bulk Add Rooms
            </Typography>
            <Typography variant="body2" sx={{ color: colors.text.secondary }}>
              Quickly add multiple rooms at once
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Alerts */}
      {formError && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setFormError('')}>{formError}</Alert>}
      {formSuccess && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setFormSuccess('')}>{formSuccess}</Alert>}

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Quick Tip:</strong> Room numbers are floor-based.
        Example: floor 2 will generate 201, 202... and floor 3 will generate 301, 302...
      </Alert>

      {/* Room Type Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {roomTypes.map((type) => {
          const typeColor = getTypeColor(type.value);
          const hasRooms = (bulkForm[type?.value]?.count || 0) > 0;
          
          return (
            <Grid item xs={12} md={6} key={type.value}>
              <Paper
                sx={{
                  p: 3,
                  border: `2px solid ${hasRooms ? typeColor.border : colors.border.light}`,
                  bgcolor: hasRooms ? typeColor.bg : 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': { borderColor: typeColor.border },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: typeColor.bg, color: typeColor.color, width: 56, height: 56 }}>
                      {type.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {type.label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                        {type.description}
                      </Typography>
                    </Box>
                  </Box>
                  {hasRooms && (
                    <Box sx={{ bgcolor: typeColor.color, color: 'white', px: 2, py: 0.5, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {bulkForm[type.value].count} rooms
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="No. of Rooms"
                      type="number"
                      size="small"
                      value={bulkForm[type.value].count}
                      onChange={(e) => handleBulkChange(type.value, 'count', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 0 }}
                      disabled={formLoading}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Rent/Bed (₹)"
                      type="number"
                      size="small"
                      value={bulkForm[type.value].rentPerBed}
                      onChange={(e) => handleBulkChange(type.value, 'rentPerBed', e.target.value)}
                      disabled={formLoading}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Floor"
                      type="number"
                      size="small"
                      value={bulkForm[type.value].floor}
                      onChange={(e) => handleBulkChange(type.value, 'floor', e.target.value)}
                      disabled={formLoading}
                    />
                  </Grid>
                </Grid>

                {/* Preview */}
                {hasRooms && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 2, border: `1px solid ${colors.border.light}` }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: colors.text.secondary }}>Total Beds</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: typeColor.color }}>
                          {bulkForm[type.value].count * type.beds}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: colors.text.secondary }}>Per Room</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {formatCurrency(bulkForm[type.value].rentPerBed * type.beds)}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: colors.text.secondary }}>Monthly</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: colors.success }}>
                          {formatCurrency(bulkForm[type.value].count * type.beds * (parseInt(bulkForm[type.value].rentPerBed) || 0))}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Summary Card */}
      <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})` }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 3 }}>
            Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'white' }}>
                  {getTotalRooms()}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Total Rooms
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'white' }}>
                  {getTotalBeds()}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Total Beds
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: colors.accent.amber }}>
                  {formatCurrency(getTotalRevenue())}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Monthly Revenue
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: colors.success }}>
                  {formatCurrency(getTotalRevenue() * 12)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Yearly Revenue
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Room Preview */}
      {getTotalRooms() > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Room Numbers Preview
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {buildPlannedRooms().map((room, index) => {
                const beds = roomTypes.find((roomType) => roomType.value === room.type)?.beds || 1;
                return (
                  <Chip
                    key={`${room.type}-${room.roomNumber}-${index}`}
                    label={`${room.roomNumber} (${beds} bed${beds > 1 ? 's' : ''})`}
                    size="small"
                    sx={{ bgcolor: getTypeColor(room.type).bg, color: getTypeColor(room.type).color }}
                  />
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/rooms')}
          disabled={formLoading}
          sx={{ px: 4 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={formLoading ? <CircularProgress size={20} /> : <Save />}
          onClick={handleSubmit}
          disabled={formLoading || getTotalRooms() === 0}
          sx={{
            px: 4,
            background: `linear-gradient(135deg, ${colors.accent.purple}, ${colors.primary[700]})`,
            '&:hover': {
              background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.accent.purple})`,
            },
          }}
        >
          {formLoading ? 'Creating...' : `Create ${getTotalRooms()} Rooms`}
        </Button>
      </Box>
    </Box>
  );
};

export default BulkAddRooms;
