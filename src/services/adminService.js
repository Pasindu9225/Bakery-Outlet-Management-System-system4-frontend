import axiosInstance from './api';

const baseUrl = process.env.REACT_APP_BASE_URL;

const adminService = {
    // Products
    getProducts: async () => {
        const response = await axiosInstance.get(`${baseUrl}/api/v1/admin/product/all`);
        return response.data;
    },

    // Discount Rules
    getDiscounts: async () => {
        const response = await axiosInstance.get(`${baseUrl}/api/v1/admin/discounts`);
        return response.data;
    },
    createDiscount: async (data) => {
        const response = await axiosInstance.post(`${baseUrl}/api/v1/admin/discounts`, data);
        return response.data;
    },
    updateDiscount: async (id, data) => {
        const response = await axiosInstance.put(`${baseUrl}/api/v1/admin/discounts/${id}`, data);
        return response.data;
    },
    deleteDiscount: async (id) => {
        const response = await axiosInstance.delete(`${baseUrl}/api/v1/admin/discounts/${id}`);
        return response.data;
    },
    toggleDiscount: async (id) => {
        const response = await axiosInstance.patch(`${baseUrl}/api/v1/admin/discounts/${id}/toggle`);
        return response.data;
    },

    // Promotions (Promo Codes)
    getPromotions: async () => {
        const response = await axiosInstance.get(`${baseUrl}/api/v1/admin/promotions/all`);
        return response.data;
    },
    createPromotion: async (data) => {
        const response = await axiosInstance.post(`${baseUrl}/api/v1/admin/promotions/create`, data);
        return response.data;
    },
    updatePromotion: async (id, data) => {
        const response = await axiosInstance.put(`${baseUrl}/api/v1/admin/promotions/edit/${id}`, data);
        return response.data;
    },
    deletePromotion: async (id) => {
        const response = await axiosInstance.delete(`${baseUrl}/api/v1/admin/promotions/${id}`);
        return response.data;
    },
    togglePromotion: async (id) => {
        const response = await axiosInstance.patch(`${baseUrl}/api/v1/admin/promotions/toggle/${id}`);
        return response.data;
    },

    // Verification Codes
    getVerificationCodes: async () => {
        const response = await axiosInstance.get(`${baseUrl}/ADMIN/v1/verification-codes`);
        return response.data;
    },
    updateVerificationCode: async (id, data) => {
        const response = await axiosInstance.put(`${baseUrl}/ADMIN/v1/verification-codes/${id}`, data);
        return response.data;
    },
    deleteVerificationCode: async (id) => {
        const response = await axiosInstance.delete(`${baseUrl}/ADMIN/v1/verification-codes/${id}`);
        return response.data;
    }
};

export default adminService;
