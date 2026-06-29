import { supabase } from "../supabase";
import type { WorkingHours } from "./barber.service";

export type AppointmentStatus = "pending" | "completed" | "cancelled";

export type Appointment = {
  id: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string;
  status: AppointmentStatus;
  barber_id: string; // ID de la Barbería (Barbershop)
  staff_id: string;  // ID del Peluquero específico
  client_id?: string;
  created_at?: string;
  barbershops?: {
    full_name: string;
    working_hours?: WorkingHours | null;
    slug?: string;
  };
  staff?: {
    name: string;
  };
};

export type CreateAppointmentData = {
  barber_id: string;
  staff_id: string;
  client_id?: string | null;
  customer_name: string;
  customer_phone: string;
  appointment_date: string;
  status: AppointmentStatus;
};

export const appointmentService = {
  // Obtener todas las citas de una barbería (para el dueño)
  async getByBarbershop(barbershopId: string) {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, staff(name), barbershops(full_name, working_hours, slug)")
      .eq("barber_id", barbershopId)
      .order("appointment_date", { ascending: true });

    if (error) throw error;
    return data as Appointment[];
  },

  // Obtener citas de un barbero específico
  async getByStaff(staffId: string) {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, staff(name), barbershops(full_name, working_hours, slug)")
      .eq("staff_id", staffId)
      .order("appointment_date", { ascending: true });

    if (error) throw error;
    return data as Appointment[];
  },

  async getByClient(clientId: string) {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        barbershops (
          full_name,
          working_hours,
          slug
        ),
        staff (
          name
        )
      `)
      .eq("client_id", clientId)
      .order("appointment_date", { ascending: true });

    if (error) throw error;
    return data as Appointment[];
  },

  // Importante: Ahora buscamos horas ocupadas por MIEMBRO DEL STAFF
  async getBookedTimes(staffId: string, date: string) {
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from("appointments")
      .select("appointment_date")
      .eq("staff_id", staffId)
      .gte("appointment_date", startOfDay)
      .lte("appointment_date", endOfDay)
      .eq("status", "pending");

    if (error) throw error;
    
    return data.map((apt) => {
      const d = new Date(apt.appointment_date);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    });
  },

  async create(data: CreateAppointmentData) {
    // Comprobación anti-colisión: verificar que el slot sigue libre antes de insertar
    const { data: existing, error: checkError } = await supabase
      .from("appointments")
      .select("id")
      .eq("staff_id", data.staff_id)
      .eq("appointment_date", data.appointment_date)
      .neq("status", "cancelled")
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      throw new Error("Este horario acaba de ser reservado por otro cliente. Por favor, elige otro.");
    }

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
  },

  async reschedule(id: string, staffId: string, newDate: string) {
    // Comprobación anti-colisión: verificar que el slot sigue libre antes de actualizar
    const { data: existing, error: checkError } = await supabase
      .from("appointments")
      .select("id")
      .eq("staff_id", staffId)
      .eq("appointment_date", newDate)
      .neq("status", "cancelled")
      .neq("id", id)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      throw new Error("Este horario ya está reservado. Por favor, elige otro.");
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .update({ appointment_date: newDate })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return appointment;
  }
};
