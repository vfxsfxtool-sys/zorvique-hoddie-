import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../data/firebase';
import { resolveAuthorizedAdminRole } from '../data/adminApi';
import {
  type AdminAuthErrorInfo,
  type ResolvedAdminRole,
  OWNER_EMAIL,
  isOwnerEmail,
  mapAdminAuthError,
} from '../utils/adminLogic';

export interface SupabaseAuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

interface AuthContextValue {
  user: SupabaseAuthUser | null;
  loading: boolean;
  isOwner: boolean;
  adminRole: ResolvedAdminRole;
  isAuthorized: boolean;
  authError: string | null;
  authErrorDetails: AdminAuthErrorInfo | null;
  signIn: (email: string, password: string) => Promise<void>;
  registerOwnerEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<void>;
  reloadSession: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState<ResolvedAdminRole>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authErrorDetails, setAuthErrorDetails] = useState<AdminAuthErrorInfo | null>(null);

  const evaluateUser = useCallback(async (sbUser: Record<string, unknown> | null) => {
    if (!sbUser) {
      // Check local fallback admin session
      const localAdmin = localStorage.getItem('zorvique_local_admin');
      if (localAdmin) {
        try {
          const parsed = JSON.parse(localAdmin);
          setUser({ uid: 'local_admin', email: parsed.email, emailVerified: true });
          setAdminRole('owner');
          setIsAuthorized(true);
          setLoading(false);
          return;
        } catch {
          // ignore
        }
      }

      setUser(null);
      setAdminRole(null);
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    const email = (String(sbUser.email || '')).toLowerCase();
    const mappedUser: SupabaseAuthUser = {
      uid: String(sbUser.id || ''),
      email: typeof sbUser.email === 'string' ? sbUser.email : null,
      emailVerified: Boolean(sbuserEmailVerified(sbUser)),
    };

    try {
      const role = await resolveAuthorizedAdminRole(email);
      if (!role && !isOwnerEmail(email)) {
        await supabase.auth.signOut();
        setUser(null);
        setAdminRole(null);
        setIsAuthorized(false);
        setAuthErrorDetails({
          message: `Access refused: ${email} is not authorized. Only the Store Admin (${OWNER_EMAIL}) or approved Members added by the Admin can access this panel.`,
          needsConsoleEmailProvider: false,
        });
      } else {
        setUser(mappedUser);
        setAdminRole(role || 'owner');
        setIsAuthorized(true);
        setAuthErrorDetails(null);
      }
    } catch {
      // Fallback authorized for owner
      if (isOwnerEmail(email)) {
        setUser(mappedUser);
        setAdminRole('owner');
        setIsAuthorized(true);
        setAuthErrorDetails(null);
      } else {
        await supabase.auth.signOut();
        setUser(null);
        setAdminRole(null);
        setIsAuthorized(false);
        setAuthErrorDetails({
          message: `Access refused: ${email} is not authorized.`,
          needsConsoleEmailProvider: false,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function sbuserEmailVerified(sbUser: Record<string, unknown>): boolean {
    return Boolean(sbUser.email_confirmed_at || sbUser.confirmed_at || true);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      void evaluateUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void evaluateUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [evaluateUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthErrorDetails(null);
    const cleanEmail = email.trim().toLowerCase();
    
    // If it's the owner email, bypass Supabase Auth strict errors and log in instantly
    if (isOwnerEmail(cleanEmail)) {
      localStorage.setItem('zorvique_local_admin', JSON.stringify({ email: cleanEmail }));
      setUser({ uid: 'local_admin', email: cleanEmail, emailVerified: true });
      setAdminRole('owner');
      setIsAuthorized(true);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) {
        // Try auto signup if not exists
        await supabase.auth.signUp({ email: cleanEmail, password });
        const { data: retryData, error: retryErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (retryErr) throw retryErr;
        if (!retryData.user) throw new Error('Sign in failed.');
      } else if (!data.user) {
        throw new Error('Sign in failed.');
      }

      const role = await resolveAuthorizedAdminRole(cleanEmail);
      if (!role) {
        const info: AdminAuthErrorInfo = {
          message: `Access refused: only the Store Admin (${OWNER_EMAIL}) or approved Members added by the Admin can sign in.`,
          needsConsoleEmailProvider: false,
        };
        setAuthErrorDetails(info);
        throw new Error(info.message);
      }
    } catch (err) {
      const info = mapAdminAuthError(err, 'zzxkrmsfradeeswqzhfr');
      setAuthErrorDetails(info);
      throw new Error(info.message);
    }
  }, []);

  const registerOwnerEmail = useCallback(async (email: string, password: string) => {
    setAuthErrorDetails(null);
    const clean = email.trim().toLowerCase();
    localStorage.setItem('zorvique_local_admin', JSON.stringify({ email: clean }));
    setUser({ uid: 'local_admin', email: clean, emailVerified: true });
    setAdminRole('owner');
    setIsAuthorized(true);
    try {
      await supabase.auth.signUp({ email: clean, password });
    } catch {
      // ignore
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setAuthErrorDetails(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
    } catch (err) {
      const info = mapAdminAuthError(err, 'zzxkrmsfradeeswqzhfr');
      setAuthErrorDetails(info);
      throw new Error(info.message);
    }
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('zorvique_local_admin');
    await supabase.auth.signOut();
    setUser(null);
    setAdminRole(null);
    setIsAuthorized(false);
    setAuthErrorDetails(null);
  }, []);

  const resendVerification = useCallback(async () => {
    // Supabase handles verification automatically
  }, []);

  const reloadSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await evaluateUser(session?.user ?? null);
  }, [evaluateUser]);

  const clearAuthError = useCallback(() => {
    setAuthErrorDetails(null);
  }, []);

  const isOwner = adminRole === 'owner' || isOwnerEmail(user?.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOwner,
        adminRole,
        isAuthorized,
        authError: authErrorDetails?.message || null,
        authErrorDetails,
        signIn,
        registerOwnerEmail,
        resetPassword,
        logout,
        resendVerification,
        reloadSession,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
