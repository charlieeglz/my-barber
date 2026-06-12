import { supabase } from "../supabase";
import { UserRole } from "@/hooks/useAuth";
import { StaffMember, Barbershop } from "./barber.service";

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string;
  staffInfo?: StaffMember & { barbershops: Barbershop };
}

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, fullName: string, role: "barber" | "client", phone: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name: fullName, 
          role: role,
          phone: phone
        },
        emailRedirectTo: `${window.location.origin}/login?confirmed=true`,
      },
    });

    if (error) {
      if (error.message.includes("already registered") || error.status === 400) {
        throw new Error("Esta cuenta ya está registrada. Por favor, inicia sesión.");
      }
      throw error;
    }

    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      throw new Error("Esta cuenta ya está registrada. Por favor, inicia sesión.");
    }

    return data;
  },

  async getProfile(userId: string, authUser?: any): Promise<UserProfile | null> {
    // 1. Get user and metadata from Auth (Safe & Robust)
    let user = authUser;
    
    if (!user) {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data?.user) {
        console.error("Auth user not found:", authError);
        return null;
      }
      user = data.user;
    }

    const metadata = user.user_metadata;
    const role = metadata?.role as UserRole;
    const fullName = metadata?.full_name || "";
    const phone = metadata?.phone || "";

    if (!role) return null;

    const profile: UserProfile = {
      id: userId,
      full_name: fullName,
      role,
      phone
    };

    // 2. Fetch extra info for barbers from the 'staff' table
    if (role === "barber") {
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("*, barbershops(*)")
        .eq("user_id", userId)
        .maybeSingle(); // maybeSingle doesn't throw if not found

      if (staffError) {
        console.error("Error fetching staff info:", staffError);
      } else if (staffData) {
        profile.staffInfo = staffData as (StaffMember & { barbershops: Barbershop });
      }
    }

    return profile;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};

