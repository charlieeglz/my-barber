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

        const sessionUser = session.user;
        setUser(sessionUser);

        // Intentamos obtener el perfil de la tabla pública 'users'
        const { data: userData } = await supabase
          .from("users")
          .select("full_name, role")
          .eq("id", sessionUser.id)
          .single();

        // Si no hay datos en la tabla (ej: registro reciente sin trigger), 
        // usamos los metadatos de Auth como fuente de verdad.
        const finalFullName = userData?.full_name || sessionUser.user_metadata?.full_name || "";
        const finalRole = (userData?.role || sessionUser.user_metadata?.role) as UserRole;

        if (finalRole) {
          setProfile({ full_name: finalFullName, role: finalRole });

          // Redirección solo si el rol no coincide con el requerido
          if (requiredRole && finalRole !== requiredRole) {
            const redirectPath = finalRole === "barber" ? "/dashboard" : "/cliente";
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
