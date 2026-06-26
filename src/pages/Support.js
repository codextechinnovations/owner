import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
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
  Divider,
  Alert,
  CircularProgress,
  Avatar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search,
  Add,
  Visibility,
  Warning,
  CheckCircle,
  Schedule,
  HeadsetMic,
  BugReport,
  Payment,
  Lock,
  Build,
  Person,
  Lightbulb,
  Support as SupportIcon,
  Close,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const ISSUE_TYPES = [
  { value: 'App Crash', label: 'App Crash', icon: BugReport },
  { value: 'Payment Issue', label: 'Payment Issue', icon: Payment },
  { value: 'Login Problem', label: 'Login Problem', icon: Lock },
  { value: 'Slow Performance', label: 'Slow Performance', icon: Schedule },
  { value: 'Maintenance Issue', label: 'Maintenance Issue', icon: Build },
  { value: 'Tenant Issue', label: 'Tenant Issue', icon: Person },
  { value: 'Other', label: 'Other', icon: SupportIcon },
];

const PRIORITIES = [
  { value: 'Low', label: 'Low', color: colors.success },
  { value: 'Medium', label: 'Medium', color: colors.warning },
  { value: 'High', label: 'High', color: colors.error },
];

const STATUS_CONFIG = {
  open: { label: 'Open', color: '#F59E0B', bg: '#FEF3C7', icon: Warning },
  'in-progress': { label: 'In Progress', color: '#1D4ED8', bg: '#DBEAFE', icon: Schedule },
  resolved: { label: 'Resolved', color: '#16A34A', bg: '#DCFCE7', icon: CheckCircle },
};

const initialFormData = {
  title: '',
  issueType: 'Other',
  description: '',
  priority: 'Medium',
};

const Support = () => {
  const { selectedPg, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [selectedPg, activeTab]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/support/owner/${user?._id || user?.id}`);
      if (Array.isArray(response)) {
        setTickets(response);
      } else if (response?.data && Array.isArray(response.data)) {
        setTickets(response.data);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    const map = ['all', 'open', 'in-progress', 'resolved'];
    setStatusFilter(map[newValue] || 'all');
  };

  const handleViewDetail = (ticket) => {
    setSelectedTicket(ticket);
    setDetailOpen(true);
  };

  const handleAddOpen = () => {
    setFormData(initialFormData);
    setFormError('');
    setFormSuccess('');
    setAddOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setFormError('Please enter a title for your issue');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Please describe your issue');
      return;
    }

    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      await api.post('/support', {
        ownerId: user?._id || user?.id,
        ownerName: user?.name || user?.phone || 'Owner',
        ownerPhone: user?.phone || '',
        pgId: selectedPg?._id,
        title: formData.title,
        issueType: formData.issueType,
        description: formData.description,
        priority: formData.priority,
      });
      setFormSuccess('Your support ticket has been submitted! We will get back to you soon.');
      setTimeout(() => {
        setAddOpen(false);
        fetchTickets();
      }, 2000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const getIssueIcon = (issueType) => {
    const issue = ISSUE_TYPES.find((i) => i.value === issueType);
    return issue?.icon || SupportIcon;
  };

  const getPriorityConfig = (priority) => {
    return PRIORITIES.find((p) => p.value === priority) || PRIORITIES[1];
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.open;
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.issueType?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openTickets = tickets.filter((t) => t.status === 'open').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'in-progress').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved').length;

  const statItems = [
    { label: 'Open', value: openTickets, color: colors.warning, icon: Warning, status: 'open', tab: 1 },
    { label: 'In Progress', value: inProgressTickets, color: colors.primary[700], icon: Schedule, status: 'in-progress', tab: 2 },
    { label: 'Resolved', value: resolvedTickets, color: colors.success, icon: CheckCircle, status: 'resolved', tab: 3 },
    { label: 'Response', value: '<24h', color: colors.error, icon: HeadsetMic, status: null, tab: null },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: colors.text.primary, mb: 0.5 }}>
            Support
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            {tickets.length} tickets
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddOpen}
          sx={{ background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})`, borderRadius: 3 }}
        >
          New Ticket
        </Button>
      </Box>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <Grid item xs={6} md={3} key={item.label}>
              <Card
                onClick={() => item.tab !== null && handleTabChange(null, item.tab)}
                sx={{
                  borderRadius: 3,
                  cursor: item.tab !== null ? 'pointer' : 'default',
                  border: '1px solid',
                  borderColor: activeTab === item.tab ? colors.primary[700] : '#F3F4F6',
                  bgcolor: activeTab === item.tab ? `${colors.primary[700]}08` : 'white',
                }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Avatar sx={{ bgcolor: `${item.color}15`, color: item.color, width: 40, height: 40 }}>
                    <Icon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" sx={{ color: colors.text.secondary }}>{item.label}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: item.color, lineHeight: 1.2 }}>{item.value}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Card sx={{ mb: 2, borderRadius: 4 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 1.5 }}>
            <Tab label={`All (${tickets.length})`} />
            <Tab label={`Open (${openTickets})`} />
            <Tab label={`In Progress (${inProgressTickets})`} />
            <Tab label={`Resolved (${resolvedTickets})`} />
          </Tabs>
          <TextField
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: colors.text.secondary }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
        </CardContent>
      </Card>

      {loading ? (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} height={100} sx={{ mb: 2, borderRadius: 3 }} />
            ))}
          </CardContent>
        </Card>
      ) : filteredTickets.length === 0 ? (
        <Card sx={{ borderRadius: 4, textAlign: 'center', py: 6 }}>
          <Avatar sx={{ bgcolor: '#F3F4F6', color: '#9CA3AF', width: 64, height: 64, mx: 'auto', mb: 2 }}>
            <SupportIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" sx={{ color: '#374151', fontWeight: 700, mb: 0.5 }}>
            {tickets.length === 0 ? 'No support tickets yet' : 'No tickets found matching your search'}
          </Typography>
          {tickets.length === 0 && (
            <Button variant="outlined" startIcon={<Add />} onClick={handleAddOpen} sx={{ mt: 2, borderRadius: 3 }}>
              Create Your First Ticket
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filteredTickets.map((ticket) => {
            const priorityConfig = getPriorityConfig(ticket.priority);
            const statusConfig = getStatusConfig(ticket.status);
            const IssueIcon = getIssueIcon(ticket.issueType);
            const StatusIcon = statusConfig.icon;

            return (
              <Grid item xs={12} md={6} key={ticket._id}>
                <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #F3F4F6' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: `${priorityConfig.color}15`, color: priorityConfig.color, width: 44, height: 44 }}>
                        <IssueIcon fontSize="small" />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827', lineHeight: 1.2 }} noWrap>
                          {ticket.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>#{ticket._id?.slice(-8).toUpperCase()}</Typography>
                      </Box>
                      <Chip
                        size="small"
                        icon={<StatusIcon sx={{ fontSize: 14, color: `${statusConfig.color} !important` }} />}
                        label={statusConfig.label}
                        sx={{ bgcolor: statusConfig.bg, color: statusConfig.color, fontWeight: 700, fontSize: '10px' }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                      <Chip size="small" label={ticket.issueType} sx={{ bgcolor: `${colors.primary[700]}15`, color: colors.primary[700], fontWeight: 600, fontSize: '11px' }} />
                      <Chip size="small" label={ticket.priority} sx={{ bgcolor: `${priorityConfig.color}15`, color: priorityConfig.color, fontWeight: 600, fontSize: '11px' }} />
                    </Box>

                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 1.5, lineHeight: 1.5 }} noWrap>
                      {ticket.description}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1.5, borderTop: '1px solid #F3F4F6' }}>
                      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{formatDate(ticket.createdAt)}</Typography>
                      <Button size="small" startIcon={<Visibility />} onClick={() => handleViewDetail(ticket)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}>
                        View
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
          Ticket Details
          {selectedTicket && (
            <Chip
              label={getStatusConfig(selectedTicket.status).label}
              icon={React.createElement(getStatusConfig(selectedTicket.status).icon, { sx: { fontSize: 16 } })}
              sx={{
                bgcolor: getStatusConfig(selectedTicket.status).bg,
                color: getStatusConfig(selectedTicket.status).color,
                fontWeight: 700,
              }}
            />
          )}
          <IconButton onClick={() => setDetailOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTicket && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${getPriorityConfig(selectedTicket.priority).color}15`, color: getPriorityConfig(selectedTicket.priority).color, width: 60, height: 60 }}>
                    {React.createElement(getIssueIcon(selectedTicket.issueType), { sx: { fontSize: 30 } })}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>{selectedTicket.title}</Typography>
                    <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Ticket ID: #{selectedTicket._id?.slice(-8).toUpperCase()}</Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Issue Type</Typography>
                <Chip
                  label={selectedTicket.issueType}
                  icon={React.createElement(getIssueIcon(selectedTicket.issueType), { sx: { fontSize: 16 } })}
                  sx={{ mt: 0.5, bgcolor: `${colors.primary[700]}15`, color: colors.primary[700] }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Priority</Typography>
                <Chip label={selectedTicket.priority} sx={{ mt: 0.5, bgcolor: `${getPriorityConfig(selectedTicket.priority).color}15`, color: getPriorityConfig(selectedTicket.priority).color, fontWeight: 700 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Created</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: '#111827' }}>{formatDate(selectedTicket.createdAt)}</Typography>
              </Grid>

              <Grid item xs={12}><Divider /></Grid>

              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Description</Typography>
                <Paper sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 3, mt: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</Typography>
                </Paper>
              </Grid>

              {selectedTicket.adminNotes && (
                <>
                  <Grid item xs={12}><Divider /></Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Admin Response</Typography>
                    <Paper sx={{ p: 2, bgcolor: '#F0FDF4', borderLeft: '4px solid #10B981', borderRadius: 3, mt: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selectedTicket.adminNotes}</Typography>
                      {selectedTicket.resolvedAt && (
                        <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 1 }}>
                          Resolved on: {formatDate(selectedTicket.resolvedAt)}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)} sx={{ borderRadius: 3 }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
          Create Support Ticket
          <IconButton onClick={() => setAddOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{formSuccess}</Alert>}

          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Subject" name="title" value={formData.title} onChange={handleFormChange} placeholder="Brief summary of your issue" required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Issue Type</InputLabel>
                <Select name="issueType" value={formData.issueType} onChange={handleFormChange} label="Issue Type" sx={{ borderRadius: 3 }}>
                  {ISSUE_TYPES.map((issue) => {
                    const Icon = issue.icon;
                    return (
                      <MenuItem key={issue.value} value={issue.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Icon fontSize="small" /> {issue.label}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select name="priority" value={formData.priority} onChange={handleFormChange} label="Priority" sx={{ borderRadius: 3 }}>
                  {PRIORITIES.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: priority.color }} />
                        {priority.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Description" name="description" value={formData.description} onChange={handleFormChange} multiline rows={4} placeholder="Please describe your issue in detail..." required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddOpen(false)} sx={{ borderRadius: 3 }}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={formLoading ? <CircularProgress size={20} /> : <SupportIcon />}
            onClick={handleSubmit}
            disabled={formLoading || formSuccess}
            sx={{ background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})`, borderRadius: 3 }}
          >
            {formSuccess ? 'Submitted!' : 'Submit Ticket'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Support;
