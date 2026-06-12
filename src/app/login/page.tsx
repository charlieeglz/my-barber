"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authService } from "@/lib/services/auth.service";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

function LoginContent() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const isConfirmed = searchParams.get("confirmed");
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [role, setRole] = useState<"barber" | "client">("client");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConfirmed) {
      setSuccess("¡Email confirmado con éxito! Ahora puedes iniciar sesión.");
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (!authLoading && user && profile && !isConfirmed) {
      const redirectPath = profile.role === "barber" ? "/dashboard" : nextParam || "/cliente";
      router.push(redirectPath);
    }
  }, [user, profile, authLoading, nextParam, router, isConfirmed]);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        const { user: authUser } = await authService.signIn(email, password);
        const actualRole = authUser?.user_metadata?.role || role;
        router.refresh(); // Forzar sincronización de cookies en el servidor
        router.push(actualRole === "barber" ? "/dashboard" : nextParam || "/cliente");
      } else {
        await authService.signUp(email, password, name, role, phone);
        setSuccess("Registro casi completado. Revisa tu email para confirmar tu cuenta.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );

  return (
    <div className="w-full max-w-md">
      <div className="mb-12 text-center">
        <Link href="/" className="mb-8 inline-block text-3xl font-black tracking-tighter text-foreground">
          Barber<span className="text-primary">App</span>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta profesional"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isLogin ? "Accede a tu panel y gestiona tus reservas." : "Únete a la red de barberías más exclusiva."}
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-secondary/30 p-8 shadow-2xl backdrop-blur-sm">
        {success && (
          <div className="mb-6 rounded-xl bg-primary/10 p-4 text-center text-sm font-medium text-primary border border-primary/20">
            {success}
          </div>
        )}

        <div className="mb-8 flex rounded-xl bg-background/50 p-1.5 border border-border">
          <button
            type="button"
            onClick={() => setRole("client")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${role === "client" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
          >
            Soy Cliente
          </button>
          <button
            type="button"
            onClick={() => setRole("barber")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${role === "barber" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
          >
            Soy Barbero
          </button>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-5">
          {!isLogin && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Teléfono móvil
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="600 000 000"
                  className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
                />
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Procesando..." : isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {isLogin ? "¿Aún no tienes cuenta? " : "¿Ya eres miembro? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold text-primary hover:underline"
            >
              {isLogin ? "Regístrate ahora" : "Entra aquí"}
            </button>
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-red-500/10 p-3 text-center text-xs font-medium text-red-400 border border-red-500/20">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />}>
        <LoginContent />
      </Suspense>
    </main>
  );
}
