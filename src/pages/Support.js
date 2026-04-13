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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Search,
  Add,
  Visibility,
  Phone,
  Email,
  Support as SupportIcon,
  Warning,
  CheckCircle,
  Schedule,
  Error as ErrorIcon,
  HeadsetMic,
  BugReport,
  Payment,
  Lock,
  Build,
  Person,
  Lightbulb,
  MoreVert,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const ISSUE_TYPES = [
  { value: 'App Crash', label: 'App Crash', icon: <BugReport /> },
  { value: 'Payment Issue', label: 'Payment Issue', icon: <Payment /> },
  { value: 'Login Problem', label: 'Login Problem', icon: <Lock /> },
  { value: 'Slow Performance', label: 'Slow Performance', icon: <Schedule /> },
  { value: 'Maintenance Issue', label: 'Maintenance Issue', icon: <Build /> },
  { value: 'Tenant Issue', label: 'Tenant Issue', icon: <Person /> },
  { value: 'Other', label: 'Other', icon: <SupportIcon /> },
];

const PRIORITIES = [
  { value: 'Low', label: 'Low', color: colors.success },
  { value: 'Medium', label: 'Medium', color: colors.warning },
  { value: 'High', label: 'High', color: colors.error },
];

const STATUS_CONFIG = {
  'open': { label: 'Open', color: colors.warning, icon: <Warning /> },
  'in-progress': { label: 'In Progress', color: colors.primary[700], icon: <Schedule /> },
  'resolved': { label: 'Resolved', color: colors.success, icon: <CheckCircle /> },
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);

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
    switch (newValue) {
      case 0:
        setStatusFilter('all');
        break;
      case 1:
        setStatusFilter('open');
        break;
      case 2:
        setStatusFilter('in-progress');
        break;
      case 3:
        setStatusFilter('resolved');
        break;
      default:
        setStatusFilter('all');
    }
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
    const issue = ISSUE_TYPES.find(i => i.value === issueType);
    return issue?.icon || <SupportIcon />;
  };

  const getPriorityConfig = (priority) => {
    return PRIORITIES.find(p => p.value === priority) || PRIORITIES[1];
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG['open'];
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
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in-progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
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
          sx={{
            background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})`,
          }}
        >
          New
        </Button>
      </Box>

      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Paper 
            sx={{ 
              p: 1.5, 
              cursor: 'pointer',
              borderLeft: `4px solid ${statusFilter === 'open' ? colors.primary[700] : colors.warning}`,
              bgcolor: statusFilter === 'open' ? `${colors.primary[700]}10` : 'transparent'
            }}
            onClick={() => { setStatusFilter('open'); setActiveTab(1); }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning sx={{ fontSize: 20, color: colors.warning }} />
              <Box>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>Open</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.warning, lineHeight: 1.2 }}>
                  {openTickets}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Paper 
            sx={{ 
              p: 1.5, 
              cursor: 'pointer',
              borderLeft: `4px solid ${statusFilter === 'in-progress' ? colors.primary[700] : colors.primary[700]}`,
              bgcolor: statusFilter === 'in-progress' ? `${colors.primary[700]}10` : 'transparent'
            }}
            onClick={() => { setStatusFilter('in-progress'); setActiveTab(2); }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule sx={{ fontSize: 20, color: colors.primary[700] }} />
              <Box>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>In Progress</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.primary[700] }}>
                  {inProgressTickets}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Paper 
            sx={{ 
              p: 1.5, 
              cursor: 'pointer',
              borderLeft: `4px solid ${statusFilter === 'resolved' ? colors.primary[700] : colors.success}`,
              bgcolor: statusFilter === 'resolved' ? `${colors.primary[700]}10` : 'transparent'
            }}
            onClick={() => { setStatusFilter('resolved'); setActiveTab(3); }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ fontSize: 20, color: colors.success }} />
              <Box>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>Resolved</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.success }}>
                  {resolvedTickets}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Paper sx={{ p: 1.5, bgcolor: `${colors.error}10`, borderLeft: `4px solid ${colors.error}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HeadsetMic sx={{ fontSize: 20, color: colors.error }} />
              <Box>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>Response</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.error }}>
                  {'<'} 24 hrs
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" allowScrollButtonsMobile sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label={`All (${tickets.length})`} />
          <Tab label={`Open (${openTickets})`} />
          <Tab label={`In Progress (${inProgressTickets})`} />
          <Tab label={`Resolved (${resolvedTickets})`} />
        </Tabs>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ width: { xs: '100%', sm: 300 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: colors.text.secondary }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </CardContent>
      </Paper>

      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.border.main }}>
                <TableCell sx={{ fontWeight: 600 }}>Ticket</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Box sx={{ py: 3 }}>
                      <SupportIcon sx={{ fontSize: 48, color: colors.text.secondary, mb: 2 }} />
                      <Typography variant="body1" sx={{ color: colors.text.secondary }}>
                        {tickets.length === 0 ? 'No support tickets yet' : 'No tickets found matching your search'}
                      </Typography>
                      {tickets.length === 0 && (
                        <Button 
                          variant="outlined" 
                          startIcon={<Add />}
                          onClick={handleAddOpen}
                          sx={{ mt: 2 }}
                        >
                          Create Your First Ticket
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((ticket) => {
                    const priorityConfig = getPriorityConfig(ticket.priority);
                    const statusConfig = getStatusConfig(ticket.status);
                    return (
                      <TableRow key={ticket._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                bgcolor: `${priorityConfig.color}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: priorityConfig.color,
                              }}
                            >
                              {getIssueIcon(ticket.issueType)}
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {ticket.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                                #{ticket._id?.slice(-8).toUpperCase()}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ticket.issueType}
                            size="small"
                            sx={{
                              bgcolor: `${colors.primary[700]}15`,
                              color: colors.primary[700],
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ticket.priority}
                            size="small"
                            sx={{
                              bgcolor: `${priorityConfig.color}15`,
                              color: priorityConfig.color,
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusConfig.label}
                            size="small"
                            icon={React.cloneElement(statusConfig.icon, { sx: { fontSize: 16 } })}
                            sx={{
                              bgcolor: `${statusConfig.color}15`,
                              color: statusConfig.color,
                              fontWeight: 500,
                              '& .MuiChip-icon': { color: statusConfig.color },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(ticket.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleViewDetail(ticket)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Ticket Details</Typography>
          {selectedTicket && (
            <Chip
              label={getStatusConfig(selectedTicket.status).label}
              icon={React.cloneElement(getStatusConfig(selectedTicket.status).icon, { sx: { fontSize: 16 } })}
              sx={{
                bgcolor: `${getStatusConfig(selectedTicket.status).color}15`,
                color: getStatusConfig(selectedTicket.status).color,
                fontWeight: 500,
                '& .MuiChip-icon': { color: getStatusConfig(selectedTicket.status).color },
              }}
            />
          )}
        </DialogTitle>
        <DialogContent dividers>
          {selectedTicket && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 3,
                      bgcolor: `${getPriorityConfig(selectedTicket.priority).color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: getPriorityConfig(selectedTicket.priority).color,
                    }}
                  >
                    {React.cloneElement(getIssueIcon(selectedTicket.issueType), { sx: { fontSize: 30 } })}
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {selectedTicket.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                      Ticket ID: #{selectedTicket._id?.slice(-8).toUpperCase()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ color: colors.text.secondary, mb: 1 }}>Issue Type</Typography>
                <Chip
                  label={selectedTicket.issueType}
                  icon={React.cloneElement(getIssueIcon(selectedTicket.issueType), { sx: { fontSize: 16 } })}
                  sx={{
                    bgcolor: `${colors.primary[700]}15`,
                    color: colors.primary[700],
                    '& .MuiChip-icon': { color: colors.primary[700] },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ color: colors.text.secondary, mb: 1 }}>Priority</Typography>
                <Chip
                  label={selectedTicket.priority}
                  sx={{
                    bgcolor: `${getPriorityConfig(selectedTicket.priority).color}15`,
                    color: getPriorityConfig(selectedTicket.priority).color,
                    fontWeight: 500,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ color: colors.text.secondary, mb: 1 }}>Created</Typography>
                <Typography variant="body2">{formatDate(selectedTicket.createdAt)}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: colors.text.secondary, mb: 1 }}>Description</Typography>
                <Paper sx={{ p: 2, bgcolor: colors.background.default }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedTicket.description}
                  </Typography>
                </Paper>
              </Grid>

              {selectedTicket.adminNotes && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ color: colors.text.secondary, mb: 1 }}>Admin Response</Typography>
                    <Paper sx={{ p: 2, bgcolor: `${colors.success}10`, borderLeft: `4px solid ${colors.success}` }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedTicket.adminNotes}
                      </Typography>
                      {selectedTicket.resolvedAt && (
                        <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block', mt: 1 }}>
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
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Create Support Ticket</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}
          
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="Brief summary of your issue"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Issue Type</InputLabel>
                <Select
                  name="issueType"
                  value={formData.issueType}
                  onChange={handleFormChange}
                  label="Issue Type"
                >
                  {ISSUE_TYPES.map(issue => (
                    <MenuItem key={issue.value} value={issue.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {issue.icon}
                        {issue.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleFormChange}
                  label="Priority"
                >
                  {PRIORITIES.map(priority => (
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
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                multiline
                rows={4}
                placeholder="Please describe your issue in detail..."
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            startIcon={formLoading ? <CircularProgress size={20} /> : <SupportIcon />}
            onClick={handleSubmit}
            disabled={formLoading || formSuccess}
            sx={{
              background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})`,
            }}
          >
            {formSuccess ? 'Submitted!' : 'Submit Ticket'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Support;
