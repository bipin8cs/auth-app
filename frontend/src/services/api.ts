import axios from 'axios';

// Use VITE_API_URL if set, otherwise use relative URL (same origin)
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add auth token
// Use X-Auth-Token header to avoid conflict with tunnel basic auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers['X-Auth-Token'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = res.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers['X-Auth-Token'] = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; firstName?: string; lastName?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Users API
export const usersApi = {
  list: () => api.get('/users'),
  get: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Roles API
export const rolesApi = {
  list: () => api.get('/roles'),
  create: (data: { name: string; description?: string }) => api.post('/roles', data),
  update: (id: string, data: { name?: string; description?: string }) => api.put(`/roles/${id}`, data),
  delete: (id: string) => api.delete(`/roles/${id}`),
  assignPermissions: (id: string, permissionIds: string[]) =>
    api.post(`/roles/${id}/permissions`, { permissionIds }),
};

// Permissions API
export const permissionsApi = {
  list: () => api.get('/permissions'),
  create: (data: { name: string; description?: string; resource: string; action: string }) =>
    api.post('/permissions', data),
  delete: (id: string) => api.delete(`/permissions/${id}`),
};

// Policies API (ABAC)
export const policiesApi = {
  list: () => api.get('/policies'),
  create: (data: {
    name: string;
    description?: string;
    effect: string;
    resource: string;
    action: string;
    conditions: Record<string, unknown>;
    isActive?: boolean;
  }) => api.post('/policies', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/policies/${id}`, data),
  delete: (id: string) => api.delete(`/policies/${id}`),
};

export default api;
