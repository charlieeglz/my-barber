import { supabase } from "../supabase";

export type AppointmentStatus = "pending" | "completed" | "cancelled";

export type Appointment = {
  id: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string;
  status: AppointmentStatus;
  barber_id: string;
  client_id?: string;
  created_at?: string;
  barbers?: {
    full_name: string;
  };
};

export type CreateAppointmentData = {
  barber_id: string;
  client_id: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string;
  status: AppointmentStatus;
};

export const appointmentService = {
  async getByBarber(barberId: string) {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("barber_id", barberId)
      .order("appointment_date", { ascending: true });

    if (error) throw error;
    return data as Appointment[];
  },

  async getByClient(clientId: string) {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        barbers (
          full_name
        )
      `)
      .eq("client_id", clientId)
      .order("appointment_date", { ascending: true });

    if (error) throw error;
    return data as Appointment[];
  },

  async getBookedTimes(barberId: string, date: string) {
    const startOfDay = new Date(`${date}T00:00:00`).toISOString();
    const endOfDay = new Date(`${date}T23:59:59`).toISOString();

    const { data, error } = await supabase
      .from("appointments")
      .select("appointment_date")
      .eq("barber_id", barberId)
      .gte("appointment_date", startOfDay)
      .lte("appointment_date", endOfDay)
      .eq("status", "pending");

    if (error) throw error;
    
    return data.map((apt) => {
      const d = new Date(apt.appointment_date);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    });
  },

  async create(data: CreateAppointmentData) {
    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return appointment;
  },

  async updateStatus(id: string, status: AppointmentStatus) {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
};
