import { supabase } from "../supabase";

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, fullName: string, role: "barber" | "client") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: role },
        emailRedirectTo: `${window.location.origin}/login?confirmed=true`,
      },
    });
    
    if (error) {
      if (error.message.includes("already registered") || error.status === 400) {
        throw new Error("Esta cuenta ya está registrada. Por favor, inicia sesión.");
      }
      throw error;
    }
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};
