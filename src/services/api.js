import axios from 'axios';

const baseUrl = process.env.REACT_APP_BASE_URL;

const axiosInstance = axios.create({
    baseURL: baseUrl
});

// Request interceptor to add the authToken to every request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to extract human-readable error/validation messages from backend
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.data) {
            const data = error.response.data;
            if (typeof data === 'object') {
                if (data.fieldErrors && typeof data.fieldErrors === 'object') {
                    const errors = Object.entries(data.fieldErrors)
                        .map(([field, msg]) => {
                            const formattedField = field
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase());
                            return `${formattedField}: ${msg}`;
                        })
                        .join('\n');
                    error.message = `Validation failed:\n${errors}`;
                } else if (data.message) {
                    error.message = data.message;
                } else if (data.error) {
                    error.message = data.error;
                }
            } else if (typeof data === 'string') {
                error.message = data;
            }
        }

        // Ensure raw SQL/Hibernate technical trace messages are converted to human-readable text
        if (error.message && typeof error.message === 'string') {
            if (error.message.includes('could not execute statement') || error.message.includes('Data truncation') || error.message.includes('SQLState')) {
                if (error.message.includes('Data truncation') || error.message.includes('Data too long')) {
                    error.message = 'Invalid data length: One of the input fields exceeds maximum allowed length.';
                } else {
                    error.message = 'Database operation failed. Please check your inputs and try again.';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
