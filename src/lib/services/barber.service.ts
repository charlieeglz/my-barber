import { supabase } from "../supabase";

export type BarberService = {
  name: string;
  price: string;
};

export type BarberProfile = {
  id: string;
  user_id: string;
  name: string;
  full_name: string;
  slug: string;
  num_barbers: number;
  avatar_url: string | null;
  cover_url: string | null;
  services: BarberService[];
  created_at?: string;
};

export type CreateBarberProfileData = Omit<BarberProfile, "id" | "created_at">;

export const barberService = {
  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from("barbers")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data as BarberProfile;
  },

  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("barbers")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 is code for no rows found
    return data as BarberProfile | null;
  },

  async checkSlugAvailability(slug: string) {
    const { data, error } = await supabase
      .from("barbers")
      .select("id")
      .eq("slug", slug)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return !data;
  },

  async createProfile(profile: CreateBarberProfileData) {
    const { data, error } = await supabase
      .from("barbers")
      .insert([profile])
      .select()
      .single();

    if (error) throw error;
    return data as BarberProfile;
  },

  async getPortfolioPhotos(barberId: string) {
    const { data, error } = await supabase
      .from("portfolio_photos")
      .select("*")
      .eq("barber_id", barberId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async addPortfolioPhoto(barberId: string, appointmentId: string, imageUrl: string) {
    const { error } = await supabase
      .from("portfolio_photos")
      .insert([
        {
          barber_id: barberId,
          appointment_id: appointmentId,
          image_url: imageUrl,
        },
      ]);

    if (error) throw error;
  }
};
