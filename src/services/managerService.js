import axiosInstance from './api';

const baseUrl = process.env.REACT_APP_BASE_URL;

const managerService = {
    // Discount Rules (FR-POS-12)
    getDiscounts: async () => {
        const response = await axiosInstance.get(`${baseUrl}/api/manager/v1/discounts`);
        return response.data;
    },

    createDiscount: async (data) => {
        const response = await axiosInstance.post(`${baseUrl}/api/manager/v1/discounts`, data);
        return response.data;
    },

    updateDiscount: async (id, data) => {
        const response = await axiosInstance.put(`${baseUrl}/api/manager/v1/discounts/${id}`, data);
        return response.data;
    },

    deleteDiscount: async (id) => {
        const response = await axiosInstance.delete(`${baseUrl}/api/manager/v1/discounts/${id}`);
        return response.data;
    },

    toggleDiscount: async (id) => {
        const response = await axiosInstance.patch(`${baseUrl}/api/manager/v1/discounts/${id}/toggle`);
        return response.data;
    },

    // Promotions (Promo Codes)
    getPromotions: async () => {
        const response = await axiosInstance.get(`${baseUrl}/api/manager/promotions/all`);
        return response.data;
    },

    togglePromotion: async (id) => {
        const response = await axiosInstance.patch(`${baseUrl}/api/manager/promotions/toggle/${id}`);
        return response.data;
    },

    // UI Helpers for Rule Creation
    getAllProducts: async () => {
        const response = await axiosInstance.get(`${baseUrl}/api/v1/admin/product/all`);
        return response.data;
    },

    getAllCategories: async () => {
        const response = await axiosInstance.get(`${baseUrl}/api/v1/admin/product/categories`);
        return response.data;
    }
};

export default managerService;
