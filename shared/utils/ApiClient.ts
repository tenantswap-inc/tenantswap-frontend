import axios, { AxiosInstance, AxiosResponse } from "axios";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")

const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  validateStatus: () => true,
  timeout: 8000, // 8s — fail fast on slow connections rather than hanging
});

// Retry once on network errors (timeout, no response) with a 1s delay
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config;
    if (config?._retried || !error.isAxiosError) return Promise.reject(error);
    const isNetworkOrTimeout = !error.response || error.code === 'ECONNABORTED';
    if (!isNetworkOrTimeout) return Promise.reject(error);
    config._retried = true;
    await new Promise((r) => setTimeout(r, 1000));
    return apiClient(config);
  }
);

// Automated JWT Token Injection
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const isAdminPath = config.url?.startsWith("/admin/")
    const tokenKey = isAdminPath ? "ADMIN_JWT_TOKEN" : "JWT_TOKEN"
    const token = localStorage.getItem(tokenKey)

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

/** Extracts a human-readable error message from an Axios response.
 *  Prefers field-level validation errors (data.data.errors[]) over the
 *  generic "Invalid request payload" top-level message. */
export function extractApiError(response: AxiosResponse, fallback = "Something went wrong."): string {
  const body = response?.data;
  if (!body) return fallback;
  const errors: unknown = body?.data?.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    return (errors as string[]).join(", ");
  }
  return typeof body?.message === "string" ? body.message : fallback;
}

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
