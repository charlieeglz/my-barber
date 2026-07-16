import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { authService, UserProfile } from "@/lib/services/auth.service";

export type UserRole = "barber" | "client";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
}

export function useAuth(requiredRole?: UserRole) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = useCallback(async (sessionUser: User) => {
    try {
      const data = await authService.getProfile(sessionUser.id, sessionUser);
      if (data) {
        setProfile(data);
        
        // Role protection logic
        if (requiredRole && data.role !== requiredRole) {
          console.log(`[useAuth] Redirecting due to role mismatch. Required: ${requiredRole}, Found: ${data.role}`);
          const redirectPath = data.role === "barber" ? "/dashboard" : "/cliente";
          router.push(redirectPath);
        }
      } else {
        // Fallback: Si el perfil es null por falta de rol, pero tenemos la cookie 'sb-pending-role',
        // actualizamos el rol del usuario directamente desde el cliente. Esto previene pérdidas en OAuth de Google.
        const pendingRole = getCookie("sb-pending-role") as UserRole | null;
        if (pendingRole && sessionUser) {
          console.log(`[useAuth] Found pending role "${pendingRole}" via cookie. Self-healing user metadata...`);
          const { data: updateData, error: updateError } = await supabase.auth.updateUser({
            data: { role: pendingRole }
          });
          if (!updateError && updateData.user) {
            deleteCookie("sb-pending-role");
            // Volvemos a cargar el perfil con el usuario actualizado
            const newData = await authService.getProfile(sessionUser.id, updateData.user);
            if (newData) {
              setProfile(newData);
              // Redirigir a la vista adecuada
              const redirectPath = newData.role === "barber" ? "/dashboard" : "/cliente";
              router.push(redirectPath);
              return;
            }
          }
        }

        if (requiredRole) {
          console.log(`[useAuth] No profile found but role is required. Redirecting to login.`);
          router.push("/login");
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }, [requiredRole, router]);

  useEffect(() => {
    let mounted = true;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        setUser(session.user);
        fetchProfile(session.user);
      } else {
        if (requiredRole) {
          console.log(`[useAuth] Redirecting to login. No session found. Required: ${requiredRole}`);
          router.push("/login");
        }
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        setUser(session.user);
        fetchProfile(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setLoading(false);
        if (requiredRole) {
          console.log(`[useAuth] Redirecting to login. SIGNED_OUT event.`);
          router.push("/login");
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [requiredRole, router, fetchProfile]);

  const signOut = async () => {
    await authService.signOut();
    router.push("/login");
  };

  return {
    user,
    profile,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
}
