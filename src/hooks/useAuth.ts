import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

export type UserRole = "barber" | "client";

export function useAuth(requiredRole?: UserRole) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; role: UserRole } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function getSession() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          if (requiredRole) {
            router.push("/login");
          }
          setLoading(false);
          return;
        }

        setUser(session.user);

        // Fetch additional profile data from our 'users' table if needed
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("full_name, role")
          .eq("id", session.user.id)
          .single();

        if (!userError && userData) {
          const userRole = userData.role as UserRole;
          setProfile({ full_name: userData.full_name, role: userRole });

          // Redirect if role doesn't match
          if (requiredRole && userRole !== requiredRole) {
            const redirectPath = userRole === "barber" ? "/dashboard" : "/cliente";
            router.push(redirectPath);
          }
        }
      } catch (error) {
        console.error("Error in useAuth:", error);
      } finally {
        setLoading(false);
      }
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setProfile(null);
        if (requiredRole) router.push("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [requiredRole, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
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
