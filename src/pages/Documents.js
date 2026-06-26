import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  PictureAsPdf,
  Print,
  Visibility,
  Description,
  Person,
  Rule,
  CreditCard,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { tenantService, roomService } from '../services/services';
import { getPgLogoBase64 } from '../utils/logoHelper';
import {
  buildRentAgreementHtml,
  buildApplicationFormHtml,
  buildPropertyRulesHtml,
  buildIdCardHtml,
  fetchDocumentPhotos,
} from '../utils/documentBuilders';
import { formatCurrency, getFloorRank, getRoomNumberValue } from '../utils/formatters';
import { colors } from '../theme';

const TABS = [
  { key: 'rent', label: 'Rent Agreement', icon: <Description /> },
  { key: 'application', label: 'Application Form', icon: <Person /> },
  { key: 'rules', label: 'Property Rules', icon: <Rule /> },
  { key: 'idcard', label: 'ID Card', icon: <CreditCard /> },
];

const Documents = () => {
  const { selectedPg, user, pgs } = useAuth();
  const [activeTab, setActiveTab] = useState('rent');
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('All Floors');
  const [selectedRoom, setSelectedRoom] = useState('All Rooms');
  const [htmlContent, setHtmlContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [logoBase64, setLogoBase64] = useState('');

  const fetchData = useCallback(async () => {
    if (!selectedPg?._id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [tRes, rRes] = await Promise.all([
        tenantService.getAll({ pgId: selectedPg._id, limit: 1000 }),
        roomService.getAll({ pgId: selectedPg._id }),
      ]);
      const tData = tRes?.data?.data || tRes?.data || [];
      const rData = rRes?.data?.data || rRes?.data || [];
      setTenants(Array.isArray(tData) ? tData : []);
      setRooms(Array.isArray(rData) ? rData : []);

      const logo = await getPgLogoBase64(selectedPg._id, pgs || []);
      setLogoBase64(logo || '');
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load tenants and rooms.');
    } finally {
      setLoading(false);
    }
  }, [selectedPg, pgs]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const floorOptions = [
    'All Floors',
    ...Array.from(new Set(rooms.map((r) => r.floor || '1'))).sort(
      (a, b) => getFloorRank(a) - getFloorRank(b)
    ),
  ];

  const roomOptions = [
    'All Rooms',
    ...rooms
      .filter((r) => selectedFloor === 'All Floors' || r.floor === selectedFloor)
      .sort(
        (a, b) =>
          getRoomNumberValue(a.roomNumber || a.room_number) -
          getRoomNumberValue(b.roomNumber || b.room_number)
      )
      .map((r) => r.roomNumber || r.room_number || ''),
  ];

  const roomByNumber = {};
  rooms.forEach((r) => {
    const num = r.roomNumber || r.room_number;
    if (num) roomByNumber[num] = r;
  });

  const filteredTenants = tenants.filter((t) => {
    const roomNum = t.roomNumber || t.room_number;
    const tenantRoom = roomByNumber[roomNum];
    const tenantFloor = tenantRoom?.floor || t.floor;
    const floorMatch = selectedFloor === 'All Floors' || tenantFloor === selectedFloor;
    const roomMatch = selectedRoom === 'All Rooms' || roomNum === selectedRoom;
    return floorMatch && roomMatch;
  });

  const pgInfo = {
    name: selectedPg?.name || 'Your PG',
    address: selectedPg?.address || '',
    phone: selectedPg?.phone || user?.phone || '',
    email: user?.email || '',
    ownerName: user?.name || '',
  };

  const handleGenerate = async () => {
    if (!selectedTenant) {
      setError('Please select a tenant');
      return;
    }
    const tenant = tenants.find((t) => String(t._id || t.id) === String(selectedTenant));
    if (!tenant) return;

    setGenerating(true);
    setError('');
    try {
      let html = '';
      if (activeTab === 'rent') {
        html = buildRentAgreementHtml(tenant, pgInfo, logoBase64);
      } else if (activeTab === 'application') {
        const photos = await fetchDocumentPhotos(tenant);
        html = buildApplicationFormHtml(tenant, photos, pgInfo, logoBase64);
      } else if (activeTab === 'rules') {
        html = buildPropertyRulesHtml(tenant, pgInfo, logoBase64);
      } else if (activeTab === 'idcard') {
        html = buildIdCardHtml(tenant, pgInfo.name, selectedPg?.logo);
      }
      setHtmlContent(html);
      setPreviewOpen(true);
    } catch (err) {
      console.error('Generate error:', err);
      setError('Failed to generate document.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_${selectedTenant}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
          Documents
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generate rent agreements, application forms, property rules, and ID cards
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => {
            setActiveTab(val);
            setHtmlContent('');
            setSelectedTenant('');
            setError('');
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} icon={t.icon} iconPosition="start" />
          ))}
        </Tabs>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Select Tenant
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              {activeTab === 'rent' && (
                <>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Floor</InputLabel>
                    <Select
                      value={selectedFloor}
                      label="Floor"
                      onChange={(e) => {
                        setSelectedFloor(e.target.value);
                        setSelectedRoom('All Rooms');
                        setSelectedTenant('');
                      }}
                    >
                      {floorOptions.map((f) => (
                        <MenuItem key={f} value={f}>{f}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Room</InputLabel>
                    <Select
                      value={selectedRoom}
                      label="Room"
                      onChange={(e) => {
                        setSelectedRoom(e.target.value);
                        setSelectedTenant('');
                      }}
                    >
                      {roomOptions.map((r) => (
                        <MenuItem key={r} value={r}>{r}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Tenant</InputLabel>
                <Select
                  value={selectedTenant}
                  label="Tenant"
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  disabled={loading}
                >
                  {filteredTenants.map((t) => (
                    <MenuItem key={t._id || t.id} value={t._id || t.id}>
                      {t.name || t.tenantName} — {t.roomNumber || t.room_number || 'No room'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                fullWidth
                startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <Visibility />}
                onClick={handleGenerate}
                disabled={generating || !selectedTenant || loading}
                sx={{
                  background: `linear-gradient(135deg, ${colors.primary[700]}, ${colors.primary[800]})`,
                }}
              >
                {generating ? 'Generating...' : 'Preview Document'}
              </Button>
            </CardContent>
          </Card>

          {selectedTenant && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Tenant Details
                </Typography>
                {(() => {
                  const t = tenants.find((x) => String(x._id || x.id) === String(selectedTenant));
                  if (!t) return null;
                  return (
                    <Box>
                      <Typography variant="body2" color="text.secondary">Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>{t.name || t.tenantName}</Typography>
                      <Typography variant="body2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>{t.phone}</Typography>
                      <Typography variant="body2" color="text.secondary">Room</Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>{t.roomNumber || t.room_number || '—'}</Typography>
                      <Typography variant="body2" color="text.secondary">Rent</Typography>
                      <Typography variant="body1">{formatCurrency(t.monthlyRent || t.rent)}</Typography>
                    </Box>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PictureAsPdf sx={{ fontSize: 64, color: colors.primary[200], mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Document Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select a tenant and click "Preview Document" to generate
              </Typography>
              {selectedTenant && (
                <Chip label="Ready to generate" color="primary" size="small" />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Document Preview
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>
                Print / Save PDF
              </Button>
              <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={handleDownload}>
                Download HTML
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              width: '100%',
              height: '70vh',
              border: `1px solid ${colors.border.main}`,
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <iframe
              title="Document Preview"
              srcDoc={htmlContent}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Documents;
