import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  LinearProgress,
  Chip,
  Divider,
  Button,
  Menu,
  ListItemIcon,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  People,
  MeetingRoom,
  Receipt,
  AccountBalanceWallet,
  Warning,
  CheckCircle,
  Download,
  Print,
  PictureAsPdf,
  FileDownload,
  MoreVert,
  CalendarMonth,
  Home,
  Hotel,
} from '@mui/icons-material';
import { dashboardService } from '../services/services';
import { paymentService } from '../services/services';
import { expenseService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const Reports = () => {
  const { selectedPg } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportData, setReportData] = useState(null);
  const [monthlyPayments, setMonthlyPayments] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [exportAnchor, setExportAnchor] = useState(null);

  const months = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    months.push({ value, label });
  }

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, selectedPg]);

  const fetchReportData = async () => {
    setLoading(true);
    const [year, month] = selectedMonth.split('-');

    try {
      const [dashboardRes, paymentRes, expenseRes] = await Promise.all([
        dashboardService.getStats(selectedPg?._id, month, year),
        paymentService.getAll({ pgId: selectedPg?._id, month, year }),
        expenseService.getAll({ pgId: selectedPg?._id, month }),
      ]);

      const payments = Array.isArray(paymentRes) ? paymentRes : (paymentRes?.data || []);
      const expenses = Array.isArray(expenseRes) ? expenseRes : (expenseRes?.data || []);
      const dashboard = dashboardRes?.data || dashboardRes || {};

      const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const expectedRent = dashboard.expectedRent || 0;
      const profit = totalCollected - totalExpenses;

      setReportData({
        activeTenants: dashboard.activeTenants || 0,
        totalRooms: dashboard.vacantRooms || 0,
        totalBeds: dashboard.totalBeds || 0,
        occupiedBeds: dashboard.occupiedBeds || 0,
        occupancyRate: dashboard.occupancyRate || 0,
        totalCollected,
        totalExpenses,
        expectedRent,
        profit,
        collectedPercentage: expectedRent ? Math.round((totalCollected / expectedRent) * 100) : 0,
      });

      const tenantPayments = {};
      payments.forEach(p => {
        const tenantName = p.tenantName || p.name || 'Unknown';
        if (!tenantPayments[tenantName]) {
          tenantPayments[tenantName] = { name: tenantName, amount: 0, payments: 0, tenantId: p.tenantId || p.tenant_id };
        }
        tenantPayments[tenantName].amount += p.amount || 0;
        tenantPayments[tenantName].payments += 1;
      });
      setMonthlyPayments(Object.values(tenantPayments).sort((a, b) => b.amount - a.amount));

      const categoryExpenses = {};
      expenses.forEach(e => {
        const cat = e.category || 'Other';
        if (!categoryExpenses[cat]) {
          categoryExpenses[cat] = { category: cat, amount: 0, count: 0 };
        }
        categoryExpenses[cat].amount += e.amount || 0;
        categoryExpenses[cat].count += 1;
      });
      setMonthlyExpenses(Object.values(categoryExpenses).sort((a, b) => b.amount - a.amount));
      setAllPayments(payments);
      setAllExpenses(expenses);

    } catch (err) {
      console.error('Failed to fetch report data:', err);
      setReportData({
        activeTenants: 0,
        totalRooms: 0,
        totalBeds: 0,
        occupiedBeds: 0,
        occupancyRate: 0,
        totalCollected: 0,
        totalExpenses: 0,
        expectedRent: 0,
        profit: 0,
        collectedPercentage: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatMonth = (monthStr) => {
    if (!monthStr) return 'N/A';
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      'Maintenance': '#f59e0b',
      'Utilities': '#3b82f6',
      'Groceries': '#10b981',
      'Salary': '#8b5cf6',
      'Rent': '#ec4899',
      'Other': '#6b7280',
    };
    return colorMap[category] || colors.primary[700];
  };

  const exportToCSV = () => {
    setExportAnchor(null);
    const monthLabel = formatMonth(selectedMonth);
    const rows = [
      ['PG Monthly Financial Report'],
      ['Generated on:', new Date().toLocaleString('en-IN')],
      [''],
      ['MONTHLY SUMMARY'],
      ['Total Collected', reportData?.totalCollected || 0],
      ['Total Expenses', reportData?.totalExpenses || 0],
      ['Net Profit/Loss', reportData?.profit || 0],
      ['Expected Rent', reportData?.expectedRent || 0],
      ['Pending Amount', (reportData?.expectedRent || 0) - (reportData?.totalCollected || 0)],
      [''],
      ['OCCUPANCY DETAILS'],
      ['Active Tenants', reportData?.activeTenants || 0],
      ['Occupancy Rate', `${reportData?.occupancyRate || 0}%`],
      ['Occupied Beds', reportData?.occupiedBeds || 0],
      ['Total Beds', reportData?.totalBeds || 0],
      [''],
      ['PAYMENT COLLECTION'],
      ['Tenant Name', 'Amount Paid', 'Number of Payments'],
      ...monthlyPayments.map(p => [p.name, p.amount, p.payments]),
      [''],
      ['EXPENSES BY CATEGORY'],
      ['Category', 'Amount', 'Count'],
      ...monthlyExpenses.map(e => [e.category, e.amount, e.count]),
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PG_Report_${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPrint = () => {
    setExportAnchor(null);
    const monthLabel = formatMonth(selectedMonth);
    const pendingAmount = (reportData?.expectedRent || 0) - (reportData?.totalCollected || 0);
    const isProfit = (reportData?.profit || 0) >= 0;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>PG Report - ${monthLabel}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', Arial, sans-serif; padding: 30px; background: #fff; color: #1a1a2e; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #0e7f72; }
          .header h1 { color: #0e7f72; font-size: 28px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .summary-card { padding: 20px; border-radius: 12px; text-align: center; }
          .summary-card.success { background: linear-gradient(135deg, #d1fae5, #a7f3d0); border: 1px solid #10b981; }
          .summary-card.danger { background: linear-gradient(135deg, #fee2e2, #fecaca); border: 1px solid #ef4444; }
          .summary-card.warning { background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1px solid #f59e0b; }
          .summary-card.primary { background: linear-gradient(135deg, #dbeafe, #bfdbfe); border: 1px solid #3b82f6; }
          .summary-card h3 { font-size: 28px; font-weight: 700; margin-bottom: 5px; }
          .summary-card p { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 16px; font-weight: 600; color: #0e7f72; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #0e7f72; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
          th { background: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #666; }
          tr:nth-child(even) { background: #f9fafb; }
          .amount { font-weight: 600; }
          .amount.success { color: #10b981; }
          .amount.danger { color: #ef4444; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .badge.success { background: #d1fae5; color: #059669; }
          .badge.danger { background: #fee2e2; color: #dc2626; }
          .badge.warning { background: #fef3c7; color: #d97706; }
          .progress-bar { width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
          .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
          .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
          .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #999; font-size: 11px; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PG Monthly Financial Report</h1>
          <p>${selectedPg?.name || 'PG Name'} | ${monthLabel}</p>
          <p style="margin-top: 8px; font-size: 12px;">Generated on ${new Date().toLocaleString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-card success">
            <h3 style="color: #059669;">₹${(reportData?.totalCollected || 0).toLocaleString()}</h3>
            <p>Total Collected</p>
          </div>
          <div class="summary-card danger">
            <h3 style="color: #dc2626;">₹${(reportData?.totalExpenses || 0).toLocaleString()}</h3>
            <p>Total Expenses</p>
          </div>
          <div class="summary-card ${isProfit ? 'success' : 'danger'}">
            <h3 style="color: ${isProfit ? '#059669' : '#dc2626'};">₹${Math.abs(reportData?.profit || 0).toLocaleString()}</h3>
            <p>${isProfit ? 'Net Profit' : 'Net Loss'}</p>
          </div>
          <div class="summary-card warning">
            <h3 style="color: #d97706;">₹${pendingAmount.toLocaleString()}</h3>
            <p>Pending Amount</p>
          </div>
        </div>

        <div class="two-col">
          <div class="section">
            <div class="section-title">📊 Rent Collection Status</div>
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 13px; color: #666;">Collection Rate</span>
                <span style="font-weight: 600;">${reportData?.collectedPercentage || 0}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${reportData?.collectedPercentage || 0}%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
              </div>
            </div>
            <table>
              <tr><td style="color: #666;">Expected Rent</td><td class="amount" style="text-align: right;">₹${(reportData?.expectedRent || 0).toLocaleString()}</td></tr>
              <tr><td style="color: #666;">Amount Collected</td><td class="amount success" style="text-align: right;">₹${(reportData?.totalCollected || 0).toLocaleString()}</td></tr>
              <tr><td style="color: #666;">Pending Amount</td><td class="amount danger" style="text-align: right;">₹${pendingAmount.toLocaleString()}</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">🏠 Occupancy Overview</div>
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 13px; color: #666;">Occupancy Rate</span>
                <span style="font-weight: 600;">${reportData?.occupancyRate || 0}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${reportData?.occupancyRate || 0}%; background: linear-gradient(90deg, #0e7f72, #1dcfba);"></div>
              </div>
            </div>
            <table>
              <tr><td style="color: #666;">Active Tenants</td><td class="amount" style="text-align: right;">${reportData?.activeTenants || 0}</td></tr>
              <tr><td style="color: #666;">Occupied Beds</td><td class="amount success" style="text-align: right;">${reportData?.occupiedBeds || 0}</td></tr>
              <tr><td style="color: #666;">Vacant Beds</td><td class="amount danger" style="text-align: right;">${(reportData?.totalBeds || 0) - (reportData?.occupiedBeds || 0)}</td></tr>
            </table>
          </div>
        </div>

        <div class="section">
          <div class="section-title">💰 Payment Collection by Tenant</div>
          <table>
            <thead><tr><th>Tenant</th><th style="text-align: right;">Amount Paid</th><th style="text-align: center;">Payments</th><th style="text-align: right;">Status</th></tr></thead>
            <tbody>
              ${monthlyPayments.length > 0 ? monthlyPayments.map(p => `
                <tr>
                  <td><strong>${p.name}</strong></td>
                  <td class="amount success" style="text-align: right;">₹${p.amount.toLocaleString()}</td>
                  <td style="text-align: center;">${p.payments}</td>
                  <td style="text-align: right;"><span class="badge success">✓ Paid</span></td>
                </tr>
              `).join('') : '<tr><td colspan="4" style="text-align: center; color: #999;">No payments recorded</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">📋 Expenses by Category</div>
          <table>
            <thead><tr><th>Category</th><th style="text-align: right;">Amount</th><th style="text-align: center;">Count</th><th style="text-align: right;">% Share</th></tr></thead>
            <tbody>
              ${monthlyExpenses.length > 0 ? monthlyExpenses.map(e => {
                const percentage = reportData?.totalExpenses ? Math.round((e.amount / reportData.totalExpenses) * 100) : 0;
                return `
                  <tr>
                    <td><strong>${e.category}</strong></td>
                    <td class="amount danger" style="text-align: right;">₹${e.amount.toLocaleString()}</td>
                    <td style="text-align: center;">${e.count}</td>
                    <td style="text-align: right;"><span class="badge warning">${percentage}%</span></td>
                  </tr>
                `;
              }).join('') : '<tr><td colspan="4" style="text-align: center; color: #999;">No expenses recorded</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>PG Management System | CodeX Tech Innovations & Consultants LLP</p>
          <p style="margin-top: 5px;">This is a computer-generated report. No signature required.</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const exportToPDF = () => {
    setExportAnchor(null);
    exportToPrint();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const pendingAmount = (reportData?.expectedRent || 0) - (reportData?.totalCollected || 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
            Financial Reports
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            {selectedPg?.name} | {formatMonth(selectedMonth)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Month</InputLabel>
            <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} label="Month">
              {months.map(m => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" size="small" startIcon={<Download />} onClick={(e) => setExportAnchor(e.currentTarget)}>
            Export
          </Button>
          <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
            <MenuItem onClick={exportToCSV}>
              <ListItemIcon><FileDownload fontSize="small" /></ListItemIcon>
              <ListItemText>Export as CSV</ListItemText>
            </MenuItem>
            <MenuItem onClick={exportToPDF}>
              <ListItemIcon><PictureAsPdf fontSize="small" /></ListItemIcon>
              <ListItemText>Export as PDF</ListItemText>
            </MenuItem>
            <MenuItem onClick={exportToPrint}>
              <ListItemIcon><Print fontSize="small" /></ListItemIcon>
              <ListItemText>Print Report</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* Summary Cards */}
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', border: '1px solid #10b981' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <AttachMoney sx={{ fontSize: 40, color: '#059669', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#059669' }}>
                {formatCurrency(reportData?.totalCollected)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#059669', fontWeight: 500 }}>
                Total Collected
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)', border: '1px solid #ef4444' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Receipt sx={{ fontSize: 40, color: '#dc2626', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#dc2626' }}>
                {formatCurrency(reportData?.totalExpenses)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 500 }}>
                Total Expenses
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ background: (reportData?.profit || 0) >= 0 ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'linear-gradient(135deg, #fee2e2, #fecaca)', border: `1px solid ${(reportData?.profit || 0) >= 0 ? '#10b981' : '#ef4444'}` }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              {(reportData?.profit || 0) >= 0 ? <TrendingUp sx={{ fontSize: 40, color: '#059669', mb: 1 }} /> : <TrendingDown sx={{ fontSize: 40, color: '#dc2626', mb: 1 }} />}
              <Typography variant="h4" sx={{ fontWeight: 800, color: (reportData?.profit || 0) >= 0 ? '#059669' : '#dc2626' }}>
                {formatCurrency(reportData?.profit)}
              </Typography>
              <Typography variant="body2" sx={{ color: (reportData?.profit || 0) >= 0 ? '#059669' : '#dc2626', fontWeight: 500 }}>
                Net Profit/Loss
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #f59e0b' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Warning sx={{ fontSize: 40, color: '#d97706', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#d97706' }}>
                {formatCurrency(pendingAmount)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#d97706', fontWeight: 500 }}>
                Pending Amount
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Rent Collection & Occupancy */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Rent Collection</Typography>
                <Chip label={`${reportData?.collectedPercentage || 0}%`} size="small" sx={{ bgcolor: `${colors.success}15`, color: colors.success, fontWeight: 600 }} />
              </Box>
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="determinate" value={reportData?.collectedPercentage || 0} sx={{ height: 12, borderRadius: 6, bgcolor: `${colors.success}20`, '& .MuiLinearProgress-bar': { bgcolor: colors.success, borderRadius: 6 } }} />
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ color: colors.text.secondary }}>Expected</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{formatCurrency(reportData?.expectedRent)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ color: colors.text.secondary }}>Collected</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: colors.success }}>{formatCurrency(reportData?.totalCollected)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ color: colors.text.secondary }}>Pending</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: colors.error }}>{formatCurrency(pendingAmount)}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Occupancy</Typography>
                <Chip label={`${reportData?.occupancyRate || 0}%`} size="small" sx={{ bgcolor: `${colors.primary[700]}15`, color: colors.primary[700], fontWeight: 600 }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress variant="determinate" value={100} size={100} thickness={4} sx={{ color: colors.border.main }} />
                  <CircularProgress variant="determinate" value={reportData?.occupancyRate || 0} size={100} thickness={4} sx={{ position: 'absolute', color: colors.primary[700], '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
                  <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{reportData?.occupancyRate || 0}%</Typography>
                  </Box>
                </Box>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                  <People sx={{ color: colors.success, mb: 0.5 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{reportData?.occupiedBeds || 0}</Typography>
                  <Typography variant="caption" sx={{ color: colors.text.secondary }}>Occupied</Typography>
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                  <MeetingRoom sx={{ color: colors.text.secondary, mb: 0.5 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{reportData?.activeTenants || 0}</Typography>
                  <Typography variant="caption" sx={{ color: colors.text.secondary }}>Tenants</Typography>
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'center' }}>
                  <Home sx={{ color: colors.warning, mb: 0.5 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{(reportData?.totalBeds || 0) - (reportData?.occupiedBeds || 0)}</Typography>
                  <Typography variant="caption" sx={{ color: colors.text.secondary }}>Vacant</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Collection Table */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Payment Collection by Tenant</Typography>
              {monthlyPayments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Receipt sx={{ fontSize: 40, color: colors.text.secondary, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: colors.text.secondary }}>No payments recorded</Typography>
                </Box>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: `${colors.primary[700]}10` }}>
                        <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Payments</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthlyPayments.slice(0, 8).map((p, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 28, height: 28, bgcolor: colors.success, fontSize: 12 }}>{p.name.charAt(0)}</Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600, color: colors.success }}>{formatCurrency(p.amount)}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={p.payments} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Expenses by Category */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Expenses by Category</Typography>
              {monthlyExpenses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: 40, color: colors.text.secondary, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: colors.text.secondary }}>No expenses recorded</Typography>
                </Box>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: `${colors.primary[700]}10` }}>
                        <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthlyExpenses.map((e, idx) => {
                        const percentage = reportData?.totalExpenses ? Math.round((e.amount / reportData.totalExpenses) * 100) : 0;
                        return (
                          <TableRow key={idx} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getCategoryColor(e.category) }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{e.category}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.error }}>{formatCurrency(e.amount)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip label={`${percentage}%`} size="small" sx={{ bgcolor: `${getCategoryColor(e.category)}20`, color: getCategoryColor(e.category) }} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Summary Footer */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: colors.primary[700], color: 'white' }}>
            <CardContent sx={{ py: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={6} md={3} sx={{ textAlign: 'center', borderRight: { md: '1px solid rgba(255,255,255,0.2)' } }}>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{reportData?.activeTenants || 0}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Active Tenants</Typography>
                </Grid>
                <Grid item xs={6} md={3} sx={{ textAlign: 'center', borderRight: { md: '1px solid rgba(255,255,255,0.2)' } }}>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{formatCurrency(reportData?.totalCollected)}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Collected</Typography>
                </Grid>
                <Grid item xs={6} md={3} sx={{ textAlign: 'center', borderRight: { md: '1px solid rgba(255,255,255,0.2)' } }}>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{formatCurrency(reportData?.totalExpenses)}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Expenses</Typography>
                </Grid>
                <Grid item xs={6} md={3} sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: (reportData?.profit || 0) >= 0 ? '#a7f3d0' : '#fecaca' }}>{formatCurrency(reportData?.profit)}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Net Profit/Loss</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
