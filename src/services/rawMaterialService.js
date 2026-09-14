import axiosInstance from './api';

const rawMaterialService = {
    // --- Generic Materials (Admin) ---
    getGenericMaterials: async () => {
        const response = await axiosInstance.get(`/ADMIN/v1/generic-materials`);
        return response.data;
    },

    createGenericMaterial: async (data) => {
        try {
            const response = await axiosInstance.post(`/ADMIN/v1/generic-materials`, data);
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to create generic material');
        }
    },

    updateGenericMaterial: async (id, data) => {
        try {
            const response = await axiosInstance.put(`/ADMIN/v1/generic-materials/${id}`, data);
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to update generic material');
        }
    },

    // --- Brands (Admin) ---
    getBrandsByGeneric: async (genericId) => {
        const response = await axiosInstance.get(`/ADMIN/v1/generic-materials/${genericId}/brands`);
        return response.data;
    },

    createBrand: async (data) => {
        try {
            const response = await axiosInstance.post(`/ADMIN/v1/brands`, data);
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to create brand');
        }
    },

    updateBrand: async (id, data) => {
        try {
            const response = await axiosInstance.put(`/ADMIN/v1/brands/${id}`, data);
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to update brand');
        }
    },

    // --- Raw Materials / SKUs (Admin) ---
    getRawMaterials: async () => {
        const response = await axiosInstance.get(`/ADMIN/v1/raw-materials`);
        return response.data;
    },

    createRawMaterial: async (payload) => {
        try {
            const response = await axiosInstance.post(`/ADMIN/v1/raw-materials`, payload);
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to create raw material SKU');
        }
    },

    updateRawMaterial: async (id, payload) => {
        try {
            const response = await axiosInstance.put(`/ADMIN/v1/raw-materials/${id}`, payload);
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to update raw material SKU');
        }
    },

    deleteRawMaterial: async (id) => {
        try {
            const response = await axiosInstance.delete(`/ADMIN/v1/raw-materials/${id}`);
            return true;
        } catch (error) {
            throw new Error(error.message || 'Failed to delete raw material');
        }
    },

    // --- Aggregated Stock (Storekeeper/Manager) ---
    getAggregatedStock: async () => {
        const response = await axiosInstance.get(`/STK/v1/materials/aggregated-stock`);
        return response.data;
    },

    getAllMaterialsDetailed: async () => {
        const response = await axiosInstance.get(`/STK/v1/materials/all`);
        return response.data;
    },

    createCategory: async (name) => {
        try {
            const response = await axiosInstance.post(`/ADMIN/v1/raw-materials/categories`, { name });
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to create category');
        }
    },

    updateCategory: async (id, name) => {
        try {
            const response = await axiosInstance.put(`/ADMIN/v1/raw-materials/categories/${id}`, { name });
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'Failed to update category');
        }
    }
};

export default rawMaterialService;
