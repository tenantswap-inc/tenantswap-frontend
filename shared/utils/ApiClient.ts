import axios, { AxiosInstance, AxiosResponse } from "axios";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")

const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  validateStatus: () => true,
  timeout: 15000, // 15 s — prevents requests hanging indefinitely
});

export const Client = {
  get: async <T = any>(
    url: string,
    params?: object,
    headers?: Record<string, string>
  ): Promise<AxiosResponse<T>> => {
    return await apiClient.get<T>(url, { params, headers });
  },
  post: async <T = any>(
    url: string,
    data: object,
    headers?: Record<string, string>
  ): Promise<AxiosResponse<T>> => {
    return await apiClient.post<T>(url, data, { headers });
  },
  patch: async <T = any>(
    url: string,
    data: object,
    headers?: Record<string, string>
  ): Promise<AxiosResponse<T>> => {
    return await apiClient.patch<T>(url, data, { headers });
  },
  put: async <T = any>(
    url: string,
    data: object,
    headers?: Record<string, string>
  ): Promise<AxiosResponse<T>> => {
    return await apiClient.put<T>(url, data, { headers });
  },
  delete: async <T = any>(
    url: string,
    data?: object,
    headers?: Record<string, string>
  ): Promise<AxiosResponse<T>> => {
    return await apiClient.delete<T>(url, { data, headers });
  },
  postFormData: async <T = any>(
    url: string,
    formData: FormData,
    headers?: Record<string, string>
  ): Promise<AxiosResponse<T>> => {
    return await apiClient.post<T>(url, formData, {
      headers: { ...headers, 'Content-Type': 'multipart/form-data' },
    });
  },
};

