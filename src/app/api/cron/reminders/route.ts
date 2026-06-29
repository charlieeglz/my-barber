import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummykey");

// Admin client to query and update appointments
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    // 1. Verificación de seguridad opcional (si se configura CRON_SECRET)
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const now = new Date();
    // Buscar citas en las próximas 2 horas
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // 2. Consultar citas pendientes que no tengan recordatorio enviado
    const { data: appointments, error: queryError } = await supabaseAdmin
      .from("appointments")
      .select(`
        *,
        barbershops (
          full_name,
          user_id
        ),
        staff (
          name,
          user_id
        )
      `)
      .eq("status", "pending")
      .eq("reminder_sent", false)
      .gte("appointment_date", now.toISOString())
      .lte("appointment_date", twoHoursLater.toISOString());

    if (queryError) {
      console.error("Error al buscar citas para recordatorio:", queryError);
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ message: "No hay citas pendientes de recordatorio en las próximas 2 horas." });
    }

    const isResendConfigured = !!process.env.RESEND_API_KEY;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const notifiedIds: string[] = [];

    // Estilos de los emails (Estética Premium Barberia)
    const emailStyle = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f4f5;
      padding: 40px 20px;
      color: #18181b;
    `;
    const cardStyle = `
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #e4e4e7;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    `;
    const headerStyle = `
      background-color: #09090b;
      padding: 32px;
      text-align: center;
      border-bottom: 2px solid #ca8a04;
    `;
    const bodyStyle = `
      padding: 32px;
    `;
    const titleStyle = `
      font-size: 20px;
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    `;
    const listStyle = `
      background-color: #f4f4f5;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
      list-style-type: none;
    `;
    const listItemStyle = `
      margin-bottom: 12px;
      font-size: 14px;
    `;
    const footerStyle = `
      text-align: center;
      padding: 24px 32px;
      background-color: #fafafa;
      border-top: 1px solid #f4f4f5;
      font-size: 12px;
      color: #71717a;
    `;

    for (const apt of appointments) {
      let clientEmail = "";
      
      if (hasServiceKey && apt.client_id) {
        try {
          const { data } = await supabaseAdmin.auth.admin.getUserById(apt.client_id);
          if (data?.user?.email) clientEmail = data.user.email;
        } catch (e) {
          console.error(`Error al obtener email para cliente ${apt.client_id}:`, e);
        }
      } else {
        clientEmail = "oficialbestyle@gmail.com";
      }

      // Redirigir todos los correos a tu email autorizado de Resend en local para facilitar pruebas
      if (process.env.NODE_ENV === "development") {
        clientEmail = "oficialbestyle@gmail.com";
      }

      if (clientEmail) {
        const dateObj = new Date(apt.appointment_date);
        const formattedTime = dateObj.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const html = `
          <div style="${emailStyle}">
            <div style="${cardStyle}">
              <div style="${headerStyle}">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase;">
                  Recordatorio de Cita
                </h1>
              </div>
              <div style="${bodyStyle}">
                <h2 style="${titleStyle} color: #ca8a04;">¡Tu cita es hoy!</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #3f3f46;">
                  Hola <strong>${apt.customer_name}</strong>, te recordamos que tienes una cita programada para hoy:
                </p>
                <ul style="${listStyle}">
                  <li style="${listItemStyle}">💈 <strong>Negocio:</strong> ${apt.barbershops?.full_name}</li>
                  <li style="${listItemStyle}">✂️ <strong>Profesional:</strong> ${apt.staff?.name}</li>
                  <li style="${listItemStyle}">⏰ <strong>Hora:</strong> ${formattedTime} hs (en menos de 2 horas)</li>
                </ul>
                <p style="font-size: 13px; color: #71717a; line-height: 1.5;">
                  Por favor, intenta llegar 5 minutos antes. ¡Te esperamos!
                </p>
              </div>
              <div style="${footerStyle}">
                &copy; ${new Date().getFullYear()} ${apt.barbershops?.full_name}
              </div>
            </div>
          </div>
        `;

        if (isResendConfigured) {
          try {
            await resend.emails.send({
              from: `${apt.barbershops?.full_name || "Barberia"} <onboarding@resend.dev>`,
              to: clientEmail,
              subject: `Recordatorio de Cita - Hoy a las ${formattedTime}`,
              html,
            });
          } catch (e) {
            console.error(`Error al enviar correo de recordatorio a ${clientEmail}:`, e);
            continue; // No marcar como enviado si falló el correo
          }
        } else {
          console.log(`[Simulación] Recordatorio de cita enviado a Cliente (${clientEmail}) para las ${formattedTime}`);
        }

        // 3. Marcar como enviado en la BD
        const { error: updateError } = await supabaseAdmin
          .from("appointments")
          .update({ reminder_sent: true })
          .eq("id", apt.id);

        if (updateError) {
          console.error(`Error al actualizar reminder_sent para cita ${apt.id}:`, updateError);
        } else {
          notifiedIds.push(apt.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: appointments.length,
      notifiedIds,
      simulated: !isResendConfigured
    });

  } catch (error: any) {
    console.error("Error en cron reminders API route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
