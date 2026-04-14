import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, hasSupabase } from "../lib/supabase";

const AuthContext = createContext(null);

function getAuthRedirectBaseUrl() {
  const configuredUrl = import.meta.env.VITE_APP_URL;
  const baseUrl = configuredUrl || window.location.origin;
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabase) {
      const cached = localStorage.getItem("eventra-user");
      if (cached) {
        const parsed = JSON.parse(cached);
        setUser(parsed);
        setRole(parsed.role || "user");
      }
      setLoading(false);
      return;
    }

    async function resolveRole(sessionUser) {
      if (!sessionUser) return "user";

      try {
        const metadataRole = sessionUser.user_metadata?.role;
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", sessionUser.id)
          .maybeSingle();

        return profile?.role || metadataRole || "user";
      } catch {
        return sessionUser.user_metadata?.role || "user";
      }
    }

    async function syncSession(sessionUser) {
      setUser(sessionUser);
      setRole(await resolveRole(sessionUser));
    }

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        await syncSession(data.session?.user ?? null);
      })
      .catch(() => {
        setUser(null);
        setRole("user");
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        await syncSession(session?.user ?? null);
      } catch {
        setUser(null);
        setRole("user");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      async login(email, password) {
        if (!hasSupabase) {
          const localUser = { id: email, email, role: email.includes("admin") ? "admin" : "user" };
          localStorage.setItem("eventra-user", JSON.stringify(localUser));
          setUser(localUser);
          setRole(localUser.role);
          return { error: null, role: localUser.role };
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        const signedInRole = data.user?.user_metadata?.role || "user";
        return { error, role: signedInRole };
      },
      async signup({ fullName, email, password }) {
        if (!hasSupabase) {
          const localUser = { id: email, email, fullName, role: "user" };
          localStorage.setItem("eventra-user", JSON.stringify(localUser));
          setUser(localUser);
          setRole(localUser.role);
          return { error: null, role: localUser.role };
        }

        const redirectBaseUrl = getAuthRedirectBaseUrl();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${redirectBaseUrl}/email-confirmed`,
            data: {
              full_name: fullName,
              role: "user"
            }
          }
        });
        if (error) {
          const message = String(error.message || "").toLowerCase();
          if (error.status === 429 || error.statusCode === 429 || message.includes("rate limit") || message.includes("too many requests")) {
            return {
              error: {
                message: "Email signup is temporarily rate-limited. Wait about a minute and try again with the same account request."
              },
              role: "user"
            };
          }
        }

        return { error, role: "user" };
      },
      async logout() {
        if (!hasSupabase) {
          localStorage.removeItem("eventra-user");
          setUser(null);
          setRole("user");
          return;
        }

        setUser(null);
        setRole("user");
        setLoading(false);

        try {
          await supabase.auth.signOut();
        } catch {
          // Force local sign-out behavior even if the network call fails.
        }
      }
    }),
    [user, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
