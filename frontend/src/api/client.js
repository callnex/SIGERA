import axios from "axios";

const apiHost = import.meta.env.VITE_API_HOST;

export const API_URL =
  import.meta.env.VITE_API_URL || (apiHost ? `https://${apiHost}/api` : "http://localhost:8000/api");

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sigera_access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function mediaUrl(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_URL.replace("/api", "")}${url}`;
}
