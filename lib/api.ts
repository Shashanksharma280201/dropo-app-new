import axios, { AxiosError, AxiosHeaders } from "axios";

import { useUserStore } from "@/stores";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
});

let refreshPromise: Promise<string | null> | null = null;

const getTokens = () => {
  const { accessToken, refreshToken } = useUserStore.getState();
  return { accessToken, refreshToken };
};

const setSession = (
  accessToken: string,
  refreshToken: string,
  user?: {
    name: string | null;
    phoneNumber: string;
    defaultAddressId?: string | null;
    addresses?: any[];
  }
) => {
  const setSessionFn = useUserStore.getState().setSession;
  setSessionFn({
    accessToken,
    refreshToken,
    user: {
      name: user?.name ?? useUserStore.getState().name,
      phoneNumber: user?.phoneNumber ?? useUserStore.getState().phoneNumber ?? "",
      defaultAddressId: user?.defaultAddressId ?? useUserStore.getState().defaultAddressId,
      addresses: user?.addresses ?? useUserStore.getState().addresses,
    },
  });
};

const clearSession = () => {
  useUserStore.getState().clearSession();
};

api.interceptors.request.use((config) => {
  const { accessToken } = getTokens();
  if (accessToken) {
    const headers = AxiosHeaders.from(config.headers ?? {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    config.headers = headers;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;
    if (!originalRequest || originalRequest._retry) {
      throw error;
    }

    if (error.response?.status === 401) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          throw error;
        }
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return api(originalRequest);
      } catch (refreshError) {
        clearSession();
        throw refreshError;
      }
    }

    throw error;
  }
);

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = getTokens();
  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${BASE_URL}/api/v1/auth/refresh`,
        { refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        const data = response.data as {
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        };
        setSession(data.accessToken, data.refreshToken);
        return data.accessToken;
      })
      .catch((error) => {
        clearSession();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export default api;
