import { api, setAccessToken } from "./client";
import type { User } from "../types";

export async function register(name: string, email: string, password: string): Promise<User> {
  const { data } = await api.post("/auth/register", { name, email, password });
  setAccessToken(data.data.accessToken);
  return data.data.user;
}

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post("/auth/login", { email, password });
  setAccessToken(data.data.accessToken);
  return data.data.user;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
  setAccessToken(null);
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get("/auth/me");
  return data.data.user;
}
