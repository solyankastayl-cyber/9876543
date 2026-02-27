/**
 * API Client - Single source of truth for all backend communication
 */
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 60000, // 60 seconds for heavy aggregation queries
  headers: {
    'Content-Type': 'application/json',
    // Demo user ID - in production this would come from auth context
    'x-user-id': 'anonymous',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 403:
          console.error('Access blocked:', data.error);
          break;
        case 429:
          console.error('Rate limit exceeded');
          break;
        case 404:
          console.error('Resource not found:', data.error);
          break;
        case 500:
          console.error('Server error:', data.error);
          break;
        default:
          console.error('API error:', data.error || error.message);
      }
    } else if (error.request) {
      console.error('Network error - backend unavailable');
    } else {
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Safe API call wrapper with error handling
 */
export async function apiCall(promise) {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    return {
      ok: false,
      error: error.response?.data?.error || error.message || 'Unknown error',
    };
  }
}

// Legacy simple API helper for new endpoints
export async function apiGet(path) {
  const res = await fetch(`${BACKEND_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${path} - ${res.status}`);
  }
  return res.json();
}
