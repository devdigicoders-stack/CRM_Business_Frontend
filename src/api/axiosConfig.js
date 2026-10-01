import axios from 'axios';

// Get base URL from .env file (Vite environment variables start with VITE_)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach JWT token if available
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Get token from local storage
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle common errors like 401 Unauthorized
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Optional: Logout user or redirect to login page
            console.error('Unauthorized access. Redirecting to login...');
            localStorage.removeItem('token');
            // window.location.href = '/login'; // Uncomment this to redirect automatically
        }
        return Promise.reject(error);
    }
);

export default apiClient;
