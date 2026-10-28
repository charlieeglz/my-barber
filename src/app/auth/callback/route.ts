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

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete(name);
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

      // Limpiar la cookie de rol temporal
      cookieStore.delete("sb-pending-role");

      const destination = resolvedRole === "barber" ? "/dashboard" : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Si algo falla, volver al login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
