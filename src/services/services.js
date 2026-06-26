import api from './api';

export const dashboardService = {
  getStats: async (pgId, month, year) => {
    const params = { pgId };
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await api.get('/dashboard', { params });
    return response.data || response;
  },
};

export const tenantService = {
  getAll: async (params = {}) => {
    return await api.get('/tenants', { params });
  },
  getById: async (id) => {
    return await api.get(`/tenants/${id}`);
  },
  create: async (data) => {
    return await api.post('/tenants', data);
  },
  update: async (id, data) => {
    return await api.put(`/tenants/${id}`, data);
  },
  delete: async (id) => {
    return await api.delete(`/tenants/${id}`);
  },
};

export const roomService = {
  getAll: async (params = {}) => {
    return await api.get('/rooms', { params });
  },
  getById: async (id) => {
    return await api.get(`/rooms/${id}`);
  },
  create: async (data) => {
    return await api.post('/rooms/add', data);
  },
  bulkCreate: async (rooms) => {
    return await api.post('/rooms/bulk-add', { rooms });
  },
  update: async (id, data) => {
    return await api.put(`/rooms/${id}`, data);
  },
  delete: async (id) => {
    return await api.delete(`/rooms/${id}`);
  },
};

export const paymentService = {
  getAll: async (params = {}) => {
    return await api.get('/payments', { params });
  },
  getSummary: async (params = {}) => {
    return await api.get('/payments/summary', { params });
  },
  getTenantHistory: async (tenantId) => {
    return await api.get(`/payments/tenant/${tenantId}`);
  },
  getRentStatus: async (params = {}) => {
    return await api.get('/payments/rent-status', { params });
  },
  getById: async (id) => {
    return await api.get(`/payments/${id}`);
  },
  create: async (data) => {
    return await api.post('/payments', data);
  },
  update: async (id, data) => {
    return await api.put(`/payments/${id}`, data);
  },
  delete: async (id) => {
    return await api.delete(`/payments/${id}`);
  },
};

export const expenseService = {
  getAll: async (params = {}) => {
    return await api.get('/expenses', { params });
  },
  create: async (data) => {
    return await api.post('/expenses', data);
  },
  update: async (id, data) => {
    return await api.put(`/expenses/${id}`, data);
  },
  delete: async (id) => {
    return await api.delete(`/expenses/${id}`);
  },
};

export const pgService = {
  getAll: async () => {
    return await api.get('/pg-owner/pgs');
  },
  getById: async (id) => {
    return await api.get(`/pg-owner/pgs/${id}`);
  },
  create: async (data) => {
    return await api.post('/pg-owner/pgs', data);
  },
  update: async (id, data) => {
    return await api.put(`/pg-owner/pgs/${id}`, data);
  },
};

export const tenantRequestService = {
  getOwnerRequests: async (ownerId) => {
    return await api.get(`/tenantRequest/owner-requests/${ownerId}`);
  },
  getById: async (id) => {
    return await api.get(`/tenantRequest/request/${id}`);
  },
  updateStatus: async (id, data) => {
    return await api.put(`/tenantRequest/request/${id}`, data);
  },
  delete: async (id) => {
    return await api.delete(`/tenantRequest/request/${id}`);
  },
};

export const foodMenuService = {
  getByPg: async (pgId) => {
    return await api.get('/food-menu', { params: { pgId } });
  },
  saveBulk: async (data) => {
    return await api.post('/food-menu/bulk', data);
  },
};

export const bankAccountService = {
  getAll: async (pgId) => {
    return await api.get('/bank-accounts', { params: { pgId } });
  },
  create: async (data) => {
    return await api.post('/bank-accounts', data);
  },
  update: async (id, data) => {
    return await api.put(`/bank-accounts/${id}`, data);
  },
  delete: async (id) => {
    return await api.delete(`/bank-accounts/${id}`);
  },
};

export const noticeService = {
  sendBulk: async (data) => {
    return await api.post('/email/bulk', data);
  },
  sendBulkReminder: async (data) => {
    return await api.post('/payment/reminder-bulk', data);
  },
};

export const walletService = {
  getWallet: async (pgId) => {
    return await api.get(`/wallet/${pgId}`);
  },
  getTransactions: async (pgId, limit = 100) => {
    return await api.get(`/wallet/transactions/${pgId}?limit=${limit}`);
  },
  getAutoReminder: async (pgId) => {
    return await api.get(`/wallet/auto-reminder/${pgId}`);
  },
  updateAutoReminder: async (pgId, data) => {
    return await api.patch(`/wallet/auto-reminder/${pgId}`, data);
  },
};

export const subscriptionService = {
  getStatus: async () => {
    return await api.get('/pg-owner/subscription');
  },
};

export const versionService = {
  check: async () => {
    return await api.get('/app/version?platform=web');
  },
};

export const notificationService = {
  getAll: async (params = {}) => {
    return await api.get('/notifications', { params });
  },
  getUnreadCount: async (params = {}) => {
    return await api.get('/notifications/unread-count', { params });
  },
  markRead: async (id) => {
    return await api.put(`/notifications/${id}/read`);
  },
  delete: async (id) => {
    return await api.delete(`/notifications/${id}`);
  },
};
