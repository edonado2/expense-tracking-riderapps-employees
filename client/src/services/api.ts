import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('🔗 API_BASE_URL:', API_BASE_URL);
console.log('🔗 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('🔗 Environment:', process.env.NODE_ENV);

class API {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.Authorization;
    }
  }

  // Auth API
  async login(email: string, password: string) {
    console.log('🔐 Attempting login to:', `${this.client.defaults.baseURL}/auth/login`);
    console.log('🔐 Email:', email);
    try {
      const response: AxiosResponse = await this.client.post('/auth/login', {
        email,
        password,
      });
      console.log('✅ Login successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw error;
    }
  }

  async getCurrentUser() {
    const response: AxiosResponse = await this.client.get('/auth/me');
    return response.data;
  }

  // Rides API
  async getRides() {
    const response: AxiosResponse = await this.client.get('/rides');
    return response.data;
  }

  async createRide(rideData: any) {
    const response: AxiosResponse = await this.client.post('/rides', rideData);
    return response.data;
  }

  async updateRide(id: number, rideData: any) {
    const response: AxiosResponse = await this.client.put(`/rides/${id}`, rideData);
    return response.data;
  }

  async deleteRide(id: number) {
    const response: AxiosResponse = await this.client.delete(`/rides/${id}`);
    return response.data;
  }

  async getRideSummary() {
    const response: AxiosResponse = await this.client.get('/rides/summary');
    return response.data;
  }

  async getExchangeRate() {
    const response: AxiosResponse = await this.client.get('/rides/exchange-rate');
    return response.data;
  }

  // Users API (Admin only)
  async getUsers() {
    const response: AxiosResponse = await this.client.get('/users');
    return response.data;
  }

  async getUser(id: number) {
    const response: AxiosResponse = await this.client.get(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: number, userData: any) {
    const response: AxiosResponse = await this.client.put(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: number) {
    const response: AxiosResponse = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  async createUser(userData: any) {
    const response: AxiosResponse = await this.client.post('/auth/register', userData);
    return response.data;
  }

  // Admin API
  async getSpendingData() {
    const response: AxiosResponse = await this.client.get('/admin/spending');
    return response.data;
  }

  async getDepartmentSpending() {
    const response: AxiosResponse = await this.client.get('/admin/departments');
    return response.data;
  }

  async getAdminStats() {
    const response: AxiosResponse = await this.client.get('/admin/stats');
    return response.data;
  }

  async getUserRides(userId: number) {
    const response: AxiosResponse = await this.client.get(`/admin/users/${userId}/rides`);
    return response.data;
  }

  async getUserMonthlySpending(userId: number) {
    const response: AxiosResponse = await this.client.get(`/admin/users/${userId}/monthly-spending`);
    return response.data;
  }
}

export const api = new API();
export const authAPI = api;
