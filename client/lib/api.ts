import axios from 'axios';

// Create a centralized Axios instance
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', // Fallback for local dev ONLY if env is missing
    timeout: 120000, // 2 minutes timeout for Render cold starts
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
