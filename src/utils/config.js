// Helper to get the correct API Base URL depending on how the frontend is accessed
export const getApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_BASE_URL;
  if (envUrl) {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      if (envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
        return `http://${window.location.hostname}:8091`;
      }
    }
    return envUrl;
  }
  
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:8091`;
  }
  
  return 'http://localhost:8091';
};

export const BASE_URL = getApiBaseUrl();
