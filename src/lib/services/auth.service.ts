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

    // En Supabase, si el email ya existe y 'prevent user enumeration' está activo, 
    // no devuelve error pero la lista de identidades está vacía.
    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      throw new Error("Esta cuenta ya está registrada. Por favor, inicia sesión.");
    }

    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};
