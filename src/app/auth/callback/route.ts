import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const roleParam = searchParams.get("role") as "barber" | "client" | null;
  const next = searchParams.get("next") ?? "/cliente";

  if (code) {
    const cookieStore = await cookies();
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
      const { data: { user } } = await supabase.auth.getUser();

      // Si el usuario no tiene rol aún (primer login con Google) y se pasó un rol,
      // lo guardamos en los metadatos del usuario
      const existingRole = user?.user_metadata?.role;
      const resolvedRole = existingRole || roleParam || "client";

      if (!existingRole && roleParam && user) {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            role: roleParam,
          }
        });
        if (updateError) {
          console.error("Error updating user metadata via admin client:", updateError);
        }
      }

      const destination = resolvedRole === "barber" ? "/dashboard" : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Si algo falla, volver al login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
