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
  Receipt,
  Close,
  Save,
  Warning,
  AttachMoney,
  Build,
  Lightbulb,
  WaterDrop,
  Restaurant,
  LocalHotel,
  CleaningServices,
  DirectionsBus,
  MedicalServices,
  Category,
} from '@mui/icons-material';
import { expenseService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const EXPENSE_CATEGORIES = [
  { value: 'maintenance', label: 'Maintenance', icon: <Build /> },
  { value: 'electricity', label: 'Electricity', icon: <Lightbulb /> },
  { value: 'water', label: 'Water', icon: <WaterDrop /> },
  { value: 'groceries', label: 'Groceries', icon: <Restaurant /> },
  { value: 'salary', label: 'Staff Salary', icon: <LocalHotel /> },
  { value: 'cleaning', label: 'Cleaning', icon: <CleaningServices /> },
  { value: 'transport', label: 'Transport', icon: <DirectionsBus /> },
  { value: 'medical', label: 'Medical', icon: <MedicalServices /> },
  { value: 'other', label: 'Other', icon: <Category /> },
];

const initialFormData = {
  title: '',
  amount: '',
  category: 'maintenance',
  expenseDate: new Date().toISOString().split('T')[0],
  note: '',
};

const Expenses = () => {
  const { selectedPg } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, [selectedPg]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await expenseService.getAll({ pgId: selectedPg?._id });
      if (Array.isArray(response)) {
        setExpenses(response);
      } else if (response?.data && Array.isArray(response.data)) {
        setExpenses(response.data);
      } else {
        setExpenses([]);
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      setExpenses([]);
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

  const handleViewDetail = (expense) => {
    setSelectedExpense(expense);
    setDetailOpen(true);
  };

  const handleAddOpen = () => {
    setFormData(initialFormData);
    setFormError('');
    setFormSuccess('');
    setAddOpen(true);
  };

  const handleEditOpen = (expense) => {
    setSelectedExpense(expense);
    setFormData({
      title: expense.title || expense.expenseTitle || '',
      amount: expense.amount || '',
      category: expense.category || 'maintenance',
      expenseDate: expense.expenseDate || expense.expense_date || new Date().toISOString().split('T')[0],
      note: expense.note || '',
    });
    setFormError('');
    setFormSuccess('');
    setEditOpen(true);
  };

  const handleDeleteOpen = (expense) => {
    setSelectedExpense(expense);
    setDeleteOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (type) => {
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const payload = {
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        expenseDate: formData.expenseDate,
        note: formData.note,
        pgId: selectedPg?._id,
      };

      if (type === 'add') {
        await expenseService.create(payload);
        setFormSuccess('Expense added successfully!');
        setTimeout(() => {
          setAddOpen(false);
          fetchExpenses();
        }, 1500);
      } else if (type === 'edit') {
        await expenseService.update(selectedExpense._id, payload);
        setFormSuccess('Expense updated successfully!');
        setTimeout(() => {
          setEditOpen(false);
          fetchExpenses();
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
      await expenseService.delete(selectedExpense._id);
      setDeleteOpen(false);
      fetchExpenses();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to delete expense.');
    } finally {
      setFormLoading(false);
    }
  };

  const getCategoryInfo = (category) => {
    return EXPENSE_CATEGORIES.find(c => c.value === category) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      maintenance: colors.primary[700],
      electricity: colors.warning,
      water: '#2196f3',
      groceries: colors.success,
      salary: '#9c27b0',
      cleaning: '#00bcd4',
      transport: '#ff9800',
      medical: colors.error,
      other: colors.text.secondary,
    };
    return colorMap[category] || colors.text.secondary;
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.note?.toLowerCase().includes(search.toLowerCase()) ||
      e.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const expensesByCategory = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = expenses
      .filter(e => e.category === cat.value)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    return acc;
  }, {});

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
            Expenses
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            {expenses.length} total
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

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Paper sx={{ p: 1.5, bgcolor: `${colors.error}10`, borderLeft: `4px solid ${colors.error}` }}>
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>Total</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: colors.error }}>
              {formatCurrency(totalExpenses)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Paper sx={{ p: 1.5, bgcolor: `${colors.warning}10`, borderLeft: `4px solid ${colors.warning}` }}>
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>Electricity</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.warning }}>
              {formatCurrency(expensesByCategory.electricity || 0)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: `${colors.primary[700]}10`, borderLeft: `4px solid ${colors.primary[700]}` }}>
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>Maintenance</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.primary[700] }}>
              {formatCurrency(expensesByCategory.maintenance || 0)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: `${colors.success}10`, borderLeft: `4px solid ${colors.success}` }}>
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>Other Expenses</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.success }}>
              {formatCurrency(
                (expensesByCategory.groceries || 0) +
                (expensesByCategory.salary || 0) +
                (expensesByCategory.cleaning || 0) +
                (expensesByCategory.water || 0) +
                (expensesByCategory.other || 0)
              )}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 120 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: colors.text.secondary }} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All</MenuItem>
                {EXPENSE_CATEGORIES.map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.border.main }}>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                      No expenses found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((expense) => {
                    const categoryInfo = getCategoryInfo(expense.category);
                    return (
                      <TableRow key={expense._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                bgcolor: `${getCategoryColor(expense.category)}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: getCategoryColor(expense.category),
                              }}
                            >
                              {categoryInfo.icon}
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {expense.title || expense.expenseTitle}
                              </Typography>
                              {expense.note && (
                                <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                                  {expense.note.length > 40 ? expense.note.slice(0, 40) + '...' : expense.note}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={categoryInfo.label}
                            size="small"
                            icon={React.cloneElement(categoryInfo.icon, { sx: { fontSize: 16 } })}
                            sx={{
                              bgcolor: `${getCategoryColor(expense.category)}15`,
                              color: getCategoryColor(expense.category),
                              fontWeight: 500,
                              '& .MuiChip-icon': {
                                color: getCategoryColor(expense.category),
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.error }}>
                            {formatCurrency(expense.amount || expense.amountSpent)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(expense.expenseDate || expense.expense_date)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleViewDetail(expense)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleEditOpen(expense)}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" sx={{ color: colors.error }} onClick={() => handleDeleteOpen(expense)}>
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
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredExpenses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Expense Details</Typography>
          <IconButton onClick={() => setDetailOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedExpense && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 3,
                      bgcolor: `${getCategoryColor(selectedExpense.category)}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: getCategoryColor(selectedExpense.category),
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {React.cloneElement(getCategoryInfo(selectedExpense.category).icon, { sx: { fontSize: 40 } })}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    {selectedExpense.title || selectedExpense.expenseTitle}
                  </Typography>
                  <Chip
                    label={getCategoryInfo(selectedExpense.category).label}
                    sx={{
                      bgcolor: `${getCategoryColor(selectedExpense.category)}15`,
                      color: getCategoryColor(selectedExpense.category),
                      fontWeight: 500,
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.primary[700] }}>Expense Info</Typography>
                <List dense>
                  <ListItem><ListItemIcon><AttachMoney color="primary" /></ListItemIcon><ListItemText primary="Amount" secondary={formatCurrency(selectedExpense.amount || selectedExpense.amountSpent)} /></ListItem>
                  <ListItem><ListItemIcon><Receipt color="primary" /></ListItemIcon><ListItemText primary="Category" secondary={getCategoryInfo(selectedExpense.category).label} /></ListItem>
                  <ListItem><ListItemIcon><Receipt color="action" /></ListItemIcon><ListItemText primary="Expense Date" secondary={formatDate(selectedExpense.expenseDate || selectedExpense.expense_date)} /></ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.primary[700] }}>Reference</Typography>
                <List dense>
                  <ListItem><ListItemIcon><Receipt color="primary" /></ListItemIcon><ListItemText primary="Expense ID" secondary={selectedExpense._id?.slice(-8).toUpperCase() || 'N/A'} /></ListItem>
                </List>
              </Grid>

              {(selectedExpense.note || selectedExpense.notes) && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.primary[700] }}>Notes</Typography>
                    <Paper sx={{ p: 2, bgcolor: colors.background.default }}>
                      <Typography variant="body2">{selectedExpense.note || selectedExpense.notes}</Typography>
                    </Paper>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Edit />} onClick={() => { setDetailOpen(false); handleEditOpen(selectedExpense); }}>
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addOpen || editOpen} onClose={() => { setAddOpen(false); setEditOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{addOpen ? 'Add Expense' : 'Edit Expense'}</Typography>
          <IconButton onClick={() => { setAddOpen(false); setEditOpen(false); }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}
          
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={8}>
              <TextField fullWidth label="Title" name="title" value={formData.title} onChange={handleFormChange} required />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Amount (₹)" name="amount" type="number" value={formData.amount} onChange={handleFormChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select name="category" value={formData.category} onChange={handleFormChange} label="Category">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {cat.icon}
                        {cat.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Date" name="expenseDate" type="date" value={formData.expenseDate} onChange={handleFormChange} InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" name="note" value={formData.note} onChange={handleFormChange} multiline rows={3} placeholder="Add any additional details..." />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setAddOpen(false); setEditOpen(false); }}>Cancel</Button>
          <Button variant="contained" startIcon={formLoading ? <CircularProgress size={20} /> : <Save />} onClick={() => handleSubmit(addOpen ? 'add' : 'edit')} disabled={formLoading}>
            {addOpen ? 'Add Expense' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning sx={{ color: colors.error }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Delete Expense</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete <strong>{selectedExpense?.title || selectedExpense?.expenseTitle}</strong>?
          </Typography>
          <Alert severity="warning">This action cannot be undone. This expense record will be permanently removed.</Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={formLoading ? <CircularProgress size={20} /> : <Delete />} onClick={handleDelete} disabled={formLoading}>
            Delete Expense
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Expenses;
