import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // send the httpOnly refresh cookie
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem("mv_access_token", token);
  } else {
    localStorage.removeItem("mv_access_token");
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  accessToken = localStorage.getItem("mv_access_token");
  return accessToken;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On a 401, clear the stale token so the app falls back to the logged-out state.
// (Silent refresh-token rotation can be wired in here once that endpoint exists.)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      setAccessToken(null);
    }
    return Promise.reject(error);
  }
);
