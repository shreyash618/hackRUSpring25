// API configuration
// In Vite, environment variables must be prefixed with VITE_ to be exposed
// For local development: VITE_API_URL=http://127.0.0.1:5000
// For production: Set VITE_API_URL in Netlify environment variables to your deployed backend URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
