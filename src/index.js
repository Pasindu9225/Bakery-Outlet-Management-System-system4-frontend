import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";
import axios from 'axios';

// Global fetch interceptor to inject JWT token
const { fetch: originalFetch } = window;
const handleUnauthorized = () => {
    // Clear sensitive data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('refreshToken');
    // Only redirect if not already on the login page to avoid loops
    if (window.location.pathname !== '/') {
        window.location.href = '/';
    }
};

window.fetch = async (...args) => {
    let [resource, config] = args;
    const token = localStorage.getItem('authToken');
    
    // Normalize resource to a string or Request object
    let requestUrl = "";
    if (typeof resource === 'string') {
        requestUrl = resource;
    } else if (resource instanceof Request) {
        requestUrl = resource.url;
    } else if (resource instanceof URL) {
        requestUrl = resource.href;
    }

    // Skip auth for login/public endpoints
    const isAuthEndpoint = requestUrl.includes('/bmsauth/');

    if (token && !isAuthEndpoint) {
        if (resource instanceof Request) {
            // If it's a Request object, we must clone it or modify its headers
            if (!resource.headers.has('Authorization')) {
                const newHeaders = new Headers(resource.headers);
                newHeaders.set('Authorization', `Bearer ${token}`);
                resource = new Request(resource, { headers: newHeaders });
                args[0] = resource;
            }
        } else {
            // If it's a URL string or URL object
            config = config || {};
            config.headers = config.headers || {};
            
            if (config.headers instanceof Headers) {
                if (!config.headers.has('Authorization')) {
                    config.headers.set('Authorization', `Bearer ${token}`);
                }
            } else {
                if (!config.headers['Authorization'] && !config.headers['authorization']) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
            }
            args[1] = config;
        }
    }
    
    try {
        const response = await originalFetch(...args);
        
        // Global 401/403 handling with diagnostics
        if (response.status === 401 || response.status === 403) {
            console.warn(`[Fetch Interceptor] HTTP ${response.status} at ${requestUrl}. Token present: ${!!token}`);
        }

        if (response.status === 401 && !isAuthEndpoint) {
            console.error(`[Fetch Interceptor] 401 Unauthorized - redirecting to login.`);
            handleUnauthorized();
        } else if (response.status === 403) {
            console.error(`[Fetch Interceptor] 403 Forbidden - Check role permissions for this endpoint.`);
        }

        
        return response;
    } catch (error) {
        console.error(`Fetch error for ${requestUrl}:`, error);
        throw error;
    }
};


// Global axios interceptor to inject JWT token
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Global axios response interceptor for 401
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            if (error.response.status === 401 && !error.config.url.includes('/bmsauth/emailPasswordAuth')) {
                console.warn(`Unauthorized access (401) via axios to ${error.config.url}, redirecting.`);
                handleUnauthorized();
            } else if (error.response.status === 403) {
                console.error(`Forbidden access (403) via axios to ${error.config.url}. Check role permissions.`);
            }
        }
        return Promise.reject(error);
    }

);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <ThemeProvider>
        <App />
    </ThemeProvider>
);
