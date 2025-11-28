import api from "./api";

export interface User {
  id?: number;
  username: string;
  email?: string;
  profile_image?: string;
  [key: string]: any;
}

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// Token management
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// User management
export const getUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const setUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const registerUser = async (data: { username: string; password: string; email?: string }) => {
  const response = await api.post("/auth/register", data);
  // If backend returns token and user on registration, store them
  if (response.data.token) {
    setToken(response.data.token);
  }
  if (response.data.user) {
    setUser(response.data.user);
  }
  return response;
};

export const loginUser = async (data: { username: string; password: string }) => {
  const response = await api.post("/auth/login", data);
  // Store token and user info
  if (response.data.token || response.data.access_token) {
    const token = response.data.token || response.data.access_token;
    setToken(token);
  }
  if (response.data.user) {
    setUser(response.data.user);
  } else if (response.data.username) {
    // If user object is not returned, create one from response
    setUser({
      username: response.data.username,
      email: response.data.email,
      id: response.data.id,
      profile_image: response.data.profile_image,
    });
  }
  return response;
};

export const getCurrentUser = async (): Promise<User> => {
  const res = await api.get("/users/me");
  if (res.data) {
    setUser(res.data);
  }
  return res.data;
};

export const logoutUser = async (): Promise<void> => {
  try {
    await api.post("/auth/logout", {});
  } catch (e) {
    // ignore network or 404 here; client state will still clear
  } finally {
    // Always clear local storage
    removeToken();
  }
};