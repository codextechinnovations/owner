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
