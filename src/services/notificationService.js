import axios from 'axios';

const API_URL = process.env.REACT_APP_BASE_URL + '/api/v1/notifications';

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};

const notificationService = {
    getNotifications: async () => {
        const response = await axios.get(API_URL, getAuthHeaders());
        return response.data;
    },

    markAsRead: async (id) => {
        await axios.put(`${API_URL}/${id}/read`, {}, getAuthHeaders());
    },

    markAllRead: async () => {
        await axios.put(`${API_URL}/mark-all-read`, {}, getAuthHeaders());
    }
};

export default notificationService;
