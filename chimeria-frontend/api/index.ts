import axios from "axios";
import { jwtDecode } from "jwt-decode";

const YOLO_BACKEND_URL = process.env.NEXT_PUBLIC_YOLO_BACKEND_URL;

const api = axios.create({
  baseURL: YOLO_BACKEND_URL,
});

api.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      const sessionToken = sessionStorage.getItem("access-token");
      const localToken = localStorage.getItem("access-token");
      const token = sessionToken || localToken;
      const storage = sessionToken ? sessionStorage : localStorage;

      if (token) {
        try {
          const decoded = jwtDecode<{ exp: number }>(token);
          const currentTime = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = decoded.exp - currentTime;

          if (timeUntilExpiry < 120) {
            try {
              const response = await refresh();
              const newToken = response.data.accessToken;
              storage.setItem("access-token", newToken);
              config.headers.Authorization = `Bearer ${newToken}`;
            } catch {
              config.headers.Authorization = `Bearer ${token}`;
            }
          } else config.headers.Authorization = `Bearer ${token}`;
        } catch {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined")
      window.location.href = "/auth";
    else return Promise.reject(error);
  }
);

const authApi = axios.create({
  baseURL: `${YOLO_BACKEND_URL}/auth`,
  withCredentials: true,
});

authApi.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/check") &&
      typeof window !== "undefined"
    )
      window.location.href = "/auth";
    else return Promise.reject(error);
  }
);

export const signUp = async (email: string, password: string, name: string) =>
  await authApi.post("/sign-up", {
    email,
    password,
    name,
  });

export const signIn = async (
  email: string,
  password: string,
  remember: boolean = false
) =>
  await authApi.post("/sign-in", {
    email,
    password,
    remember,
  });

export const refresh = async () => await authApi.post("/refresh");

export const signOut = async () => await authApi.post("/sign-out");

export const checkAuth = async () => await authApi.get("/check");

export const getProfile = async () => await api.get("/user/profile");

export const getMessages = async () => await api.get("/user/messages");

export const askGemini = async (file: File, question: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("question", question);

  return await api.post("/gemini/ask", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
