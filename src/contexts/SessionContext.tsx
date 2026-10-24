/* Provider and its hook intentionally share one typed context module. */
/* oxlint-disable react/only-export-components, react/set-state-in-effect */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest, bootstrapSession, setAccessToken } from "../api/client.ts";
export interface VendorContext {
  id: string;
  businessName: string;
  type: "INDIVIDUAL" | "COMPANY";
  status:
    | "EMAIL_PENDING"
    | "IN_PROGRESS"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "SUSPENDED";
}
export interface Session {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  permissions: readonly string[];
  vendor: VendorContext;
}
interface SessionValue {
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Session>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
  /** Refresh session without flipping the global loading gate. */
  refresh: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}
const SessionContext = createContext<SessionValue | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setSession(await bootstrapSession<Session>());
  }, []);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [refresh]);
  useEffect(() => {
    void reload();
  }, [reload]);
  const login = useCallback(async (email: string, password: string) => {
    const result = await apiRequest<{ accessToken: string; user: Session }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
        retryAuth: false,
      },
    );
    setAccessToken(result.accessToken);
    setSession(result.user);
    return result.user;
  }, []);
  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST", retryAuth: false });
    } finally {
      setAccessToken(null);
      setSession(null);
    }
  }, []);
  const value = useMemo(
    () => ({
      session,
      loading,
      login,
      logout,
      reload,
      refresh,
      hasPermission: (permission: string) =>
        Boolean(
          session?.permissions.includes("*") ||
            session?.permissions.includes(permission),
        ),
    }),
    [session, loading, login, logout, reload, refresh],
  );
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used within SessionProvider");
  return value;
}
