import axios, { AxiosInstance, AxiosResponse } from "axios";

const baseUrl = process.env.LOCATION_BASE_URL
const apiKey = process.env.LOCATION_API_KEY

if (!baseUrl) throw new Error("LOCATION_BASE_URL is not defined");
if (!apiKey) throw new Error("LOCATION_API_KEY is not defined");

const apiClient: AxiosInstance = axios.create({
      baseURL: baseUrl,
      headers: {
            "Content-Type": "application/json",
            "X-CSCAPI-KEY": apiKey

      },
      validateStatus: () => true,
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
};
