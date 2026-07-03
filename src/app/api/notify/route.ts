import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummykey");

// Admin client to fetch user emails (auth schema is private)
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables: supabaseUrl and key are required.");
  }
  return createClient(url, key);
};

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { type, appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json({ error: "Falta appointmentId" }, { status: 400 });
    }

    // 1. Obtener detalles de la cita con relaciones
    const { data: appointment, error: fetchError } = await supabaseAdmin
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
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      console.error("Error al obtener cita:", fetchError);
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    // 2. Obtener correos electrónicos de los involucrados
    const client_id = appointment.client_id;
    const staff_user_id = appointment.staff?.user_id;
    const owner_user_id = appointment.barbershops?.user_id;

    let clientEmail = "";
    let staffEmail = "";
    let ownerEmail = "";

    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasServiceKey) {
      // Obtener emails desde Auth Admin API
      const emailPromises = [];

      if (client_id) {
        emailPromises.push(
          supabaseAdmin.auth.admin.getUserById(client_id).then(res => {
            if (res.data?.user?.email) clientEmail = res.data.user.email;
          }).catch(err => console.error("Error al obtener email del cliente:", err))
        );
      }

      if (staff_user_id) {
        emailPromises.push(
          supabaseAdmin.auth.admin.getUserById(staff_user_id).then(res => {
            if (res.data?.user?.email) staffEmail = res.data.user.email;
          }).catch(err => console.error("Error al obtener email del staff:", err))
        );
      }

      if (owner_user_id && owner_user_id !== staff_user_id) {
        emailPromises.push(
          supabaseAdmin.auth.admin.getUserById(owner_user_id).then(res => {
            if (res.data?.user?.email) ownerEmail = res.data.user.email;
          }).catch(err => console.error("Error al obtener email del dueño:", err))
        );
      }

      await Promise.all(emailPromises);
    } else {
      console.warn("SUPABASE_SERVICE_ROLE_KEY no está configurada. Simulación de emails activada.");
      clientEmail = "oficialbestyle@gmail.com";
      staffEmail = "oficialbestyle@gmail.com";
      ownerEmail = "oficialbestyle@gmail.com";
    }

    // Redirigir todos los correos a tu email autorizado de Resend en local para facilitar pruebas
    if (process.env.NODE_ENV === "development") {
      clientEmail = "oficialbestyle@gmail.com";
      staffEmail = "oficialbestyle@gmail.com";
      ownerEmail = "oficialbestyle@gmail.com";
    }

    // 3. Formatear fecha y hora
    const dateObj = new Date(appointment.appointment_date);
    const formattedDate = dateObj.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = dateObj.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const isResendConfigured = !!process.env.RESEND_API_KEY;

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

    // 4. Enviar correos según el tipo
    const sendResults = [];

    if (type === "booking") {
      // --- NOTIFICACIÓN DE NUEVA RESERVA ---
      
      // A) Para el cliente
      if (clientEmail) {
        const clientHtml = `
          <div style="${emailStyle}">
            <div style="${cardStyle}">
              <div style="${headerStyle}">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase;">
                  ${appointment.barbershops?.full_name || "Barbería"}
                </h1>
              </div>
              <div style="${bodyStyle}">
                <h2 style="${titleStyle} color: #ca8a04;">¡Tu reserva está confirmada!</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #3f3f46;">
                  Hola <strong>${appointment.customer_name}</strong>, gracias por tu reserva. Aquí tienes los detalles de tu cita:
                </p>
                <ul style="${listStyle}">
                  <li style="${listItemStyle}">💈 <strong>Negocio:</strong> ${appointment.barbershops?.full_name}</li>
                  <li style="${listItemStyle}">✂️ <strong>Profesional:</strong> ${appointment.staff?.name}</li>
                  <li style="${listItemStyle}">📅 <strong>Fecha:</strong> ${formattedDate}</li>
                  <li style="${listItemStyle}">⏰ <strong>Hora:</strong> ${formattedTime} hs</li>
                </ul>
                <p style="font-size: 13px; color: #71717a; line-height: 1.5;">
                  Si necesitas cancelar o modificar tu cita, puedes hacerlo desde tu panel de cliente en la aplicación.
                </p>
              </div>
              <div style="${footerStyle}">
                Te esperamos. ¡Gracias por confiar en nosotros!<br/>
                &copy; ${new Date().getFullYear()} ${appointment.barbershops?.full_name}
              </div>
            </div>
          </div>
        `;

        if (isResendConfigured) {
          sendResults.push(
            resend.emails.send({
              from: `${appointment.barbershops?.full_name || "Barberia"} <onboarding@resend.dev>`,
              to: clientEmail,
              subject: `Reserva Confirmada - ${appointment.barbershops?.full_name}`,
              html: clientHtml,
            }).catch(e => ({ error: e }))
          );
        } else {
          console.log(`[Simulación] Correo enviado a Cliente (${clientEmail}): Reserva Confirmada`);
        }
      }

      // B) Para el barbero (staff)
      if (staffEmail) {
        const staffHtml = `
          <div style="${emailStyle}">
            <div style="${cardStyle}">
              <div style="${headerStyle}">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase;">
                  Nueva Cita Recibida
                </h1>
              </div>
              <div style="${bodyStyle}">
                <h2 style="${titleStyle} color: #18181b;">Nueva reserva en tu agenda</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #3f3f46;">
                  Hola <strong>${appointment.staff?.name}</strong>, se ha agendado una nueva cita contigo:
                </p>
                <ul style="${listStyle}">
                  <li style="${listItemStyle}">👤 <strong>Cliente:</strong> ${appointment.customer_name}</li>
                  <li style="${listItemStyle}">📞 <strong>Teléfono:</strong> ${appointment.customer_phone}</li>
                  <li style="${listItemStyle}">📅 <strong>Fecha:</strong> ${formattedDate}</li>
                  <li style="${listItemStyle}">⏰ <strong>Hora:</strong> ${formattedTime} hs</li>
                </ul>
                <p style="font-size: 13px; color: #71717a; line-height: 1.5;">
                  Puedes ver esta cita en tu panel de control de barbero.
                </p>
              </div>
              <div style="${footerStyle}">
                &copy; ${new Date().getFullYear()} Barber App
              </div>
            </div>
          </div>
        `;

        if (isResendConfigured) {
          sendResults.push(
            resend.emails.send({
              from: "Barber App <onboarding@resend.dev>",
              to: staffEmail,
              subject: `Nueva Cita - ${appointment.customer_name}`,
              html: staffHtml,
            }).catch(e => ({ error: e }))
          );
        } else {
          console.log(`[Simulación] Correo enviado a Barbero (${staffEmail}): Nueva Cita`);
        }
      }

    } else if (type === "cancel") {
      // --- NOTIFICACIÓN DE CANCELACIÓN ---

      // A) Para el cliente
      if (clientEmail) {
        const clientHtml = `
          <div style="${emailStyle}">
            <div style="${cardStyle}">
              <div style="${headerStyle}">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase;">
                  Cita Cancelada
                </h1>
              </div>
              <div style="${bodyStyle}">
                <h2 style="${titleStyle} color: #ef4444;">Tu cita ha sido cancelada</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #3f3f46;">
                  Hola <strong>${appointment.customer_name}</strong>, te notificamos que tu cita programada ha sido cancelada:
                </p>
                <ul style="${listStyle}">
                  <li style="${listItemStyle}">💈 <strong>Negocio:</strong> ${appointment.barbershops?.full_name}</li>
                  <li style="${listItemStyle}">✂️ <strong>Profesional:</strong> ${appointment.staff?.name}</li>
                  <li style="${listItemStyle}">📅 <strong>Fecha:</strong> ${formattedDate}</li>
                  <li style="${listItemStyle}">⏰ <strong>Hora:</strong> ${formattedTime} hs</li>
                </ul>
                <p style="font-size: 14px; line-height: 1.6; color: #3f3f46;">
                  Si deseas programar una nueva cita, puedes hacerlo en cualquier momento explorando el perfil de la barbería.
                </p>
              </div>
              <div style="${footerStyle}">
                Disculpa las molestias.<br/>
                &copy; ${new Date().getFullYear()} ${appointment.barbershops?.full_name}
              </div>
            </div>
          </div>
        `;

        if (isResendConfigured) {
          sendResults.push(
            resend.emails.send({
              from: `${appointment.barbershops?.full_name || "Barberia"} <onboarding@resend.dev>`,
              to: clientEmail,
              subject: `Cita Cancelada - ${appointment.barbershops?.full_name}`,
              html: clientHtml,
            }).catch(e => ({ error: e }))
          );
        } else {
          console.log(`[Simulación] Correo enviado a Cliente (${clientEmail}): Cita Cancelada`);
        }
      }

      // B) Para el barbero (staff)
      if (staffEmail) {
        const staffHtml = `
          <div style="${emailStyle}">
            <div style="${cardStyle}">
              <div style="${headerStyle}">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase;">
                  Cita Cancelada
                </h1>
              </div>
              <div style="${bodyStyle}">
                <h2 style="${titleStyle} color: #ef4444;">Una cita ha sido cancelada</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #3f3f46;">
                  Hola <strong>${appointment.staff?.name}</strong>, se ha cancelado la siguiente cita en tu agenda:
                </p>
                <ul style="${listStyle}">
                  <li style="${listItemStyle}">👤 <strong>Cliente:</strong> ${appointment.customer_name}</li>
                  <li style="${listItemStyle}">📅 <strong>Fecha:</strong> ${formattedDate}</li>
                  <li style="${listItemStyle}">⏰ <strong>Hora:</strong> ${formattedTime} hs</li>
                </ul>
                <p style="font-size: 13px; color: #71717a; line-height: 1.5;">
                  El espacio de tiempo ha quedado liberado y vuelve a estar disponible para reservas.
                </p>
              </div>
              <div style="${footerStyle}">
                &copy; ${new Date().getFullYear()} Barber App
              </div>
            </div>
          </div>
        `;

        if (isResendConfigured) {
          sendResults.push(
            resend.emails.send({
              from: "Barber App <onboarding@resend.dev>",
              to: staffEmail,
              subject: `Cita Cancelada - ${appointment.customer_name}`,
              html: staffHtml,
            }).catch(e => ({ error: e }))
          );
        } else {
          console.log(`[Simulación] Correo enviado a Barbero (${staffEmail}): Cita Cancelada`);
        }
      }
    }

    if (isResendConfigured && sendResults.length > 0) {
      const settledResults = await Promise.all(sendResults);
      return NextResponse.json({ success: true, results: settledResults });
    }

    return NextResponse.json({
      success: true,
      simulated: !isResendConfigured,
      clientEmail,
      staffEmail,
    });

  } catch (error: any) {
    console.error("Error en notify API route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
