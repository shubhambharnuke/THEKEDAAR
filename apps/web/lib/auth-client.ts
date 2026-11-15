"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "thekedar_access_token";
const USER_KEY = "thekedar_user_profile";

export interface UserSession {
  id: number;
  email: string;
  full_name: string;
  role: "STUDENT_CLUB" | "AUTHORITY" | "VERIFIER" | "ADMIN";
  department_id?: number | null;
  is_active: boolean;
}

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem("token");
};

export const setSession = (token: string, user: UserSession) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem("token", token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=86400; SameSite=Lax`;
  document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
};

export const clearSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("token");
  localStorage.removeItem(USER_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `token=; path=/; max-age=0; SameSite=Lax`;
};

export const getStoredUser = (): UserSession | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const signIn = {
  email: async ({ email, password }: { email: string; password: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { data: null, error: { message: data.detail || "Sign-in failed" } };
      }

      setSession(data.access_token, data.user);
      return { data: { token: data.access_token, user: data.user }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || "Network error" } };
    }
  },
};

export const signUp = {
  email: async ({
    name,
    email,
    password,
    role,
    department_id,
    club_name,
  }: {
    name: string;
    email: string;
    password: string;
    role?: "STUDENT_CLUB" | "AUTHORITY";
    department_id?: number | null;
    club_name?: string | null;
  }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          email,
          password,
          role: role || "STUDENT_CLUB",
          department_id: department_id || null,
          club_name: club_name || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { data: null, error: { message: data.detail || "Registration failed" } };
      }

      setSession(data.access_token, data.user);
      return { data: { token: data.access_token, user: data.user }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || "Network error" } };
    }
  },
};

export const signOut = async () => {
  try {
    const token = getToken();
    if (token) {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    // Ignore network error on logout
  } finally {
    clearSession();
    window.location.href = "/auth/login";
  }
};

export const useSession = () => {
  const [session, setSessionState] = useState<{ user: UserSession | null }>({
    user: getStoredUser(),
  });
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setSessionState({ user: null });
      setIsPending(false);
      return;
    }

    fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.ok) {
          const user = await res.json();
          setSessionState({ user });
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        } else {
          clearSession();
          setSessionState({ user: null });
        }
      })
      .catch(() => {
        setSessionState({ user: getStoredUser() });
      })
      .finally(() => setIsPending(false));
  }, []);

  return { data: session.user ? session : null, isPending };
};

export const authClient = {
  signIn,
  signUp,
  signOut,
  useSession,
  getToken,
};
