import { supabase } from "../supabase";

/** Cancela una cita vía API enviando la sesión del usuario. Lanza Error con el mensaje real. */
export async function cancelAppointment(appointmentId: string) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Tu sesión ha caducado. Vuelve a iniciar sesión.");

  const res = await fetch("/api/appointments/cancel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ appointmentId }),
  });

  let resData: { error?: string } = {};
  try {
    resData = await res.json();
  } catch {
    // respuesta no JSON (p.ej. error 500 de la plataforma)
  }
  if (!res.ok || resData.error) {
    throw new Error(resData.error || `No se pudo cancelar (HTTP ${res.status})`);
  }
}
