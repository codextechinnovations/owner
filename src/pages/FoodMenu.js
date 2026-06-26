import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Skeleton,
  Alert,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Save, Restaurant, Refresh, Edit, Close, WbSunny, LunchDining, DinnerDining, CalendarToday } from '@mui/icons-material';
import { foodMenuService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = [
  { key: 'breakfast', label: 'Breakfast', icon: WbSunny, color: '#F59E0B' },
  { key: 'lunch', label: 'Lunch', icon: LunchDining, color: '#10B981' },
  { key: 'dinner', label: 'Dinner', icon: DinnerDining, color: '#1a1a4e' },
];

const emptyMenu = () =>
  DAYS.reduce((acc, day) => {
    acc[day] = { breakfast: '', lunch: '', dinner: '' };
    return acc;
  }, {});

const FoodMenu = () => {
  const { selectedPg } = useAuth();
  const [menu, setMenu] = useState(emptyMenu());
  const [editMenu, setEditMenu] = useState(emptyMenu());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const fetchMenu = async () => {
    if (!selectedPg?._id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await foodMenuService.getByPg(selectedPg._id);
      const data = response.data?.data || response.data;
      const loaded = { ...emptyMenu(), ...(data?.menu || data || {}) };
      setMenu(loaded);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load food menu');
      setMenu(emptyMenu());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [selectedPg]);

  const handleOpenEdit = () => {
    setEditMenu(JSON.parse(JSON.stringify(menu)));
    setEditOpen(true);
    setError('');
    setSuccess('');
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
  };

  const handleEditChange = (day, meal, value) => {
    setEditMenu((prev) => ({
      ...prev,
      [day]: { ...prev[day], [meal]: value },
    }));
  };

  const handleSave = async () => {
    if (!selectedPg?._id) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await foodMenuService.saveBulk({ pgId: selectedPg._id, menu: editMenu });
      setMenu(editMenu);
      setSuccess('Food menu saved successfully');
      setEditOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save food menu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: colors.text.primary, mb: 0.5 }}>
            Food Menu
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Plan and share weekly meals with tenants
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchMenu} disabled={loading} sx={{ borderRadius: 3 }}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Edit />} onClick={handleOpenEdit} disabled={loading} sx={{ borderRadius: 3, background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})` }}>
            Edit Menu
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{success}</Alert>}

      {loading ? (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Skeleton height={80} sx={{ mb: 2, borderRadius: 3 }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={140} sx={{ mb: 2, borderRadius: 3 }} />
            ))}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card sx={{ mb: 3, borderRadius: 4, background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[900]})`, color: 'white' }}>
            <CardContent sx={{ py: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                Weekly Food Menu
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Plan breakfast, lunch & dinner for your PG
              </Typography>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            {DAYS.map((day) => (
              <Grid item xs={12} md={6} key={day}>
                <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#E0E7FF', color: colors.primary[700], width: 32, height: 32 }}>
                        <CalendarToday fontSize="small" />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>{day}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {MEALS.map((meal) => {
                        const Icon = meal.icon;
                        const value = menu[day]?.[meal.key];
                        return (
                          <Box key={meal.key} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, bgcolor: '#F9FAFB', borderRadius: 3 }}>
                            <Avatar sx={{ bgcolor: `${meal.color}15`, color: meal.color, width: 38, height: 38 }}>
                              <Icon fontSize="small" />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {meal.label}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: value ? '#111827' : '#9CA3AF' }}>
                                {value || 'Not set'}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <Dialog open={editOpen} onClose={handleCloseEdit} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
          Edit Weekly Menu
          <IconButton onClick={handleCloseEdit}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
          <Grid container spacing={2}>
            {DAYS.map((day) => (
              <Grid item xs={12} md={6} key={day}>
                <Card variant="outlined" sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <CalendarToday sx={{ color: colors.primary[700], fontSize: 18 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{day}</Typography>
                    </Box>
                    {MEALS.map((meal) => {
                      const Icon = meal.icon;
                      return (
                        <Box key={meal.key} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2, p: 1.5, bgcolor: '#F9FAFB', borderRadius: 3 }}>
                          <Avatar sx={{ bgcolor: `${meal.color}15`, color: meal.color, width: 34, height: 34, mt: 0.5 }}>
                            <Icon fontSize="small" />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
                              {meal.label}
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder={`Enter ${meal.label.toLowerCase()}`}
                              value={editMenu[day]?.[meal.key] || ''}
                              onChange={(e) => handleEditChange(day, meal.key, e.target.value)}
                              multiline
                              rows={2}
                              sx={{ mt: 0.5, '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                            />
                          </Box>
                        </Box>
                      );
                    })}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEdit} startIcon={<Close />}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? null : <Save />}
            onClick={handleSave}
            disabled={saving}
            sx={{ background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})`, borderRadius: 3 }}
          >
            {saving ? 'Saving...' : 'Save Menu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FoodMenu;
