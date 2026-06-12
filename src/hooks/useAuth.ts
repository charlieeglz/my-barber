import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { authService, UserProfile } from "@/lib/services/auth.service";

export type UserRole = "barber" | "client";

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
