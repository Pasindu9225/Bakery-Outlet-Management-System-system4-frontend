import axiosInstance from './api';

const baseUrl = process.env.REACT_APP_BASE_URL;

const posService = {
    // Special Order Creation
    initiateSpecialOrder: async (data) => {
        const response = await axiosInstance.post(`/api/pos/v1/special-orders`, data);
        return response.data;
    },

    // Get Pending Orders
    getPendingSpecialOrders: async () => {
        const response = await axiosInstance.get(`/api/pos/v1/special-orders/pending`);
        return response.data;
    },

    // Add Payment to Existing Order
    addOrderPayment: async (orderId, paymentData) => {
        const response = await axiosInstance.patch(`/api/pos/v1/special-orders/${orderId}/payment`, paymentData);
        return response.data;
    },

    // Manager Approval & Final Closure
    approveAndCloseOrder: async (orderId, managerId) => {
        const response = await axiosInstance.patch(`/api/pos/v1/special-orders/${orderId}/approve?managerId=${managerId}`);
        return response.data;
    },

    verifyManagerCode: async (code) => {
        const response = await axiosInstance.get(`/api/pos/v1/special-orders/verify-manager/${code}`);
        return response.data;
    },

    transferTable: async (sourceTableId, targetTableId) => {
        const response = await axiosInstance.post(`/api/pos/v1/table-billing/transfer`, null, {
            params: { sourceTableId, targetTableId }
        });
        return response.data;
    },

    generateKOT: async (tableItemId, productionCenterId) => {
        const response = await axiosInstance.post(`/api/pos/v1/table-billing/generate-kot/${tableItemId}`, null, {
            params: { productionCenterId }
        });
        return response.data;
    },

    cancelKOT: async (tableItemId, verificationCode) => {
        const response = await axiosInstance.delete(`/api/pos/v1/table-billing/cancel-kot/${tableItemId}`, {
            params: { verificationCode }
        });
        return response.data;
    },

    getProductionCenters: async () => {
        const response = await axiosInstance.get(`/api/pos/v1/table-billing/production-centers`);
        return response.data;
    },

    updateTableStatus: async (tableId, status) => {
        const response = await axiosInstance.put(`/api/pos/v1/table-billing/tables/${tableId}/status`, null, {
            params: { status }
        });
        return response.data;
    },

    updateTableItem: async (tableItemId, qty, instructions) => {
        const response = await axiosInstance.put(`/api/pos/v1/table-billing/items/${tableItemId}`, null, {
            params: { qty, instructions }
        });
        return response.data;
    },

    removeTableItem: async (tableItemId) => {
        const response = await axiosInstance.delete(`/api/pos/v1/table-billing/items/${tableItemId}`);
        return response.data;
    },

    // Cancel Order
    cancelOrder: async (orderId, reason) => {
        const response = await axiosInstance.delete(`/api/pos/v1/special-orders/${orderId}?reason=${encodeURIComponent(reason)}`);
        return response.data;
    },

    // Daily Operations
    getTodayItems: async (outletId) => {
        const response = await axiosInstance.get(`/api/pos/v1/today-production-items`, {
            params: { outletId }
        });
        return response.data;
    },

    getPaymentMethods: async () => {
        const response = await axiosInstance.get(`/api/pos/v1/payment-methods`);
        return response.data;
    },

    validatePromo: async (code) => {
        const response = await axiosInstance.get(`/api/pos/v1/promotions/validate?code=${code}`);
        return response.data;
    },

    submitSale: async (saleData) => {
        const response = await axiosInstance.post(`/api/pos/v1/sales`, saleData);
        return response.data;
    },

    // Outlet to Store Returns (FR-POS-11)
    initiateOutletReturn: async (data) => {
        const response = await axiosInstance.post(`/api/pos/v1/outlet-returns`, data);
        return response.data;
    },

    getOutletReturnsByStatus: async (status) => {
        const response = await axiosInstance.get(`/api/pos/v1/outlet-returns/status/${status}`);
        return response.data;
    },

    approveOutletReturn: async (id, approverId) => {
        const response = await axiosInstance.post(`/api/pos/v1/outlet-returns/${id}/approve?approverId=${approverId}`);
        return response.data;
    },

    rejectOutletReturn: async (id, rejecterId) => {
        const response = await axiosInstance.post(`/api/pos/v1/outlet-returns/${id}/reject?rejecterId=${rejecterId}`);
        return response.data;
    },

    receiveOutletReturn: async (id, receiverId) => {
        const response = await axiosInstance.post(`/api/pos/v1/outlet-returns/${id}/receive?receiverId=${receiverId}`);
        return response.data;
    },

    sendStandaloneKot: async ({ dayProductionItemId, qty, productionCenterId, specialInstructions }) => {
        const response = await axiosInstance.post(
            `/api/pos/v1/sales/standalone-kot`,
            { dayProductionItemId, qty, productionCenterId, specialInstructions }
        );
        return response.data;
    },

    processItemReturn: async (requestBody) => {
        const response = await axiosInstance.post(`/api/pos/v1/item-return/process`, requestBody);
        return response.data;
    },

    getTodaySalesForReturn: async () => {
        const response = await axiosInstance.get(`/api/pos/v1/item-return/today-sales`);
        return response.data;
    }
};

export default posService;
