import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Alert,
  Paper,
  InputAdornment,
  Avatar,
} from '@mui/material';
import {
  Search,
  Add,
  Download,
  Close,
  Edit,
  Delete,
  FlashOn,
  WaterDrop,
  Build,
  Restaurant,
  CleaningServices,
  Wifi,
  People,
  Home,
  Receipt,
  TrendingDown,
  BarChart,
  Save,
} from '@mui/icons-material';
import { expenseService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORY_META = {
  electricity: { label: 'Electricity', icon: FlashOn, color: '#F59E0B' },
  water: { label: 'Water', icon: WaterDrop, color: '#1a1a4e' },
  maintenance: { label: 'Maintenance', icon: Build, color: '#8B5CF6' },
  food: { label: 'Food', icon: Restaurant, color: '#10B981' },
  cleaning: { label: 'Cleaning', icon: CleaningServices, color: '#EC4899' },
  internet: { label: 'Internet', icon: Wifi, color: '#14B8A6' },
  salary: { label: 'Salary', icon: People, color: '#F97316' },
  rent: { label: 'Rent', icon: Home, color: '#EF4444' },
  other: { label: 'Other', icon: Receipt, color: '#6B7280' },
};

const getCategoryMeta = (category = '') => {
  const key = category.toLowerCase().trim();
  return CATEGORY_META[key] || CATEGORY_META.other;
};

const formatDate = (dateStr = '') => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const Expenses = () => {
  const { selectedPg } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, [selectedPg, selectedMonth]);

  const fetchExpenses = async () => {
    if (!selectedPg?._id) return;
    setLoading(true);
    try {
      const res = await expenseService.getAll({ pgId: selectedPg._id, month: selectedMonth });
      let data = [];
      if (res?.data?.success && Array.isArray(res.data.data)) data = res.data.data;
      else if (res?.data && Array.isArray(res.data)) data = res.data;
      else if (Array.isArray(res)) data = res;
      setExpenses(data || []);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCategory('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setMethod('');
    setFormError('');
    setFormSuccess('');
  };

  const openAdd = () => {
    resetForm();
    setSelectedExpense(null);
    setAddOpen(true);
  };

  const openEdit = (expense) => {
    setSelectedExpense(expense);
    setCategory(expense.category || expense.title || '');
    setAmount(String(expense.amount || expense.amountSpent || ''));
    setDate(expense.expenseDate || expense.expense_date || new Date().toISOString().split('T')[0]);
    setDescription(expense.note || expense.description || '');
    setMethod(expense.paymentMethod || expense.method || '');
    setFormError('');
    setFormSuccess('');
    setEditOpen(true);
  };

  const openDelete = (expense) => {
    setSelectedExpense(expense);
    setDeleteOpen(true);
  };

  const validateForm = () => {
    if (!category.trim()) return 'Category is required';
    if (!amount) return 'Amount is required';
    if (!date) return 'Date is required';
    return null;
  };

  const handleSave = async (type) => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      const payload = {
        pgId: selectedPg?._id,
        title: category.trim(),
        amount: parseFloat(amount),
        category: category.trim(),
        expenseDate: date,
        note: description || method || '',
      };
      if (type === 'add') {
        await expenseService.create(payload);
        setFormSuccess('Expense recorded successfully!');
      } else {
        await expenseService.update(selectedExpense._id, payload);
        setFormSuccess('Expense updated successfully!');
      }
      setTimeout(() => {
        setAddOpen(false);
        setEditOpen(false);
        resetForm();
        fetchExpenses();
      }, 1200);
    } catch (err) {
      console.error('Save expense error:', err);
      setFormError(err.response?.data?.message || 'Failed to save expense. Please try again.');
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
      console.error('Delete expense error:', err);
      setFormError(err.response?.data?.message || 'Failed to delete expense.');
    } finally {
      setFormLoading(false);
    }
  };

  const exportExpenses = () => {
    const rows = filteredExpenses.map((e) => `
      <tr>
        <td>${e.title || e.expenseTitle || '—'}</td>
        <td>${e.category || '—'}</td>
        <td>${e.expenseDate || e.expense_date || '—'}</td>
        <td>₹${e.amount || e.amountSpent || 0}</td>
      </tr>`).join('');

    const html = `
      <html><body style="font-family: Arial; padding: 30px;">
        <h2 style="text-align:center; color:#EF4444;">${selectedPg?.name || 'Your PG'}</h2>
        <h3 style="text-align:center;">Monthly Expense Report — ${MONTHS[selectedMonth - 1]}</h3>
        <hr/>
        <table width="100%" border="1" cellspacing="0" cellpadding="8">
          <tr><th>Title</th><th>Category</th><th>Date</th><th>Amount</th></tr>
          ${rows}
        </table>
        <h3 style="margin-top:20px;">Total: ₹${totalAmount.toLocaleString('en-IN')}</h3>
        <p style="text-align:center; font-size:12px; margin-top:40px;">Generated by ${selectedPg?.name || 'Your PG'} Management System</p>
      </body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Expense_Report_${MONTHS[selectedMonth - 1]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
  };

  const filteredExpenses = expenses.filter(
    (e) =>
      (e.title || e.expenseTitle || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + (e.amount || e.amountSpent || 0), 0);
  const categoryTotals = filteredExpenses.reduce((acc, e) => {
    const cat = e.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (e.amount || e.amountSpent || 0);
    return acc;
  }, {});
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const renderForm = (type) => (
    <Box>
      {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
      {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}
      <TextField
        fullWidth
        label="Category *"
        placeholder="e.g., Electricity, Maintenance"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Amount *"
        placeholder="₹ 0"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Date *"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Description"
        placeholder="Additional details..."
        multiline
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Payment Method"
        placeholder="Cash, UPI, Bank Transfer..."
        value={method}
        onChange={(e) => setMethod(e.target.value)}
      />
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
            Expenses
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            {expenses.length} expenses this month
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openAdd}
          sx={{ background: `linear-gradient(135deg, #EF4444, #DC2626)` }}
        >
          Add
        </Button>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Paper sx={{ flex: 1, p: 2, bgcolor: '#FFF5F5', border: '1.5px solid #FECACA', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#EF4444', letterSpacing: 0.5 }}>TOTAL EXPENSES</Typography>
            <Avatar sx={{ width: 26, height: 26, bgcolor: '#FEF2F2' }}><TrendingDown sx={{ fontSize: 14, color: '#EF4444' }} /></Avatar>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#EF4444' }}>{formatCurrency(totalAmount)}</Typography>
          <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 500 }}>{filteredExpenses.length} expenses this month</Typography>
        </Paper>
        <Paper sx={{ flex: 1, p: 2, bgcolor: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#D97706', letterSpacing: 0.5 }}>TOP CATEGORY</Typography>
            <Avatar sx={{ width: 26, height: 26, bgcolor: '#FFFBEB' }}><BarChart sx={{ fontSize: 14, color: '#D97706' }} /></Avatar>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', textTransform: 'capitalize' }}>
            {topCategory ? topCategory[0] : '—'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 500 }}>
            {topCategory ? formatCurrency(topCategory[1]) : 'No data'}
          </Typography>
        </Paper>
      </Box>

      {/* Month Chips */}
      <Paper sx={{ display: 'flex', gap: 0.5, p: 0.5, overflowX: 'auto', borderRadius: 4, bgcolor: '#F3F4F6', mb: 2 }}>
        {MONTHS.map((m, i) => (
          <Chip
            key={m}
            label={m}
            onClick={() => setSelectedMonth(i + 1)}
            sx={{
              flexShrink: 0,
              bgcolor: selectedMonth === i + 1 ? '#EF4444' : 'transparent',
              color: selectedMonth === i + 1 ? '#fff' : '#374151',
              fontWeight: selectedMonth === i + 1 ? 700 : 500,
              '&:hover': { bgcolor: selectedMonth === i + 1 ? '#DC2626' : '#E5E7EB' },
            }}
          />
        ))}
      </Paper>

      {/* Search */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: colors.text.secondary }} /></InputAdornment> }}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<Add />}
          onClick={openAdd}
          sx={{ bgcolor: '#EF4444', borderRadius: 3, py: 1.2, fontWeight: 700 }}
        >
          Add Expense
        </Button>
        <Button
          variant="contained"
          fullWidth
          startIcon={<Download />}
          onClick={exportExpenses}
          sx={{ bgcolor: '#10B981', borderRadius: 3, py: 1.2, fontWeight: 700 }}
        >
          Export
        </Button>
      </Box>

      {/* Section Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#111827', letterSpacing: 1, textTransform: 'uppercase' }}>
          Recent
        </Typography>
        <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 500 }}>
          {filteredExpenses.length} expenses
        </Typography>
      </Box>

      {/* Expense Cards */}
      {loading ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={90} sx={{ mb: 2, borderRadius: 3 }} />)
      ) : filteredExpenses.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Receipt sx={{ fontSize: 40, color: '#D1D5DB' }} />
          <Typography variant="body1" sx={{ color: '#9CA3AF', mt: 1, fontWeight: 600 }}>No expenses found</Typography>
        </Card>
      ) : (
        filteredExpenses.map((e) => {
          const meta = getCategoryMeta(e.category);
          const Icon = meta.icon;
          return (
            <Card key={e._id || e.id} sx={{ mb: 1.5, borderRadius: 3, boxShadow: 1 }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  <Avatar sx={{ width: 44, height: 44, bgcolor: `${meta.color}20`, color: meta.color }}>
                    <Icon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827' }}>
                      {e.title || e.expenseTitle}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                      {formatDate(e.expenseDate || e.expense_date)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#EF4444', mb: 0.5 }}>
                    -{formatCurrency(e.amount || e.amountSpent)}
                  </Typography>
                  <Chip
                    label={e.category || 'Other'}
                    size="small"
                    sx={{
                      bgcolor: `${meta.color}18`,
                      color: meta.color,
                      border: `1px solid ${meta.color}40`,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      textTransform: 'capitalize',
                    }}
                  />
                  <Box sx={{ mt: 0.5 }}>
                    <IconButton size="small" onClick={() => openEdit(e)}><Edit fontSize="small" sx={{ color: '#64748B' }} /></IconButton>
                    <IconButton size="small" onClick={() => openDelete(e)}><Delete fontSize="small" sx={{ color: '#EF4444' }} /></IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Add Expense</Typography>
          <IconButton onClick={() => setAddOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>{renderForm('add')}</DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={formLoading ? null : <Save />}
            onClick={() => handleSave('add')}
            disabled={formLoading}
            sx={{ background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})` }}
          >
            {formLoading ? 'Saving...' : 'Save Expense'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Edit Expense</Typography>
          <IconButton onClick={() => setEditOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>{renderForm('edit')}</DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={formLoading ? null : <Save />}
            onClick={() => handleSave('edit')}
            disabled={formLoading}
            sx={{ background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})` }}
          >
            {formLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Expense</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete <strong>{selectedExpense?.title || selectedExpense?.expenseTitle}</strong>?
          </Typography>
          <Alert severity="warning">This action cannot be undone.</Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={<Delete />} onClick={handleDelete} disabled={formLoading}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Expenses;
