import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');

// Networks
export const getNetworks = () => api.get('/networks');

// Entities
export const getEntities = (params = {}) => api.get('/entities', { params });
export const getEntity = (address) => api.get(`/entities/${address}`);

// Transactions
export const getTransactions = (params = {}) => api.get('/transactions', { params });
export const getTransaction = (hash) => api.get(`/transactions/${hash}`);

// Pools
export const getPools = (params = {}) => api.get('/pools', { params });
export const getPool = (address) => api.get(`/pools/${address}`);

// Alerts
export const getAlerts = (params = {}) => api.get('/alerts', { params });

// Flow Graph
export const getFlowGraph = (params = {}) => api.get('/flow-graph', { params });

// Search
export const globalSearch = (q, limit = 10) => api.get('/search', { params: { q, limit } });

// Price History
export const getPriceHistory = (symbol, period = '7d') => 
  api.get(`/price-history/${symbol}`, { params: { period } });

export default api;
