import { supabase } from "../supabase";

export type BarberService = {
  name: string;
  price: string;
};

export type Barbershop = {
  id: string;
  user_id: string;
  name: string;
  full_name: string;
  slug: string;
  num_barbers: number;
  avatar_url: string | null;
  cover_url: string | null;
  location: string | null;
  services: BarberService[];
  created_at?: string;
};

export type StaffRole = "owner" | "barber";

export type StaffMember = {
  id: string;
  barbershop_id: string;
  user_id: string | null;
  name: string;
  avatar_url: string | null;
  role: StaffRole;
  created_at?: string;
};

// Mantenemos BarberProfile como alias de Barbershop para compatibilidad temporal
export type BarberProfile = Barbershop;

export type CreateBarbershopData = Omit<Barbershop, "id" | "created_at">;

export const barberService = {
  // --- BARBERSHOPS (Negocios) ---
  
  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from("barbershops")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data as Barbershop;
  },

  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("barbershops")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as Barbershop | null;
  },

  async checkSlugAvailability(slug: string) {
    const { data, error } = await supabase
      .from("barbershops")
      .select("id")
      .eq("slug", slug)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return !data;
  },

  async createProfile(profile: CreateBarbershopData) {
    const { data, error } = await supabase
      .from("barbershops")
      .insert([profile])
      .select()
      .single();

    if (error) throw error;
    return data as Barbershop;
  },

  async updateBarbershop(id: string, updates: Partial<Barbershop>) {
    const { data, error } = await supabase
      .from("barbershops")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Barbershop;
  },

  // --- STAFF (Equipo) ---

  async getStaffByBarbershop(barbershopId: string) {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as StaffMember[];
  },

  async getStaffMemberByUserId(userId: string) {
    const { data, error } = await supabase
      .from("staff")
      .select("*, barbershops(*)")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as (StaffMember & { barbershops: Barbershop }) | null;
  },

  async addStaffMember(member: Omit<StaffMember, "id" | "created_at">) {
    const { data, error } = await supabase
      .from("staff")
      .insert([member])
      .select()
      .single();

    if (error) throw error;
    return data as StaffMember;
  },

  async updateStaffMember(id: string, updates: Partial<StaffMember>) {
    const { data, error } = await supabase
      .from("staff")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as StaffMember;
  },

  // --- PORTFOLIO ---

  async getPortfolioPhotos(barberId: string, staffId?: string) {
    let query = supabase
      .from("portfolio_photos")
      .select("*")
      .eq("barber_id", barberId);
    
    if (staffId) {
      query = query.eq("staff_id", staffId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async addPortfolioPhoto(barberId: string, appointmentId: string, imageUrl: string, staffId: string) {
    const { error } = await supabase
      .from("portfolio_photos")
      .insert([
        {
          barber_id: barberId,
          appointment_id: appointmentId,
          image_url: imageUrl,
          staff_id: staffId
        },
      ]);

    if (error) throw error;
  }
};
