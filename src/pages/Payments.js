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
  Email,
  Payment as PaymentIcon,
  CalendarToday,
  Work,
  Person,
  Receipt,
  Close,
  Save,
  CheckCircle,
  Warning,
  AttachMoney,
  AccountBalanceWallet,
  CreditCard,
  Money,
  Share,
  Download,
  Print,
} from '@mui/icons-material';
import { paymentService } from '../services/services';
import { tenantService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const initialFormData = {
  tenantId: '',
  amount: '',
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMonth: new Date().toISOString().slice(0, 7),
  paymentMethod: 'UPI',
  status: 'paid',
  notes: '',
};

const Payments = () => {
  const { selectedPg } = useAuth();
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchTenants();
  }, [selectedPg]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await paymentService.getAll({ pgId: selectedPg?._id });
      if (Array.isArray(response)) {
        setPayments(response);
      } else if (response?.data && Array.isArray(response.data)) {
        setPayments(response.data);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await tenantService.getAll({ pgId: selectedPg?._id });
      let tenantList = [];
      if (Array.isArray(response)) {
        tenantList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        tenantList = response.data;
      }
      setTenants(tenantList.filter(t => t.status === 'active'));
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
      setTenants([]);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetail = (payment) => {
    setSelectedPayment(payment);
    setDetailOpen(true);
  };

  const handleAddOpen = () => {
    setFormData(initialFormData);
    setFormError('');
    setFormSuccess('');
    setAddOpen(true);
  };

  const handleEditOpen = (payment) => {
    setSelectedPayment(payment);
    setFormData({
      tenantId: payment.tenantId?._id || payment.tenantId || '',
      amount: payment.amount || '',
      paymentDate: payment.paymentDate || payment.payment_date || new Date().toISOString().split('T')[0],
      paymentMonth: payment.month ? `${payment.year}-${String(payment.month).padStart(2, '0')}` : new Date().toISOString().slice(0, 7),
      paymentMethod: payment.mode || payment.paymentMethod || 'UPI',
      status: payment.status || 'paid',
      notes: payment.note || '',
    });
    setFormError('');
    setFormSuccess('');
    setEditOpen(true);
  };

  const handleDeleteOpen = (payment) => {
    setSelectedPayment(payment);
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
      const [year, month] = formData.paymentMonth.split('-');
      const payload = {
        tenantId: formData.tenantId,
        amount: parseFloat(formData.amount),
        month: parseInt(month),
        year: parseInt(year),
        mode: formData.paymentMethod,
        paymentDate: formData.paymentDate,
        note: formData.notes,
        pgId: selectedPg?._id,
      };

      if (type === 'add') {
        await paymentService.create(payload);
        setFormSuccess('Payment recorded successfully!');
        setTimeout(() => {
          setAddOpen(false);
          fetchPayments();
        }, 1500);
      } else if (type === 'edit') {
        await paymentService.update(selectedPayment._id, payload);
        setFormSuccess('Payment updated successfully!');
        setTimeout(() => {
          setEditOpen(false);
          fetchPayments();
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
      await paymentService.delete(selectedPayment._id);
      setDeleteOpen(false);
      fetchPayments();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to delete payment.');
    } finally {
      setFormLoading(false);
    }
  };

  const generateReceiptHTML = (payment) => {
    const tenantName = payment.tenantId?.name || payment.tenantName || 'N/A';
    const tenantPhone = payment.tenantId?.phone || 'N/A';
    const tenantRoom = payment.roomNumber || payment.room_number || 'N/A';
    const amount = formatCurrency(payment.amount);
    const paymentDate = formatDate(payment.paymentDate || payment.payment_date);
    const paymentMonth = formatMonth(payment.month, payment.year);
    const paymentId = payment._id?.slice(-8).toUpperCase() || 'N/A';
    const method = payment.mode || payment.paymentMethod || 'N/A';
    const pgName = 'ManageYourPG';
    const pgAddress = 'Your PG Address';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: auto; }
          .header { text-align: center; border-bottom: 2px solid #1a1a4e; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #1a1a4e; margin: 0; font-size: 24px; }
          .header p { color: #666; margin: 5px 0; }
          .receipt-id { background: #f5f5f5; padding: 10px; text-align: center; margin-bottom: 20px; }
          .receipt-id span { font-weight: bold; color: #1a1a4e; }
          .section { margin-bottom: 20px; }
          .section h3 { color: #1a1a4e; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .label { color: #666; }
          .value { font-weight: bold; color: #333; }
          .amount-box { background: #1a1a4e; color: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .amount-box .label { color: rgba(255,255,255,0.8); }
          .amount-box .value { font-size: 32px; color: white; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .status-paid { background: #d4edda; color: #155724; }
          .status-pending { background: #fff3cd; color: #856404; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${pgName}</h1>
          <p>${pgAddress}</p>
          <p>Payment Receipt</p>
        </div>
        
        <div class="receipt-id">
          Receipt ID: <span>#${paymentId}</span>
        </div>

        <div class="amount-box">
          <div class="label">Amount Received</div>
          <div class="value">${amount}</div>
          <span class="status ${payment.status === 'paid' ? 'status-paid' : 'status-pending'}">${(payment.status || 'pending').toUpperCase()}</span>
        </div>

        <div class="section">
          <h3>Payment Details</h3>
          <div class="row">
            <span class="label">Payment For</span>
            <span class="value">${paymentMonth}</span>
          </div>
          <div class="row">
            <span class="label">Payment Date</span>
            <span class="value">${paymentDate}</span>
          </div>
          <div class="row">
            <span class="label">Payment Method</span>
            <span class="value">${method}</span>
          </div>
        </div>

        <div class="section">
          <h3>Tenant Information</h3>
          <div class="row">
            <span class="label">Name</span>
            <span class="value">${tenantName}</span>
          </div>
          <div class="row">
            <span class="label">Phone</span>
            <span class="value">${tenantPhone}</span>
          </div>
          <div class="row">
            <span class="label">Room</span>
            <span class="value">Room ${tenantRoom}</span>
          </div>
        </div>

        ${payment.notes ? `
        <div class="section">
          <h3>Notes</h3>
          <p>${payment.notes}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p>This is a computer-generated receipt. No signature required.</p>
          <p>Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleShareReceipt = async (payment) => {
    const receiptHTML = generateReceiptHTML(payment);
    
    if (navigator.share) {
      try {
        const blob = new Blob([receiptHTML], { type: 'text/html' });
        const file = new File([blob], `Receipt_${payment._id?.slice(-8) || 'payment'}.html`, { type: 'text/html' });
        
        await navigator.share({
          title: `Payment Receipt - ${payment.tenantId?.name || 'Tenant'}`,
          text: `Payment Receipt for ${formatMonth(payment.paymentMonth)} - Amount: ${formatCurrency(payment.amount)}`,
          files: [file],
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          downloadReceipt(payment);
        }
      }
    } else {
      downloadReceipt(payment);
    }
  };

  const downloadReceipt = (payment) => {
    const receiptHTML = generateReceiptHTML(payment);
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${payment.tenantId?.name || 'payment'}_${payment.paymentMonth || 'receipt'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printReceipt = (payment) => {
    const receiptHTML = generateReceiptHTML(payment);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return { bg: `${colors.success}15`, color: colors.success };
      case 'pending':
        return { bg: `${colors.warning}15`, color: colors.warning };
      case 'partial':
        return { bg: `${colors.purple}15`, color: colors.purple };
      case 'overdue':
        return { bg: `${colors.error}15`, color: colors.error };
      default:
        return { bg: colors.border.main, color: colors.text.secondary };
    }
  };

  const getMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash':
        return <Money sx={{ fontSize: 18 }} />;
      case 'upi':
      case 'gpay':
      case 'phonepe':
        return <AccountBalanceWallet sx={{ fontSize: 18 }} />;
      case 'bank transfer':
      case 'neft':
      case 'imps':
        return <AccountBalanceWallet sx={{ fontSize: 18 }} />;
      case 'card':
      case 'debit card':
      case 'credit card':
        return <CreditCard sx={{ fontSize: 18 }} />;
      default:
        return <PaymentIcon sx={{ fontSize: 18 }} />;
    }
  };

  const filteredPayments = payments.filter((p) => {
    const tenantName = p.tenantId?.name || p.tenantName || '';
    const tenantPhone = p.tenantId?.phone || '';
    const paymentMonth = p.month ? `${p.year}-${String(p.month).padStart(2, '0')}` : '';
    const matchesSearch =
      tenantName.toLowerCase().includes(search.toLowerCase()) ||
      tenantPhone.includes(search) ||
      paymentMonth.includes(search);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getTenantName = (p) => p.tenantId?.name || p.tenantName || 'Unknown';
  const getTenantPhone = (p) => p.tenantId?.phone || '';

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

  const formatMonth = (month, year) => {
    if (!month || !year) return 'N/A';
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const totalCollected = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const totalPending = payments
    .filter(p => p.status === 'pending' || p.status === 'partial')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
            Payments
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            {payments.length} total
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
          Record
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Paper sx={{ p: 1.5, bgcolor: `${colors.success}10`, borderLeft: `4px solid ${colors.success}` }}>
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>Collected</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.success }}>
              {formatCurrency(totalCollected)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: `${colors.warning}10`, borderLeft: `4px solid ${colors.warning}` }}>
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>Pending Amount</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.warning }}>
              {formatCurrency(totalPending)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: `${colors.primary[700]}10`, borderLeft: `4px solid ${colors.primary[700]}` }}>
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>Paid Payments</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.primary[700] }}>
              {payments.filter(p => p.status === 'paid').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: `${colors.error}10`, borderLeft: `4px solid ${colors.error}` }}>
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>Pending Payments</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.error }}>
              {payments.filter(p => p.status === 'pending' || p.status === 'overdue').length}
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
              sx={{ flex: 1, minWidth: 150 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: colors.text.secondary }} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="partial">Partial</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
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
                <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Month</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Receipt</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                      No payments found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((payment) => (
                    <TableRow key={payment._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              bgcolor: colors.primary[700],
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 600,
                            }}
                          >
                            {getTenantName(payment).charAt(0)}
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {getTenantName(payment)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                              {getTenantPhone(payment)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.primary[700] }}>
                          {formatCurrency(payment.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatMonth(payment.month, payment.year)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getMethodIcon(payment.mode)}
                          <Typography variant="body2">
                            {payment.mode || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(payment.paymentDate || payment.payment_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payment.status || 'paid'}
                          size="small"
                          sx={{
                            ...getStatusColor(payment.status),
                            fontWeight: 500,
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleShareReceipt(payment)} title="Share Receipt" sx={{ color: colors.primary[700] }}>
                          <Receipt fontSize="small" />
                        </IconButton>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleViewDetail(payment)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleEditOpen(payment)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: colors.error }} onClick={() => handleDeleteOpen(payment)}>
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
          count={filteredPayments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Payment Details</Typography>
          <IconButton onClick={() => setDetailOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPayment && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: colors.primary[700],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '2rem',
                      fontWeight: 700,
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {getTenantName(selectedPayment).charAt(0)}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    {getTenantName(selectedPayment)}
                  </Typography>
                  <Chip
                    label={selectedPayment.status || 'paid'}
                    sx={{ ...getStatusColor(selectedPayment.status), fontWeight: 500, textTransform: 'capitalize' }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.primary[700] }}>Payment Info</Typography>
                <List dense>
                  <ListItem><ListItemIcon><AttachMoney color="primary" /></ListItemIcon><ListItemText primary="Amount" secondary={formatCurrency(selectedPayment.amount)} /></ListItem>
                  <ListItem><ListItemIcon><CalendarToday color="primary" /></ListItemIcon><ListItemText primary="Payment Month" secondary={formatMonth(selectedPayment.month, selectedPayment.year)} /></ListItem>
                  <ListItem><ListItemIcon><CalendarToday color="action" /></ListItemIcon><ListItemText primary="Payment Date" secondary={formatDate(selectedPayment.paymentDate || selectedPayment.payment_date)} /></ListItem>
                  <ListItem><ListItemIcon>{getMethodIcon(selectedPayment.mode)}</ListItemIcon><ListItemText primary="Method" secondary={selectedPayment.mode || 'N/A'} /></ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.primary[700] }}>Contact Info</Typography>
                <List dense>
                  <ListItem><ListItemIcon><Phone color="primary" /></ListItemIcon><ListItemText primary="Phone" secondary={getTenantPhone(selectedPayment) || 'N/A'} /></ListItem>
                  <ListItem><ListItemIcon><Person color="primary" /></ListItemIcon><ListItemText primary="Tenant ID" secondary={selectedPayment.tenantId?.slice(-8).toUpperCase() || 'N/A'} /></ListItem>
                  <ListItem><ListItemIcon><Receipt color="primary" /></ListItemIcon><ListItemText primary="Payment ID" secondary={selectedPayment._id?.slice(-8).toUpperCase() || 'N/A'} /></ListItem>
                </List>
              </Grid>

              {(selectedPayment.note || selectedPayment.notes) && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.primary[700] }}>Notes</Typography>
                    <Paper sx={{ p: 2, bgcolor: colors.background.default }}>
                      <Typography variant="body2">{selectedPayment.note || selectedPayment.notes}</Typography>
                    </Paper>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button startIcon={<Download />} onClick={() => downloadReceipt(selectedPayment)}>
            Download
          </Button>
          <Button startIcon={<Print />} onClick={() => printReceipt(selectedPayment)}>
            Print
          </Button>
          <Button variant="contained" startIcon={<Share />} onClick={() => handleShareReceipt(selectedPayment)} sx={{ background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})` }}>
            Share Receipt
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addOpen || editOpen} onClose={() => { setAddOpen(false); setEditOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{addOpen ? 'Record Payment' : 'Edit Payment'}</Typography>
          <IconButton onClick={() => { setAddOpen(false); setEditOpen(false); }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}
          
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Tenant</InputLabel>
                <Select name="tenantId" value={formData.tenantId} onChange={handleFormChange} label="Tenant">
                  <MenuItem value="">Select Tenant</MenuItem>
                  {tenants.map(tenant => (
                    <MenuItem key={tenant._id} value={tenant._id}>
                      {tenant.name} - Room {tenant.roomNumber || 'N/A'} (Rent: {formatCurrency(tenant.monthlyRent)})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Amount (₹)" name="amount" type="number" value={formData.amount} onChange={handleFormChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Payment Month" name="paymentMonth" type="month" value={formData.paymentMonth} onChange={handleFormChange} InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Payment Date" name="paymentDate" type="date" value={formData.paymentDate} onChange={handleFormChange} InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select name="paymentMethod" value={formData.paymentMethod} onChange={handleFormChange} label="Payment Method">
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="GPay">GPay</MenuItem>
                  <MenuItem value="PhonePe">PhonePe</MenuItem>
                  <MenuItem value="Paytm">Paytm</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                  <MenuItem value="NEFT">NEFT</MenuItem>
                  <MenuItem value="IMPS">IMPS</MenuItem>
                  <MenuItem value="Card">Card</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select name="status" value={formData.status} onChange={handleFormChange} label="Status">
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" name="notes" value={formData.notes} onChange={handleFormChange} multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setAddOpen(false); setEditOpen(false); }}>Cancel</Button>
          <Button variant="contained" startIcon={formLoading ? <CircularProgress size={20} /> : <Save />} onClick={() => handleSubmit(addOpen ? 'add' : 'edit')} disabled={formLoading}>
            {addOpen ? 'Record Payment' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning sx={{ color: colors.error }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Delete Payment</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this payment record?
          </Typography>
          <Alert severity="warning">This action cannot be undone. This will remove the payment record from history.</Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={formLoading ? <CircularProgress size={20} /> : <Delete />} onClick={handleDelete} disabled={formLoading}>
            Delete Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payments;
