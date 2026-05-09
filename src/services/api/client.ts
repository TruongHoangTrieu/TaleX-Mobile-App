import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 15000,
});

// Add interceptors in this file (auth, logging, error mapping)
