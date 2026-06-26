import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  PictureAsPdf,
  Print,
  Close,
  People,
  MeetingRoom,
  Receipt,
  TrendingDown,
  TrendingUp,
  AccountBalanceWallet,
  CalendarMonth,
} from '@mui/icons-material';
import {
  tenantService,
  roomService,
  paymentService,
  expenseService,
  pgService,
} from '../services/services';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const YEARS = [2024, 2025, 2026, 2027];

const REPORT_TYPES = [
  { key: 'Tenants', label: 'Tenants Report', icon: People },
  { key: 'Rooms', label: 'Rooms Report', icon: MeetingRoom },
  { key: 'Payments', label: 'Payments Report', icon: Receipt },
  { key: 'Expenses', label: 'Expenses Report', icon: TrendingDown },
  { key: 'Profit', label: 'Profit Report', icon: TrendingUp },
  { key: 'Security Deposit', label: 'Security Deposit Report', icon: AccountBalanceWallet },
];

const buildPageHtml = ({
  pgName,
  pgPhone,
  pgEmail,
  pgAddress,
  reportTitle,
  reportSubtitle,
  reportPeriod,
  statsCards,
  tableHtml,
  footerNote,
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Lato', Arial, sans-serif; background: #f5f6fa; color: #1a1a4e; padding: 0; }
    .header { background: #1a1a4e; color: #fff; padding: 22px 32px 16px; display: flex; justify-content: space-between; align-items: center; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .header-brand { font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .header-brand span { color: #f59e0b; }
    .header-tagline { font-size: 10px; color: #a5b4fc; margin-top: 3px; }
    .header-contact { text-align: right; font-size: 10px; color: #a5b4fc; line-height: 1.8; }
    .title-banner { background: #e8eaf6; border-left: 6px solid #1a1a4e; padding: 18px 32px; }
    .report-label { font-size: 11px; font-weight: 600; letter-spacing: 2px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
    .report-title { font-size: 26px; font-weight: 700; color: #1a1a4e; letter-spacing: 1px; text-transform: uppercase; }
    .report-subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .report-period { display: inline-block; margin-top: 10px; background: #1a1a4e; color: #fff; font-size: 11px; font-weight: 600; letter-spacing: 1px; padding: 4px 14px; border-radius: 20px; }
    .stats-row { display: flex; gap: 16px; padding: 20px 32px; background: #fff; border-bottom: 1px solid #e5e7eb; }
    .stat-card { flex: 1; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 18px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; color: #1a1a4e; line-height: 1; }
    .stat-value.green { color: #10b981; }
    .stat-value.red { color: #ef4444; }
    .stat-value.orange { color: #f59e0b; }
    .stat-label { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }
    .table-wrap { padding: 20px 32px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    thead tr { background: #1a1a4e; color: #fff; }
    thead th { padding: 12px 14px; text-align: left; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody td { padding: 11px 14px; font-size: 12px; color: #374151; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
    .no-data td { text-align: center; color: #9ca3af; padding: 28px; }
    .row-index { width: 36px; font-weight: 700; color: #9ca3af; text-align: center; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    .badge-active { background: #d1fae5; color: #065f46; }
    .badge-inactive { background: #f3f4f6; color: #6b7280; }
    .badge-paid { background: #d1fae5; color: #065f46; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .summary-box { background: #fff; border-radius: 12px; padding: 28px 32px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .summary-row:last-child { border-bottom: none; }
    .profit-line { font-size: 20px; font-weight: 700; margin-top: 8px; }
    .profit-line.green { color: #10b981; }
    .profit-line.red { color: #ef4444; }
    .footer-note { padding: 12px 32px; font-size: 13px; font-weight: 600; color: #374151; background: #fff; border-top: 2px solid #e5e7eb; text-align: right; }
    .page-footer { margin-top: 24px; background: #1a1a4e; color: #a5b4fc; text-align: center; padding: 14px 32px; font-size: 10px; line-height: 1.8; }
    .page-footer strong { color: #fff; }
    .generated { text-align: center; color: #9ca3af; font-size: 10px; padding: 10px 32px 4px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div>
        <div class="header-brand">${pgName || 'My PG'}</div>
        <div class="header-tagline">by Codex Tech Innovations &amp; Consultants LLP</div>
        <div class="header-tagline" style="margin-top:6px;">www.getyourstay.in</div>
      </div>
    </div>
    <div class="header-contact">
      <div><strong style="color:#fff;">${pgName || 'My PG'}</strong></div>
      ${pgAddress ? `<div>${pgAddress}</div>` : ''}
      ${pgPhone ? `<div>Ph: ${pgPhone}</div>` : ''}
      ${pgEmail ? `<div>Email: ${pgEmail}</div>` : ''}
    </div>
  </div>
  <div class="title-banner">
    <div class="report-label">Report</div>
    <div class="report-title">${reportTitle}</div>
    <div class="report-subtitle">${pgName || 'My PG'} &nbsp;&bull;&nbsp; ${reportSubtitle}</div>
    ${reportPeriod ? `<div class="report-period">&#128197; ${reportPeriod}</div>` : ''}
  </div>
  ${statsCards ? `<div class="stats-row">${statsCards}</div>` : ''}
  ${tableHtml}
  ${footerNote ? `<div class="footer-note">${footerNote}</div>` : ''}
  <div class="generated">Generated on: ${new Date().toLocaleString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} &nbsp;|&nbsp; Powered by Get Your Stay</div>
  <div class="page-footer">
    <strong>Get Your Stay</strong> &nbsp;|&nbsp; PG Management Platform<br/>
    Codex Tech Innovations &amp; Consultants LLP &nbsp;|&nbsp; www.getyourstay.in &nbsp;|&nbsp; Bangalore, Karnataka
  </div>
</body>
</html>`;

const statCard = (value, label, colorClass = '') => `
  <div class="stat-card">
    <div class="stat-value ${colorClass}">${value}</div>
    <div class="stat-label">${label}</div>
  </div>`;

const badge = (status) => {
  const s = (status || 'active').toLowerCase();
  if (s === 'active') return '<span class="badge badge-active">ACTIVE</span>';
  if (s === 'inactive') return '<span class="badge badge-inactive">INACTIVE</span>';
  if (s === 'paid') return '<span class="badge badge-paid">PAID</span>';
  if (s === 'pending') return '<span class="badge badge-pending">PENDING</span>';
  return `<span class="badge">${status.toUpperCase()}</span>`;
};

const emptyRow = (cols) => `<tr class="no-data"><td colspan="${cols}">No records found</td></tr>`;

const formatDate = (date) => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return date;
  }
};

const Reports = () => {
  const { selectedPg } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [pgInfo, setPgInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reportHtml, setReportHtml] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPgInfo();
  }, [selectedPg]);

  const fetchPgInfo = async () => {
    if (!selectedPg?._id) return;
    try {
      const res = await pgService.getById(selectedPg._id);
      const pg = res?.data?.data || res?.data || {};
      setPgInfo({
        name: pg.name || selectedPg?.name || 'My PG',
        phone: pg.phone || '',
        email: pg.email || '',
        address: pg.address || selectedPg?.address || '',
      });
    } catch (err) {
      setPgInfo({
        name: selectedPg?.name || 'My PG',
        phone: '',
        email: '',
        address: selectedPg?.address || '',
      });
    }
  };

  const generateReport = async (type) => {
    setLoading(true);
    setError('');
    setReportTitle(`${type} Report`);
    try {
      const pgId = selectedPg?._id;
      if (!pgId) throw new Error('No PG selected');
      const monthName = MONTHS[selectedMonth - 1];
      let html = '';

      if (type === 'Tenants') {
        const res = await tenantService.getAll({ pgId });
        const data = res?.data?.data ?? res?.data ?? res ?? [];
        const tenants = Array.isArray(data) ? data : [];
        const active = tenants.filter((t) => (t.status || 'active').toLowerCase() === 'active').length;
        const inactive = tenants.length - active;
        const rooms = [...new Set(tenants.map((t) => t.roomNumber || t.room_number).filter(Boolean))].length;
        const rows = tenants.length
          ? tenants.map((t, i) => `
              <tr>
                <td class="row-index">${i + 1}</td>
                <td><strong>${t.name || t.tenantName || '-'}</strong><div style="font-size:10px;color:#9ca3af;">Tenant</div></td>
                <td>${t.phone || '-'}</td>
                <td>${t.roomNumber || t.room_number || '-'}</td>
                <td>${formatDate(t.joiningDate || t.checkInDate || t.joining_date)}</td>
                <td>${formatDate(t.checkoutDate)}</td>
                <td>${badge(t.status || t.tenantStatus || 'active')}</td>
              </tr>`).join('')
          : emptyRow(7);
        html = buildPageHtml({
          ...pgInfo,
          reportTitle: 'Tenants Report',
          reportSubtitle: 'Tenant Occupancy Report',
          reportPeriod: `${monthName} ${selectedYear}`,
          statsCards: statCard(tenants.length, 'Total Tenants') + statCard(inactive, 'Inactive', 'red') + statCard(active, 'Active', 'green') + statCard(rooms, 'Rooms Used', 'orange'),
          tableHtml: `<div class="table-wrap"><table><thead><tr><th>#</th><th>Tenant Name</th><th>Phone Number</th><th>Room</th><th>Check-In Date</th><th>Check-Out Date</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`,
          footerNote: `${tenants.length} Total Tenants &nbsp;|&nbsp; ${active} Active &nbsp;|&nbsp; ${inactive} Inactive`,
        });
      } else if (type === 'Payments') {
        const res = await paymentService.getAll({ pgId, month: selectedMonth, year: selectedYear });
        const data = res?.data?.data ?? res?.data ?? res ?? [];
        const payments = Array.isArray(data) ? data : [];
        const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
        const paid = payments.filter((p) => (p.status || 'paid').toLowerCase() === 'paid').length;
        const pending = payments.length - paid;
        const rows = payments.length
          ? payments.map((p, i) => `
              <tr>
                <td class="row-index">${i + 1}</td>
                <td><strong>${p.name || p.tenantName || '-'}</strong></td>
                <td>₹${(p.amount || 0).toLocaleString('en-IN')}</td>
                <td>${p.month || '-'}/${p.year || '-'}</td>
                <td>${formatDate(p.paymentDate || p.payment_date)}</td>
                <td>${p.mode || 'Cash'}</td>
                <td>${badge(p.status || 'paid')}</td>
              </tr>`).join('')
          : emptyRow(7);
        html = buildPageHtml({
          ...pgInfo,
          reportTitle: 'Payments Report',
          reportSubtitle: `${monthName} ${selectedYear}`,
          reportPeriod: `${monthName} ${selectedYear}`,
          statsCards: statCard(payments.length, 'Total Entries') + statCard(paid, 'Paid', 'green') + statCard(pending, 'Pending', 'orange') + statCard(`₹${total.toLocaleString('en-IN')}`, 'Total Collected'),
          tableHtml: `<div class="table-wrap"><table><thead><tr><th>#</th><th>Tenant</th><th>Amount</th><th>Month / Year</th><th>Paid On</th><th>Mode</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`,
          footerNote: `Total Collected: ₹${total.toLocaleString('en-IN')}`,
        });
      } else if (type === 'Expenses') {
        const res = await expenseService.getAll({ pgId, month: selectedMonth });
        const data = res?.data?.data ?? res?.data ?? res ?? [];
        const expenses = Array.isArray(data) ? data : [];
        const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const categories = [...new Set(expenses.map((e) => e.category).filter(Boolean))].length;
        const rows = expenses.length
          ? expenses.map((e, i) => `
              <tr>
                <td class="row-index">${i + 1}</td>
                <td><strong>${e.title || e.expenseTitle || '-'}</strong></td>
                <td>₹${(e.amount || 0).toLocaleString('en-IN')}</td>
                <td>${e.category || '-'}</td>
                <td>${formatDate(e.expenseDate || e.expense_date)}</td>
              </tr>`).join('')
          : emptyRow(5);
        html = buildPageHtml({
          ...pgInfo,
          reportTitle: 'Expenses Report',
          reportSubtitle: `${monthName} ${selectedYear}`,
          reportPeriod: `${monthName} ${selectedYear}`,
          statsCards: statCard(expenses.length, 'Total Expenses') + statCard(categories, 'Categories') + statCard(`₹${total.toLocaleString('en-IN')}`, 'Total Spent', 'red'),
          tableHtml: `<div class="table-wrap"><table><thead><tr><th>#</th><th>Title</th><th>Amount</th><th>Category</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></div>`,
          footerNote: `Total Expenses: ₹${total.toLocaleString('en-IN')}`,
        });
      } else if (type === 'Rooms') {
        const res = await roomService.getAll({ pgId });
        const data = res?.data?.data ?? res?.data ?? res ?? [];
        const rooms = Array.isArray(data) ? data : [];
        const totalBeds = rooms.reduce((s, r) => s + (r.capacity || 0), 0);
        const occupiedBeds = rooms.reduce((s, r) => s + (r.occupiedBeds || r.occupied_beds || 0), 0);
        const vacant = totalBeds - occupiedBeds;
        const rows = rooms.length
          ? rooms.map((r, i) => `
              <tr>
                <td class="row-index">${i + 1}</td>
                <td><strong>${r.roomNumber || r.room_number || '-'}</strong></td>
                <td>${(r.type || r.roomType || '-').toUpperCase()}</td>
                <td>${r.capacity || 0}</td>
                <td>${r.occupiedBeds || r.occupied_beds || 0}</td>
                <td>${(r.capacity || 0) - (r.occupiedBeds || r.occupied_beds || 0)}</td>
                <td>₹${(r.rentPerBed || r.rent_per_bed || 0).toLocaleString('en-IN')}</td>
              </tr>`).join('')
          : emptyRow(7);
        html = buildPageHtml({
          ...pgInfo,
          reportTitle: 'Rooms Report',
          reportSubtitle: 'Room Occupancy Overview',
          reportPeriod: `${monthName} ${selectedYear}`,
          statsCards: statCard(rooms.length, 'Total Rooms') + statCard(totalBeds, 'Total Beds') + statCard(occupiedBeds, 'Occupied', 'red') + statCard(vacant, 'Vacant', 'green'),
          tableHtml: `<div class="table-wrap"><table><thead><tr><th>#</th><th>Room No.</th><th>Type</th><th>Capacity</th><th>Occupied</th><th>Vacant</th><th>Rent / Bed</th></tr></thead><tbody>${rows}</tbody></table></div>`,
          footerNote: `${rooms.length} Rooms &nbsp;|&nbsp; ${occupiedBeds} Occupied Beds &nbsp;|&nbsp; ${vacant} Vacant Beds`,
        });
      } else if (type === 'Profit') {
        const [pRes, eRes] = await Promise.all([
          paymentService.getAll({ pgId, month: selectedMonth, year: selectedYear }),
          expenseService.getAll({ pgId, month: selectedMonth }),
        ]);
        const pData = pRes?.data?.data ?? pRes?.data ?? pRes ?? [];
        const eData = eRes?.data?.data ?? eRes?.data ?? eRes ?? [];
        const payments = Array.isArray(pData) ? pData : [];
        const expenses = Array.isArray(eData) ? eData : [];
        const revenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
        const expTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const profit = revenue - expTotal;
        const isProfit = profit >= 0;
        html = buildPageHtml({
          ...pgInfo,
          reportTitle: 'Profit Report',
          reportSubtitle: `Financial Summary • ${monthName} ${selectedYear}`,
          reportPeriod: `${monthName} ${selectedYear}`,
          statsCards:
            statCard(`₹${revenue.toLocaleString('en-IN')}`, 'Total Revenue', 'green') +
            statCard(`₹${expTotal.toLocaleString('en-IN')}`, 'Total Expenses', 'red') +
            statCard(`₹${Math.abs(profit).toLocaleString('en-IN')}`, isProfit ? 'Net Profit' : 'Net Loss', isProfit ? 'green' : 'red'),
          tableHtml: `
            <div class="table-wrap">
              <div class="summary-box">
                <div class="summary-row"><span>Total Revenue Collected</span><span style="color:#10b981;font-weight:700;">₹${revenue.toLocaleString('en-IN')}</span></div>
                <div class="summary-row"><span>Total Expenses Incurred</span><span style="color:#ef4444;font-weight:700;">₹${expTotal.toLocaleString('en-IN')}</span></div>
                <div class="summary-row"><span>Net ${isProfit ? 'Profit' : 'Loss'}</span><span class="profit-line ${isProfit ? 'green' : 'red'}">${isProfit ? '+' : '-'}₹${Math.abs(profit).toLocaleString('en-IN')}</span></div>
                <div class="summary-row" style="margin-top:8px;"><span style="color:#9ca3af;font-size:12px;">Profit Margin</span><span style="color:#9ca3af;font-size:12px;">${revenue > 0 ? ((profit / revenue) * 100).toFixed(1) + '%' : 'N/A'}</span></div>
              </div>
            </div>`,
          footerNote: null,
        });
      } else if (type === 'Security Deposit') {
        const [tRes, pRes] = await Promise.all([
          tenantService.getAll({ pgId }),
          paymentService.getAll({ pgId, type: 'deposit' }),
        ]);
        const tData = tRes?.data?.data ?? tRes?.data ?? tRes ?? [];
        const tenants = Array.isArray(tData) ? tData : [];
        const pData = pRes?.data?.data ?? pRes?.data ?? pRes ?? [];
        const depositPayments = Array.isArray(pData) ? pData : [];
        const depositDateMap = {};
        depositPayments.forEach((p) => {
          const tid = p.tenant_id || p.tenantId;
          if (tid) depositDateMap[tid.toString()] = p.paymentDate || p.payment_date || p.createdAt || p.created_at;
        });
        const rows = tenants.length
          ? tenants.map((t, i) => `
              <tr>
                <td class="row-index">${i + 1}</td>
                <td><strong>${t.name || t.tenantName || '-'}</strong></td>
                <td>${t.phone || '-'}</td>
                <td>${t.roomNumber || t.room_number || '-'}</td>
                <td>₹${(t.securityDeposit || t.deposit || t.advanceAmount || 0).toLocaleString('en-IN')}</td>
                <td>${formatDate(depositDateMap[(t._id || t.id)?.toString()])}</td>
                <td>${badge(t.status || t.tenantStatus || 'active')}</td>
              </tr>`).join('')
          : emptyRow(7);
        const totalDeposits = tenants.reduce((s, t) => s + (t.securityDeposit || t.deposit || t.advanceAmount || 0), 0);
        const activeDeposits = tenants.filter((t) => (t.status || 'active').toLowerCase() === 'active').reduce((s, t) => s + (t.securityDeposit || t.deposit || t.advanceAmount || 0), 0);
        const vacatedDeposits = tenants.filter((t) => (t.status || '').toLowerCase() === 'moved_out').reduce((s, t) => s + (t.securityDeposit || t.deposit || t.advanceAmount || 0), 0);
        html = buildPageHtml({
          ...pgInfo,
          reportTitle: 'Security Deposit Report',
          reportSubtitle: 'Tenant Deposit Summary',
          reportPeriod: `${monthName} ${selectedYear}`,
          statsCards:
            statCard(tenants.length, 'Total Tenants') +
            statCard(`₹${totalDeposits.toLocaleString('en-IN')}`, 'Total Deposits') +
            statCard(`₹${activeDeposits.toLocaleString('en-IN')}`, 'Held (Active)', 'orange') +
            statCard(`₹${vacatedDeposits.toLocaleString('en-IN')}`, 'To Refund', 'red'),
          tableHtml: `<div class="table-wrap"><table><thead><tr><th>#</th><th>Tenant Name</th><th>Phone Number</th><th>Room</th><th>Security Deposit</th><th>Deposit Paid On</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`,
          footerNote: `Total Security Deposits: ₹${totalDeposits.toLocaleString('en-IN')}`,
        });
      }

      setReportHtml(html);
      setPreviewOpen(true);
    } catch (err) {
      console.error('Report generation error:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportTitle.replace(/\s+/g, '_')}_${MONTHS[selectedMonth - 1]}_${selectedYear}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
            Reports
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Generate printable reports
          </Typography>
        </Box>
      </Box>

      {/* Month/Year Selectors */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#374151' }}>
            <CalendarMonth sx={{ verticalAlign: 'middle', mr: 1, fontSize: 20 }} />
            Select Period
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Month</InputLabel>
              <Select value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(e.target.value)}>
                {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Year</InputLabel>
              <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(e.target.value)}>
                {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Report Buttons */}
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#374151' }}>
        Generate Report
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        [...Array(6)].map((_, i) => <Skeleton key={i} variant="rounded" height={56} sx={{ mb: 1.5, borderRadius: 3 }} />)
      ) : (
        REPORT_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <Button
              key={type.key}
              variant="contained"
              fullWidth
              startIcon={<Icon />}
              onClick={() => generateReport(type.key)}
              sx={{
                mb: 1.5,
                py: 1.5,
                borderRadius: 3,
                justifyContent: 'flex-start',
                pl: 3,
                bgcolor: colors.primary[700],
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                '&:hover': { bgcolor: colors.primary[800] },
              }}
            >
              {type.label}
            </Button>
          );
        })
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth sx={{ '& .MuiDialog-paper': { height: '90vh' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{reportTitle}</Typography>
          <IconButton onClick={() => setPreviewOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#f5f6fa' }}>
          <Box
            component="iframe"
            srcDoc={reportHtml}
            sx={{ width: '100%', height: '100%', border: 'none' }}
            title="Report Preview"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button startIcon={<PictureAsPdf />} onClick={handleDownload} variant="outlined">
            Download HTML
          </Button>
          <Button startIcon={<Print />} onClick={handlePrint} variant="contained" sx={{ background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})` }}>
            Print / Save as PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;
