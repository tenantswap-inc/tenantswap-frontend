import axios, { AxiosInstance, RawAxiosRequestHeaders } from "axios";

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const Client = {
  get: async <T>(
    url: string,
    params?: any,
    headers?: RawAxiosRequestHeaders
  ): Promise<T> => {
    const response = await apiClient.get<T>(url, { params, headers });
    return response.data;
  },

  post: async <T>(
    url: string,
    data: any,
    headers?: RawAxiosRequestHeaders
  ): Promise<T> => {
    const response = await apiClient.post<T>(url, data, { headers });
    return response.data;
  },

  patch: async <T>(
    url: string,
    data: any,
    headers?: RawAxiosRequestHeaders
  ): Promise<T> => {
    const response = await apiClient.patch<T>(url, data, { headers });
    return response.data;
  },

  put: async <T>(
    url: string,
    data: any,
    headers?: RawAxiosRequestHeaders
  ): Promise<T> => {
    const response = await apiClient.put<T>(url, data, { headers });
    return response.data;
  },

  delete: async <T>(
    url: string,
    data?: any,
    headers?: RawAxiosRequestHeaders
  ): Promise<T> => {
    const response = await apiClient.delete<T>(url, { data, headers });
    return response.data;
  },
};
