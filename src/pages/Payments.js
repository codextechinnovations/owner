import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Alert,
  Divider,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  Add,
  Download,
  Close,
  WhatsApp,
  Sms,
  Share,
  Delete,
  Receipt,
  CalendarToday,
  Bed,
  Person,
  History,
  AccountBalanceWallet,
  CheckCircle,
  Warning,
  AccessTime,
  ArrowBack,
  ArrowForward,
  CheckCircleOutline,
} from '@mui/icons-material';
import { paymentService, tenantService, bankAccountService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { exportToCsv } from '../utils/exportHelpers';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const YEARS = [2024, 2025, 2026, 2027];

const STAY_FILTERS = [
  { key: 'All', label: 'All Types' },
  { key: 'Daily Stay', label: 'Daily' },
  { key: 'Monthly Stay', label: 'Monthly' },
];

const PAYMENT_MODES = [
  { label: 'Cash', value: 'Cash' },
  { label: 'UPI', value: 'UPI' },
  { label: 'Bank Transfer', value: 'Bank Transfer' },
  { label: 'Card', value: 'Card' },
];

const PAYMENT_TYPES = [
  { label: 'Rent', value: 'rent' },
  { label: 'Deposit / Advance', value: 'deposit' },
];

const AVATAR_COLORS = [
  '#1a1a4e', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#14B8A6', '#F97316',
];

const Payments = () => {
  const navigate = useNavigate();
  const { selectedPg } = useAuth();

  const [tenantsData, setTenantsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stayFilter, setStayFilter] = useState('All');
  const [pendingFilter, setPendingFilter] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderTenant, setReminderTenant] = useState(null);
  const [bankAccount, setBankAccount] = useState(null);
  const [reminderLoading, setReminderLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [tenants, setTenants] = useState([]);
  const [tenantId, setTenantId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('Cash');
  const [paymentType, setPaymentType] = useState('rent');
  const [month, setMonth] = useState('');
  const [notes, setNotes] = useState('');
  const [rentStatus, setRentStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchPaymentsSummary();
  }, [selectedPg, selectedMonth, selectedYear, stayFilter]);

  const fetchPaymentsSummary = async () => {
    if (!selectedPg?._id) return;
    setLoading(true);
    try {
      let urlParams = {
        pgId: selectedPg._id,
        month: selectedMonth,
        year: selectedYear,
      };
      if (stayFilter !== 'All') {
        urlParams.stayType = stayFilter === 'Daily Stay' ? 'daily' : 'monthly';
      }
      const res = await paymentService.getSummary(urlParams);
      let data = [];
      if (res?.data?.data && Array.isArray(res.data.data)) data = res.data.data;
      else if (res?.data?.tenants && Array.isArray(res.data.tenants)) data = res.data.tenants;
      else if (res?.data && Array.isArray(res.data)) data = res.data;
      setTenantsData(data);
    } catch (err) {
      console.error('Failed to fetch payments summary:', err);
      setTenantsData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await tenantService.getAll({ pgId: selectedPg?._id });
      let list = [];
      if (Array.isArray(res)) list = res;
      else if (res?.data && Array.isArray(res.data)) list = res.data;
      setTenants(list.filter((t) => ['active', 'notice_period'].includes(t.status || t.tenantStatus)));
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
      setTenants([]);
    }
  };

  const openAddPayment = () => {
    setAddStep(1);
    setTenantId('');
    setRoomNumber('');
    setMonthlyRent(0);
    setAmount('');
    setMode('Cash');
    setPaymentType('rent');
    setMonth(String(selectedMonth));
    setNotes('');
    setRentStatus(null);
    setFormError('');
    setFormSuccess('');
    fetchTenants();
    setAddOpen(true);
  };

  const handleTenantChange = (id) => {
    setTenantId(id);
    setRentStatus(null);
    const selected = tenants.find((t) => (t._id || t.id) === id);
    if (selected) {
      setRoomNumber(selected.roomNumber || selected.room_number || '');
      const stayType = (selected.stayType || selected.stay_type || selected.rentType || selected.rent_type || 'monthly').toLowerCase();
      if (stayType === 'daily') {
        const rent = selected.rent || selected.dailyRent || selected.rentPerBed || 0;
        setMonthlyRent(rent);
        setAmount(String(rent));
      } else {
        const rent = selected.rent || selected.monthlyRent || 0;
        setMonthlyRent(rent);
        setAmount(String(rent));
      }
      if (month) checkRentStatus(id, month);
    } else {
      setRoomNumber('');
      setMonthlyRent(0);
      setAmount('');
    }
  };

  const handleMonthChange = (m) => {
    setMonth(m);
    setRentStatus(null);
    if (tenantId && m) checkRentStatus(tenantId, m);
  };

  const checkRentStatus = async (tid, m) => {
    if (!tid || !m) return;
    setCheckingStatus(true);
    try {
      const res = await paymentService.getRentStatus({
        tenantId: tid,
        month: parseInt(m),
        year: selectedYear,
      });
      const status = res?.data?.data || res?.data;
      setRentStatus(status);
      if (status?.isFullyPaid) {
        setAmount('0');
      } else if (status?.pendingAmount) {
        setAmount(String(status.pendingAmount));
      }
    } catch (err) {
      console.error('Rent status error:', err);
      setRentStatus(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleNext = () => {
    if (!tenantId) return setFormError('Select a tenant');
    if (!month) return setFormError('Select a month');
    setFormError('');
    setAddStep(2);
  };

  const handleBack = () => {
    setAddStep(1);
  };

  const handleSavePayment = async () => {
    if (!tenantId) return setFormError('Select Tenant');
    if (!amount) return setFormError('Enter amount');
    if (!month) return setFormError('Select month');

    const enteredAmount = parseFloat(amount);
    if (paymentType === 'rent') {
      if (rentStatus?.isFullyPaid) return setFormError('This tenant has already paid the full rent for this month.');
      if (rentStatus && enteredAmount > rentStatus.pendingAmount) {
        return setFormError(`Maximum pending amount is ₹${rentStatus.pendingAmount}.`);
      }
    }

    setSaving(true);
    setFormError('');
    try {
      await paymentService.create({
        tenantId,
        amount: enteredAmount,
        month: parseInt(month),
        year: selectedYear,
        mode: mode || 'Cash',
        type: paymentType,
        paymentDate: new Date().toISOString().split('T')[0],
        notes: notes.trim() || undefined,
        pgId: selectedPg?._id,
      });
      setFormSuccess('Payment recorded successfully!');
      setTimeout(() => {
        setAddOpen(false);
        fetchPaymentsSummary();
      }, 1200);
    } catch (err) {
      console.error('Save payment error:', err);
      setFormError(err.response?.data?.message || err.response?.data?.error || 'Failed to add payment');
    } finally {
      setSaving(false);
    }
  };

  const openHistory = async (tenant) => {
    setSelectedTenant(tenant);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await paymentService.getTenantHistory(tenant._id || tenant.id);
      let data = [];
      if (res?.data && Array.isArray(res.data)) data = res.data;
      else if (res?.data?.data && Array.isArray(res.data.data)) data = res.data.data;
      else if (res?.data?.payments && Array.isArray(res.data.payments)) data = res.data.payments;
      setPaymentHistory(data);
    } catch (err) {
      console.error('History error:', err);
      setPaymentHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const deletePayment = async (payment) => {
    try {
      await paymentService.delete(payment._id || payment.id);
      openHistory(selectedTenant);
      fetchPaymentsSummary();
    } catch (err) {
      console.error('Delete payment error:', err);
    }
  };

  const openReminder = async (tenant) => {
    setReminderTenant(tenant);
    setReminderOpen(true);
    setReminderLoading(true);
    setBankAccount(null);
    try {
      const res = await bankAccountService.getAll(selectedPg?._id);
      const raw = res?.data?.data ?? res?.data ?? res ?? null;
      const data = Array.isArray(raw) ? (raw[0] || null) : raw;
      setBankAccount(data);
    } catch (err) {
      console.error('Bank account error:', err);
      setBankAccount(null);
    } finally {
      setReminderLoading(false);
    }
  };

  const getReminderMessage = (tenant) => {
    const amount = tenant?.balance || 0;
    return `Hey ${tenant?.name || tenant?.tenantName || 'Tenant'}!\n\nPlease pay your dues of ₹ ${amount.toLocaleString('en-IN')}/-.\n\nRegards,\n${selectedPg?.name || 'Your PG'}\npowered by GetYourStay.in`;
  };

  const handleWhatsAppReminder = (tenant) => {
    if (!tenant?.phone) return;
    const qrUrl = bankAccount?.qrCode || '';
    const message = getReminderMessage(tenant) + (qrUrl ? `\n\nScan QR to pay:\n${qrUrl}` : '');
    const clean = String(tenant.phone).replace(/\D/g, '');
    window.open(`https://wa.me/91${clean}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSMSReminder = (tenant) => {
    if (!tenant?.phone) return;
    const qrUrl = bankAccount?.qrCode || '';
    const message = getReminderMessage(tenant) + (qrUrl ? `\n\nScan QR to pay:\n${qrUrl}` : '');
    window.location.href = `sms:${tenant.phone}?body=${encodeURIComponent(message)}`;
  };

  const handleShareReminder = async (tenant) => {
    const message = getReminderMessage(tenant);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Payment Reminder', text: message });
      } catch (err) {
        if (err.name !== 'AbortError') navigator.clipboard.writeText(message);
      }
    } else {
      navigator.clipboard.writeText(message);
    }
  };

  const exportReport = () => {
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const rows = tenantsData.map((t) => `
      <tr>
        <td>${t.name || t.tenantName || '—'}</td>
        <td>${t.room_number || t.roomNumber || '—'}</td>
        <td style="text-align:right;">₹${(t.totalExpected || 0).toLocaleString('en-IN')}</td>
        <td style="text-align:right;">₹${(t.totalPaid || 0).toLocaleString('en-IN')}</td>
        <td style="text-align:right; color:${(t.balance || 0) > 0 ? '#dc2626' : '#16a34a'}; font-weight:700;">₹${(t.balance || 0).toLocaleString('en-IN')}</td>
        <td style="text-align:center;">
          <span class="badge ${(t.balance || 0) > 0 ? 'badge-due' : 'badge-paid'}">${(t.balance || 0) > 0 ? 'DUE' : 'PAID'}</span>
        </td>
      </tr>`).join('');

    const totalCollected = tenantsData.reduce((sum, t) => sum + (t.totalPaid || 0), 0);
    const totalPending = tenantsData.reduce((sum, t) => sum + ((t.balance || 0) > 0 ? t.balance : 0), 0);
    const paidCount = tenantsData.filter((t) => (t.balance || 0) <= 0).length;
    const dueCount = tenantsData.filter((t) => (t.balance || 0) > 0).length;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #1f2937; font-size: 12px; }
          .top-bar { background: #1a1a4e; color: #fff; padding: 16px 28px; display: flex; align-items: center; gap: 14px; }
          .top-bar-title { font-size: 18px; font-weight: 800; }
          .top-bar-sub { font-size: 10px; color: #c7d2fe; margin-top: 2px; }
          .page { padding: 28px; max-width: 800px; margin: 0 auto; }
          .doc-title { text-align: center; color: #1a1a4e; font-size: 20px; font-weight: 800; margin-bottom: 4px; }
          .doc-subtitle { text-align: center; color: #6b7280; font-size: 12px; margin-bottom: 20px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
          .summary-card { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 14px; text-align: center; }
          .summary-label { font-size: 9px; font-weight: 800; color: #1a1a4e; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
          .summary-value { font-size: 18px; font-weight: 900; color: #1a1a4e; }
          .summary-card.danger { background: #fef2f2; border-color: #fecaca; }
          .summary-card.danger .summary-label, .summary-card.danger .summary-value { color: #dc2626; }
          .summary-card.success { background: #f0fdf4; border-color: #bbf7d0; }
          .summary-card.success .summary-label, .summary-card.success .summary-value { color: #16a34a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 12px; }
          thead tr { background: #1a1a4e; }
          thead th { color: #fff; text-align: left; padding: 10px 12px; font-size: 10px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; }
          thead th:nth-child(3), thead th:nth-child(4), thead th:nth-child(5) { text-align: right; }
          thead th:nth-child(6) { text-align: center; }
          tbody td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; }
          tbody td:nth-child(3), tbody td:nth-child(4), tbody td:nth-child(5) { text-align: right; }
          tbody tr:nth-child(even) { background: #f8fafc; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
          .badge-paid { background: #dcfce7; color: #16a34a; }
          .badge-due { background: #fee2e2; color: #dc2626; }
          .total-row { background: #1a1a4e; color: #fff; font-weight: 800; }
          .total-row td { border: none; padding: 12px; }
          .bottom-footer { background: #1a1a4e; color: #fff; text-align: center; padding: 10px 28px; font-size: 10px; }
          .no-data { text-align: center; padding: 30px; color: #6b7280; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="top-bar">
          <div>
            <div class="top-bar-title">${selectedPg?.name || 'My PG'}</div>
            <div class="top-bar-sub">${selectedPg?.address || ''}</div>
          </div>
        </div>
        <div class="page">
          <div class="doc-title">Payment Report</div>
          <div class="doc-subtitle">${stayFilter === 'All' ? 'All Tenants' : stayFilter} · ${MONTHS_FULL[selectedMonth - 1]} ${selectedYear} · Generated on ${today}</div>
          <div class="summary-grid">
            <div class="summary-card success"><div class="summary-label">Paid Tenants</div><div class="summary-value">${paidCount}</div></div>
            <div class="summary-card danger"><div class="summary-label">Due Tenants</div><div class="summary-value">${dueCount}</div></div>
            <div class="summary-card"><div class="summary-label">Total Collected</div><div class="summary-value">₹${totalCollected.toLocaleString('en-IN')}</div></div>
            <div class="summary-card"><div class="summary-label">Total Pending</div><div class="summary-value">₹${totalPending.toLocaleString('en-IN')}</div></div>
          </div>
          ${tenantsData.length === 0 ? '<div class="no-data">No payment records found for the selected period.</div>' : `
          <table>
            <thead><tr><th>Tenant</th><th>Room</th><th style="text-align:right;">Expected</th><th style="text-align:right;">Paid</th><th style="text-align:right;">Balance</th><th style="text-align:center;">Status</th></tr></thead>
            <tbody>${rows}
              <tr class="total-row"><td>TOTAL</td><td></td><td style="text-align:right;">₹${totalCollected.toLocaleString('en-IN')}</td><td></td><td style="text-align:right;">₹${totalPending.toLocaleString('en-IN')}</td><td style="text-align:center;">—</td></tr>
            </tbody>
          </table>`}
        </div>
        <div class="bottom-footer">${selectedPg?.name || 'My PG'} &nbsp;|&nbsp; ${selectedPg?.address || ''} &nbsp;|&nbsp; Generated via ManageYourPG</div>
      </body>
      </html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payment_Report_${MONTHS_FULL[selectedMonth - 1]}_${selectedYear}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareReceipt = (tenant) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const receiptNo = `RCP-${selectedYear}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const txnId = tenant.transactionId || tenant.transaction_id || `TXN-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    const pMethod = tenant.paymentMethod || tenant.payment_method || 'Cash';
    const roomNo = tenant.roomNumber || tenant.room_number || '—';
    const tenantName = tenant.name || tenant.tenantName || 'Unknown';
    const rent = tenant.totalExpected || tenant.amount || 0;
    const paid = tenant.totalPaid || tenant.amount || 0;
    const balance = tenant.balance || 0;
    const isPaid = balance <= 0;
    const billingPeriod = `${MONTHS_FULL[selectedMonth - 1]} ${selectedYear}`;

    const html = `
      <html><head><meta charset="UTF-8"><style>
        body { font-family: Arial, sans-serif; color: #111827; background: #fff; padding: 20px; max-width: 600px; margin: auto; }
        .digital-banner { background: #1a1a4e; color: #fff; text-align: center; padding: 8px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border-radius: 6px 6px 0 0; }
        .header { text-align: center; padding: 20px; border-bottom: 3px solid #1a1a4e; margin-bottom: 16px; }
        .pg-name { font-size: 22px; font-weight: 800; color: #1a1a4e; text-transform: uppercase; }
        .pg-tagline { font-size: 10px; color: #6b7280; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
        .receipt-title { font-size: 18px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 12px; color: #374151; background: #f9fafb; padding: 10px 14px; border-radius: 6px; border: 1px solid #e5e7eb; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 18px; }
        .info-cell { padding: 10px 12px; border-right: 1px solid #e5e7eb; }
        .info-cell:last-child { border-right: none; }
        .info-cell-label { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; background: #f3f4f6; padding: 4px 0; text-align: center; margin: -10px -12px 8px; border-bottom: 1px solid #e5e7eb; }
        .info-cell-value { font-size: 13px; font-weight: 700; color: #111827; }
        .status-paid { color: #16a34a !important; }
        .status-due { color: #dc2626 !important; }
        .section-label { font-size: 11px; font-weight: 800; color: #1a1a4e; text-transform: uppercase; letter-spacing: 1px; border-left: 4px solid #1a1a4e; padding-left: 8px; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 12px; }
        thead tr { background: #1a1a4e; }
        thead th { color: #fff; text-align: left; padding: 9px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        thead th:last-child { text-align: right; }
        tbody td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; }
        tbody td:last-child { text-align: right; font-weight: 600; }
        .divider-row td { border-top: 2px solid #e5e7eb; font-weight: 700; color: #111827; background: #f3f4f6; }
        .total-box { background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
        .total-label { font-size: 10px; font-weight: 700; color: #16a34a; text-transform: uppercase; }
        .total-words { font-size: 11px; color: #374151; font-style: italic; }
        .total-amount { font-size: 24px; font-weight: 900; color: #111827; }
        .txn-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 14px; }
        .txn-cell { padding: 10px 14px; background: #fffbeb; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; }
        .txn-cell:nth-child(2n) { border-right: none; }
        .txn-cell:nth-child(3), .txn-cell:nth-child(4) { border-bottom: none; }
        .txn-cell-label { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
        .txn-cell-value { font-size: 13px; font-weight: 700; color: #111827; }
        .confirmation { text-align: center; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 9px; font-size: 12px; font-weight: 600; color: #1e40af; margin-bottom: 12px; }
        .queries-line { text-align: center; font-size: 10px; color: #6b7280; margin-bottom: 16px; }
        .sig-row { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 14px; border-top: 1px solid #e5e7eb; margin-bottom: 16px; }
        .sig-box { text-align: center; width: 42%; }
        .sig-line { border-top: 1.5px solid #374151; margin-bottom: 5px; height: 30px; }
        .sig-label { font-size: 10px; color: #374151; font-weight: 600; }
        .digital-seal { text-align: center; margin-bottom: 14px; }
        .seal-box { display: inline-block; border: 2px solid #1a1a4e; border-radius: 8px; padding: 8px 24px; background: #f0f4ff; }
        .seal-top { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; }
        .seal-name { font-size: 14px; font-weight: 900; color: #1a1a4e; margin: 2px 0; }
        .seal-verified { font-size: 10px; font-weight: 700; color: #16a34a; }
        .page-footer { text-align: center; font-size: 10px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; line-height: 1.9; }
      </style></head>
      <body>
        <div class="digital-banner">🔒 This is a Digitally Signed Receipt · Verified & Authenticated</div>
        <div class="header">
          <div class="pg-name">${selectedPg?.name || 'My PG'}</div>
          <div class="pg-tagline">Premium Paying Guest Accommodation</div>
          <div class="receipt-title">Payment Receipt</div>
        </div>
        <div class="meta"><div>Receipt No. <strong>${receiptNo}</strong></div><div>Date: <strong>${dateStr}</strong></div></div>
        <div class="info-grid">
          <div class="info-cell"><div class="info-cell-label">Billed To</div><div class="info-cell-value">${tenantName}</div></div>
          <div class="info-cell"><div class="info-cell-label">Room</div><div class="info-cell-value">${roomNo}</div></div>
          <div class="info-cell"><div class="info-cell-label">Billing Period</div><div class="info-cell-value">${billingPeriod}</div></div>
          <div class="info-cell"><div class="info-cell-label">Status</div><div class="info-cell-value ${isPaid ? 'status-paid' : 'status-due'}">${isPaid ? '✓ PAID IN FULL' : '✗ AMOUNT DUE'}</div></div>
        </div>
        <div class="section-label">Payment Breakdown</div>
        <table>
          <thead><tr><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td>Monthly Rent – Room ${roomNo}</td><td>₹${(rent || 0).toLocaleString('en-IN')}</td></tr>
            <tr><td>Advance / Deposit</td><td>₹${(tenant.advanceAmount || tenant.deposit || 0).toLocaleString('en-IN')}</td></tr>
            <tr class="divider-row"><td>Subtotal</td><td>₹${(rent || 0).toLocaleString('en-IN')}</td></tr>
            <tr><td style="color:#16a34a; font-weight:800;">Paid</td><td style="color:#16a34a; font-weight:800;">₹${(paid || 0).toLocaleString('en-IN')}</td></tr>
            <tr><td style="color:${balance > 0 ? '#dc2626' : '#16a34a'}; font-weight:800;">${balance > 0 ? 'Balance Due' : 'Advance Balance'}</td><td style="color:${balance > 0 ? '#dc2626' : '#16a34a'}; font-weight:800;">₹${(balance || 0).toLocaleString('en-IN')}</td></tr>
            <tr><td style="font-weight:700;">Balance Due</td><td style="color:${balance > 0 ? '#dc2626' : '#16a34a'}; font-weight:800;">₹${(balance || 0).toLocaleString('en-IN')}</td></tr>
          </tbody>
        </table>
        <div class="total-box"><div><div class="total-label">Total Amount Paid</div><div class="total-words">${numberToWords(paid)}</div></div><div class="total-amount">Rs. ${(paid || 0).toLocaleString('en-IN')}.00</div></div>
        <div class="section-label">Transaction Details</div>
        <div class="txn-grid">
          <div class="txn-cell"><div class="txn-cell-label">Transaction ID</div><div class="txn-cell-value">${txnId}</div></div>
          <div class="txn-cell"><div class="txn-cell-label">Payment Method</div><div class="txn-cell-value">${pMethod}</div></div>
          <div class="txn-cell"><div class="txn-cell-label">Received By</div><div class="txn-cell-value">Block Manager</div></div>
          <div class="txn-cell"><div class="txn-cell-label">Timestamp</div><div class="txn-cell-value">${dateStr}</div></div>
        </div>
        <div class="confirmation">✓ Payment confirmed. Your account is ${isPaid ? 'clear' : 'not clear'} for this period.</div>
        <div class="queries-line">For any queries, contact us at ${selectedPg?.address || 'the PG premises'}.</div>
        <div class="sig-row"><div class="sig-box"><div class="sig-line"></div><div class="sig-label">Tenant Signature</div></div><div class="sig-box"><div class="sig-line"></div><div class="sig-label">Authorised Signatory</div></div></div>
        <div class="digital-seal"><div class="seal-box"><div class="seal-top">Digitally Signed By</div><div class="seal-name">${selectedPg?.name || 'My PG'} Management</div><div class="seal-verified">🔒 Verified & Authenticated</div></div></div>
        <div class="page-footer"><strong>${selectedPg?.name || 'My PG'}</strong> · Premium PG Accommodation<br/>${selectedPg?.address || 'Bangalore, Karnataka'}<br/><span style="font-size:9px; color:#9ca3af;">This is a computer-generated digitally signed document. No physical signature required.</span></div>
      </body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${tenantName}_${MONTHS_FULL[selectedMonth - 1]}_${selectedYear}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const numberToWords = (amount) => {
    if (amount === 0) return 'Zero Rupees Only';
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const inWords = (num) => {
      if (num < 20) return a[num];
      if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '');
      if (num < 1000) return a[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + inWords(num % 100) : '');
      if (num < 100000) return inWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + inWords(num % 1000) : '');
      if (num < 10000000) return inWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + inWords(num % 100000) : '');
      return inWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + inWords(num % 10000000) : '');
    };
    return inWords(Math.round(amount)) + ' Rupees Only';
  };

  const getDueStatus = (year, month, rentDueDay = 1) => {
    const dueDay = Math.max(1, Math.min(31, rentDueDay || 1));
    const dueDate = new Date(year, month - 1, dueDay);
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = dueDate - today;
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysUntil > 0) return { status: 'DUE_IN', days: daysUntil };
    if (daysUntil === 0) return { status: 'DUE_TODAY', days: 0 };
    return { status: 'OVERDUE', days: Math.abs(daysUntil) };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
  };

  const getInitials = (name = '') => name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

  const avatarColor = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  };

  const filteredTenants = (tenantsData || []).filter((t) => {
    const name = (t.name || t.tenantName || '').toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || (t.phone || '').includes(search);
    const matchesPending = pendingFilter ? (t.balance || 0) > 0 : true;
    const activeStatus = !['moved_out', 'left'].includes(t.status || t.tenantStatus);
    return matchesSearch && matchesPending && activeStatus;
  });

  const totalCollected = tenantsData.reduce((sum, t) => sum + (t.totalPaid || 0), 0);
  const totalPending = tenantsData.reduce((sum, t) => sum + ((t.balance || 0) > 0 ? t.balance : 0), 0);
  const paidCount = tenantsData.filter((t) => (t.balance || 0) <= 0).length;
  const dueCount = tenantsData.filter((t) => (t.balance || 0) > 0).length;

  const selectedTenantForAdd = tenants.find((t) => (t._id || t.id) === tenantId);

  const handleExport = () => {
    exportToCsv('payments', [
      { label: 'Tenant', key: 'name' },
      { label: 'Phone', key: 'phone' },
      { label: 'Room', key: 'roomNumber' },
      { label: 'Monthly Rent', key: (t) => t.monthlyRent || t.rent || 0 },
      { label: 'Paid', key: 'paid' },
      { label: 'Balance', key: 'balance' },
      { label: 'Status', key: (t) => ((t.balance || 0) <= 0 ? 'Paid' : 'Due') },
    ], filteredTenants);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
            Payments
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            {tenantsData.length} tenants
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
            disabled={filteredTenants.length === 0}
            sx={{ borderRadius: 3 }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openAddPayment}
            sx={{ background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})`, borderRadius: 3 }}
          >
            Record
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Month</InputLabel>
                <Select value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(e.target.value)}>
                  {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Year</InputLabel>
                <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(e.target.value)}>
                  {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search tenant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: colors.text.secondary }} /></InputAdornment> }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#10B981', letterSpacing: 0.5 }}>TOTAL PAID</Typography>
              <Avatar sx={{ width: 26, height: 26, bgcolor: '#DCFCE7' }}><CheckCircle sx={{ fontSize: 14, color: '#10B981' }} /></Avatar>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>{formatCurrency(totalCollected)}</Typography>
            <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 500 }}>{paidCount} tenants</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper
            sx={{
              p: 2,
              bgcolor: pendingFilter ? '#FEE2E2' : '#FFF5F5',
              border: pendingFilter ? '2px solid #EF4444' : '1.5px solid #FECACA',
              borderRadius: 3,
              cursor: 'pointer',
            }}
            onClick={() => setPendingFilter((p) => !p)}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#EF4444', letterSpacing: 0.5 }}>PENDING</Typography>
              <Avatar sx={{ width: 26, height: 26, bgcolor: '#FEF2F2' }}><AccessTime sx={{ fontSize: 14, color: '#EF4444' }} /></Avatar>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#EF4444' }}>{formatCurrency(totalPending)}</Typography>
            <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 500 }}>{dueCount} tenants</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 3, cursor: 'pointer' }}
            onClick={() => navigate('/security-deposits')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#E0E7FF', width: 44, height: 44 }}><AccountBalanceWallet sx={{ color: '#1a1a4e' }} /></Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827' }}>Security Deposits</Typography>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>View all tenant deposits</Typography>
              </Box>
            </Box>
            <Button size="small" endIcon={<ArrowForward />}>View</Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Stay Type Filter */}
      <Paper sx={{ display: 'flex', p: 0.5, borderRadius: 4, bgcolor: '#F3F4F6', mb: 2 }}>
        {STAY_FILTERS.map((item) => (
          <Button
            key={item.key}
            fullWidth
            onClick={() => setStayFilter(item.key)}
            sx={{
              py: 1,
              borderRadius: 3,
              bgcolor: stayFilter === item.key ? colors.primary[700] : 'transparent',
              color: stayFilter === item.key ? '#fff' : '#6B7280',
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            {item.label}
          </Button>
        ))}
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<Add />}
          onClick={openAddPayment}
          sx={{ background: colors.primary[700], borderRadius: 3, py: 1.2 }}
        >
          Add Payment
        </Button>
        <Button
          variant="contained"
          fullWidth
          startIcon={<Download />}
          onClick={exportReport}
          sx={{ background: '#10B981', borderRadius: 3, py: 1.2 }}
        >
          Export
        </Button>
      </Box>

      {/* Section Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#111827', letterSpacing: 1, textTransform: 'uppercase' }}>
          {pendingFilter ? 'Pending Tenants' : 'Tenants'}
          {stayFilter !== 'All' && !pendingFilter ? ` (${stayFilter})` : ''}
        </Typography>
        {pendingFilter && (
          <Button size="small" onClick={() => setPendingFilter(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Show All
          </Button>
        )}
      </Box>

      {/* Tenant Cards */}
      {loading ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={140} sx={{ mb: 2, borderRadius: 3 }} />)
      ) : filteredTenants.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Receipt sx={{ fontSize: 40, color: '#D1D5DB' }} />
          <Typography variant="body1" sx={{ color: '#9CA3AF', mt: 1, fontWeight: 600 }}>No payments found</Typography>
        </Card>
      ) : (
        filteredTenants.map((t) => {
          const isPaid = (t.balance || 0) <= 0;
          const dueStatus = !isPaid ? getDueStatus(selectedYear, selectedMonth, t.rentDueDay) : null;
          const isOverdue = dueStatus?.status === 'OVERDUE';
          const isDueToday = dueStatus?.status === 'DUE_TODAY';
          const isDueIn = dueStatus?.status === 'DUE_IN';
          const dueDay = t.rentDueDay || 1;
          const dueDateObj = new Date(selectedYear, selectedMonth - 1, dueDay);
          const dueMonthYear = dueDateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
          const dueDateStr = dueDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          return (
            <Card key={t._id || t.id} sx={{ mb: 2, borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    {t.userPhoto ? (
                      <Box component="img" src={t.userPhoto} alt={t.name} sx={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <Avatar sx={{ width: 46, height: 46, bgcolor: avatarColor(t.name || t.tenantName), fontWeight: 800, fontSize: 15 }}>
                        {getInitials(t.name || t.tenantName)}
                      </Avatar>
                    )}
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827' }}>
                        {t.name || t.tenantName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                        Room {t.roomNumber || t.room_number || '—'}
                      </Typography>
                      {!isPaid && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 12, color: '#64748b' }} />
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>{dueMonthYear}</Typography>
                        </Box>
                      )}
                      <Chip label="Rent" size="small" sx={{ mt: 0.5, bgcolor: '#F0F4FF', color: '#0f2744', fontWeight: 700, fontSize: '0.7rem' }} />
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <IconButton size="small" onClick={() => openHistory(t)} sx={{ mb: 0.5 }}>
                      <History fontSize="small" sx={{ color: '#64748B' }} />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: isPaid ? '#10B981' : '#EF4444', mb: 0.5 }}>
                      {formatCurrency(isPaid ? t.totalPaid : t.balance)}
                    </Typography>
                    <Chip
                      label={isPaid ? 'PAID' : isOverdue ? `OVERDUE ${dueStatus.days}D` : isDueToday ? 'DUE TODAY' : `DUE IN ${dueStatus.days}D`}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        letterSpacing: 0.5,
                        bgcolor: isPaid ? '#F0FDF4' : isOverdue ? '#FEF2F2' : '#FFF5F5',
                        color: isPaid ? '#10B981' : isOverdue ? '#991B1B' : '#EF4444',
                        border: `1px solid ${isPaid ? '#BBF7D0' : isOverdue ? '#EF4444' : '#FECACA'}`,
                      }}
                    />
                    {!isPaid && <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500, display: 'block', mt: 0.5 }}>{dueDateStr}</Typography>}
                  </Box>
                </Box>

                {isPaid ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Share />}
                    onClick={() => shareReceipt(t)}
                    sx={{ borderColor: '#E0E7FF', bgcolor: '#F5F7FF', color: '#1a1a4e', fontWeight: 700, borderRadius: 3 }}
                  >
                    Share Receipt
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Add />}
                      onClick={() => { setReminderTenant(t); openAddPayment(); }}
                      sx={{ bgcolor: '#F97316', fontWeight: 700, borderRadius: 3 }}
                    >
                      Add Payment
                    </Button>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<WhatsApp />}
                      onClick={() => openReminder(t)}
                      sx={{ bgcolor: '#25D366', fontWeight: 700, borderRadius: 3 }}
                    >
                      Remind
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Add Payment Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Record Payment</Typography>
          <IconButton onClick={() => setAddOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}

          {/* Stepper */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, px: 1 }}>
            {[1, 2].map((s, idx) => (
              <React.Fragment key={s}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: addStep >= s ? colors.primary[700] : '#f1f5f9', color: addStep >= s ? '#fff' : '#64748b', fontWeight: 700, fontSize: 14, border: `2px solid ${addStep >= s ? colors.primary[700] : '#e2e8f0'}` }}>
                    {s}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: addStep >= s ? colors.primary[700] : '#64748b' }}>{s === 1 ? 'Tenant' : 'Payment'}</Typography>
                </Box>
                {idx < 1 && <Box sx={{ flex: 1, height: 2, bgcolor: addStep > 1 ? colors.primary[700] : '#e2e8f0', mx: 1 }} />}
              </React.Fragment>
            ))}
          </Box>

          {addStep === 1 ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#f0f4ff', width: 32, height: 32 }}><Person sx={{ fontSize: 16, color: '#0f2744' }} /></Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Select Tenant</Typography>
                  </Box>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tenant *</InputLabel>
                    <Select value={tenantId} label="Tenant *" onChange={(e) => handleTenantChange(e.target.value)}>
                      <MenuItem value="">Choose a tenant</MenuItem>
                      {tenants.map((t) => (
                        <MenuItem key={t._id || t.id} value={t._id || t.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {t.userPhoto ? <Box component="img" src={t.userPhoto} sx={{ width: 24, height: 24, borderRadius: '50%' }} /> : <Avatar sx={{ width: 24, height: 24, bgcolor: avatarColor(t.name || t.tenantName), fontSize: 11 }}>{(t.name || t.tenantName || 'T').slice(0, 1).toUpperCase()}</Avatar>}
                            <Typography variant="body2">{t.name || t.tenantName} (Room {t.roomNumber || t.room_number || '—'})</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedTenantForAdd && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}><Bed sx={{ fontSize: 14, color: '#64748b' }} /><Typography variant="body2" sx={{ color: '#475569' }}>Room {selectedTenantForAdd.roomNumber || selectedTenantForAdd.room_number || '—'}</Typography></Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}><Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>₹</Typography><Typography variant="body2" sx={{ color: '#475569' }}>Expected Rent: {formatCurrency(monthlyRent)}</Typography></Box>
                    </Box>
                  )}
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#fff7ed', width: 32, height: 32 }}><CalendarToday sx={{ fontSize: 16, color: '#ea580c' }} /></Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Payment Period</Typography>
                  </Box>
                  <FormControl fullWidth size="small">
                    <InputLabel>Payment For Month *</InputLabel>
                    <Select value={month} label="Payment For Month *" onChange={(e) => handleMonthChange(e.target.value)} disabled={!tenantId}>
                      <MenuItem value="">Select month</MenuItem>
                      {MONTHS_FULL.map((m, i) => <MenuItem key={m} value={String(i + 1)}>{m}</MenuItem>)}
                    </Select>
                  </FormControl>
                  {checkingStatus && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">Checking payment status...</Typography>
                    </Box>
                  )}
                  {rentStatus && !checkingStatus && (
                    <Alert severity={rentStatus.isFullyPaid ? 'success' : 'warning'} sx={{ mt: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {rentStatus.isFullyPaid ? 'Rent Fully Paid' : 'Partial Payment Due'}
                      </Typography>
                      <Typography variant="body2">Total: {formatCurrency(rentStatus.monthlyRent)} | Paid: {formatCurrency(rentStatus.totalPaid)}</Typography>
                      {!rentStatus.isFullyPaid && <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706' }}>Pending: {formatCurrency(rentStatus.pendingAmount)}</Typography>}
                    </Alert>
                  )}
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#f0fdf4', width: 32, height: 32 }}><Typography sx={{ color: '#059669', fontWeight: 700 }}>₹</Typography></Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Payment Details</Typography>
                  </Box>
                  <TextField
                    fullWidth
                    label="Amount *"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={paymentType === 'rent' && rentStatus?.isFullyPaid}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                    sx={{ mb: 2 }}
                  />
                  {paymentType === 'rent' && rentStatus?.isFullyPaid && (
                    <Typography variant="caption" sx={{ color: '#059669', fontWeight: 500 }}>Rent is fully paid for this month</Typography>
                  )}
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Payment Mode *</InputLabel>
                    <Select value={mode} label="Payment Mode *" onChange={(e) => setMode(e.target.value)}>
                      {PAYMENT_MODES.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Payment Type *</InputLabel>
                    <Select value={paymentType} label="Payment Type *" onChange={(e) => setPaymentType(e.target.value)}>
                      {PAYMENT_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField fullWidth label="Notes (Optional)" multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#f0f4ff', width: 32, height: 32 }}><Receipt sx={{ fontSize: 16, color: '#0f2744' }} /></Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Payment Summary</Typography>
                  </Box>
                  {[
                    { label: 'Tenant', value: selectedTenantForAdd?.name || selectedTenantForAdd?.tenantName || '—' },
                    { label: 'Room', value: roomNumber || '—' },
                    { label: 'Month', value: MONTHS_FULL[parseInt(month) - 1] || '—' },
                    { label: 'Mode', value: mode },
                    { label: 'Type', value: PAYMENT_TYPES.find((t) => t.value === paymentType)?.label },
                  ].map((row) => (
                    <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>{row.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>{row.value}</Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>Total Amount</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#F97316' }}>₹{amount || 0}</Typography>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {addStep === 2 && (
            <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ textTransform: 'none', fontWeight: 700 }}>
              Back
            </Button>
          )}
          {addStep === 1 ? (
            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={handleNext}
              sx={{ background: `linear-gradient(135deg, #f97316, #ea580c)`, textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
            >
              Next: Payment Details
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={saving ? null : <CheckCircleOutline />}
              onClick={handleSavePayment}
              disabled={saving}
              sx={{ background: `linear-gradient(135deg, #f97316, #ea580c)`, textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
            >
              {saving ? 'Processing...' : 'Confirm Payment'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* History Modal */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Payment History</Typography>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              {selectedTenant?.name || selectedTenant?.tenantName} — Room {selectedTenant?.roomNumber || selectedTenant?.room_number || '—'}
            </Typography>
          </Box>
          <IconButton onClick={() => setHistoryOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {historyLoading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}><Skeleton variant="circular" width={40} height={40} sx={{ mx: 'auto' }} /></Box>
          ) : paymentHistory.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Receipt sx={{ fontSize: 40, color: '#D1D5DB' }} />
              <Typography variant="body1" sx={{ color: '#9CA3AF', mt: 1, fontWeight: 600 }}>No payments found</Typography>
            </Box>
          ) : (
            paymentHistory.map((p) => {
              const pDate = p.payment_date
                ? new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—';
              return (
                <Box key={p._id || p.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#F9FAFB', p: 2, borderRadius: 3, mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: '#E0E7FF', width: 38, height: 38, borderRadius: 2.5 }}><Receipt sx={{ fontSize: 18, color: '#1a1a4e' }} /></Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#111827' }}>{formatCurrency(p.amount)}</Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>{MONTHS_FULL[(p.month || 1) - 1]} {p.year} · {p.mode || 'Cash'}</Typography>
                      <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block' }}>{pDate}</Typography>
                    </Box>
                  </Box>
                  <IconButton size="small" onClick={() => deletePayment(p)} sx={{ bgcolor: '#FEF2F2' }}>
                    <Delete fontSize="small" sx={{ color: '#EF4444' }} />
                  </IconButton>
                </Box>
              );
            })
          )}
        </DialogContent>
      </Dialog>

      {/* Reminder Modal */}
      <Dialog open={reminderOpen} onClose={() => setReminderOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Remind to Pay</Typography>
          <IconButton onClick={() => setReminderOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {reminderLoading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}><Skeleton variant="circular" width={40} height={40} sx={{ mx: 'auto' }} /></Box>
          ) : (
            <>
              {reminderTenant && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>{reminderTenant.name || reminderTenant.tenantName}</Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>🛏 Room {reminderTenant.roomNumber || reminderTenant.room_number || '—'}</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#EF4444' }}>{formatCurrency(reminderTenant.balance || 0)}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#6B7280', textAlign: 'center', mb: 0.5 }}>Money will deposit into</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#22c55e' }}>Verified Account</Typography>
                    <CheckCircle sx={{ color: '#22c55e' }} />
                  </Box>
                  {bankAccount?.qrCode ? (
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <Box component="img" src={bankAccount.qrCode} alt="QR" sx={{ width: 220, height: 220, borderRadius: 4, objectFit: 'contain', bgcolor: '#F9FAFB' }} />
                      <Typography variant="caption" sx={{ color: '#6366F1', mt: 1, display: 'block' }}>Scan with a UPI App or Google Lens</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', bgcolor: '#F9FAFB', p: 4, borderRadius: 4, mb: 2 }}>
                      <Typography variant="body1" sx={{ color: '#6B7280', fontWeight: 600 }}>No QR code added</Typography>
                      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Add a bank account QR in Bank Details</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <Button fullWidth variant="contained" startIcon={<Sms />} onClick={() => handleSMSReminder(reminderTenant)} sx={{ bgcolor: '#6366F1', borderRadius: 3, fontWeight: 700 }}>SMS</Button>
                    <Button fullWidth variant="contained" startIcon={<WhatsApp />} onClick={() => handleWhatsAppReminder(reminderTenant)} sx={{ bgcolor: '#25D366', borderRadius: 3, fontWeight: 700 }}>WhatsApp</Button>
                    <Button fullWidth variant="contained" startIcon={<Share />} onClick={() => handleShareReminder(reminderTenant)} sx={{ bgcolor: '#1a1a4e', borderRadius: 3, fontWeight: 700 }}>Share</Button>
                  </Box>
                  <Box sx={{ bgcolor: '#F9FAFB', p: 2, borderRadius: 4 }}>
                    <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Message Preview</Typography>
                    <Typography variant="body2" sx={{ color: '#374151', mt: 1, whiteSpace: 'pre-wrap' }}>{getReminderMessage(reminderTenant)}</Typography>
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Payments;
