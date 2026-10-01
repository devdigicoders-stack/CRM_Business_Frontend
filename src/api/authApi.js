import apiClient from './axiosConfig';

// Auth API Endpoints
export const loginUser = async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
};

export const getProfile = async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
};

export const editProfile = async (profileData) => {
    const isFormData = profileData instanceof FormData;
    const response = await apiClient.put('/auth/profile/edit', profileData, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response.data;
};

export const changePassword = async (passwordData) => {
    const response = await apiClient.put('/auth/profile/change-password', passwordData);
    return response.data;
};

// Admin: User Management APIs
export const getUsers = async () => {
    const response = await apiClient.get('/auth/users');
    return response.data;
};

export const createUser = async (userData) => {
    const isFormData = userData instanceof FormData;
    const response = await apiClient.post('/auth/register', userData, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response.data;
};

export const editUser = async (id, userData) => {
    const response = await apiClient.put(`/auth/users/${id}`, userData);
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await apiClient.delete(`/auth/users/${id}`);
    return response.data;
};

export const toggleUserStatus = async (id) => {
    const response = await apiClient.put(`/auth/users/${id}/status`);
    return response.data;
};

export const changeUserPassword = async (id, newPassword) => {
    const response = await apiClient.put(`/auth/users/${id}/change-password`, { newPassword });
    return response.data;
};
