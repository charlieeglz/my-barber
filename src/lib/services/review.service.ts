import { supabase } from "../supabase";

export type Review = {
  id: string;
  appointment_id: string;
  barbershop_id: string;
  staff_id: string | null;
  client_id: string;
  rating: number; // 1-5
  comment: string | null;
  created_at: string;
  // Joins opcionales
  staff?: { name: string } | null;
};

export type CreateReviewData = {
  appointment_id: string;
  barbershop_id: string;
  staff_id: string | null;
  client_id: string;
  rating: number;
  comment?: string;
};

export const reviewService = {
  // Obtener todas las reseñas de una barbería (para vista pública)
  async getByBarbershop(barbershopId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from("reviews")
      .select("*, staff(name)")
      .eq("barbershop_id", barbershopId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Review[];
  },

  // Obtener la reseña de un cliente para un appointment específico (si ya existe)
  async getByAppointment(appointmentId: string): Promise<Review | null> {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("appointment_id", appointmentId)
      .maybeSingle();

    if (error) throw error;
    return data as Review | null;
  },

  // Obtener todos los appointment_id que ya tienen reseña (para un cliente)
  async getReviewedAppointmentIds(clientId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("reviews")
      .select("appointment_id")
      .eq("client_id", clientId);

    if (error) throw error;
    return (data ?? []).map((r) => r.appointment_id);
  },

  // Crear una nueva reseña
  async create(reviewData: CreateReviewData): Promise<Review> {
    const { data, error } = await supabase
      .from("reviews")
      .insert([reviewData])
      .select()
      .single();

    if (error) throw error;
    return data as Review;
  },

  // Calcular la media y el total de reseñas de una barbería
  calcStats(reviews: Review[]): { average: number; total: number } {
    if (reviews.length === 0) return { average: 0, total: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: Math.round((sum / reviews.length) * 10) / 10,
      total: reviews.length,
    };
  },
};
