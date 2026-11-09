import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const cookieStore = await cookies();
  const pendingRole = cookieStore.get("sb-pending-role")?.value as
    | "barber"
    | "client"
    | null;
  const roleParam = (searchParams.get("role") || pendingRole) as
    | "barber"
    | "client"
    | null;
  const next = searchParams.get("next") ?? "/cliente";

  // Cookies de sesión que Supabase quiere fijar; se aplican sobre la redirección
  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = [];
  const redirectWithSession = (url: string) => {
    const res = NextResponse.redirect(url);
    pendingCookies.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options),
    );
    res.cookies.delete("sb-pending-role");
    return res;
  };

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // Guardamos las cookies para copiarlas en la respuesta de redirección
            cookiesToSet.forEach((c) => pendingCookies.push(c));
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Si el usuario no tiene rol aún (primer login con Google) y se pasó un rol,
      // lo guardamos en los metadatos del usuario
      const existingRole = user?.user_metadata?.role;
      const resolvedRole = existingRole || roleParam || "client";

      if (!existingRole && roleParam && user) {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (serviceKey) {
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceKey,
          );
          const { error: updateError } =
            await supabaseAdmin.auth.admin.updateUserById(user.id, {
              user_metadata: {
                ...user.user_metadata,
                role: roleParam,
              },
            });
          if (updateError) {
            console.error(
              "Error updating user metadata via admin client:",
              updateError,
            );
            return NextResponse.redirect(
              `${origin}/login?error=admin_update_error_${encodeURIComponent(updateError.message)}`,
            );
          }
        } else {
          console.warn(
            "SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to authenticated client.auth.updateUser",
          );
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              role: roleParam,
            },
          });
          if (updateError) {
            console.error(
              "Error updating user metadata via authenticated client:",
              updateError,
            );
            return NextResponse.redirect(
              `${origin}/login?error=user_update_error_${encodeURIComponent(updateError.message)}`,
            );
          }
        }
      }

      const destination = resolvedRole === "barber" ? "/dashboard" : next;
      return redirectWithSession(`${origin}${destination}`);
    }

    console.error("exchangeCodeForSession error:", error);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Si algo falla, volver al login
  const oauthError = searchParams.get("error_description") || "auth_callback_error";
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(oauthError)}`,
  );
}
