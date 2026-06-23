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
  const [googleLoading, setGoogleLoading] = useState(false);

  // Recuperar contraseña
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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

    // Validaciones cliente (solo en registro)
    if (!isLogin) {
      if (name.trim().length < 2) {
        setError("El nombre debe tener al menos 2 caracteres.");
        return;
      }
      const phoneClean = phone.replace(/\s/g, "");
      if (!/^[6-9]\d{8}$/.test(phoneClean)) {
        setError("Introduce un teléfono español válido (9 dígitos, empieza por 6, 7, 8 o 9).");
        return;
      }
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { user: authUser } = await authService.signIn(email, password);
        const actualRole = authUser?.user_metadata?.role || role;
        router.refresh();
        router.push(actualRole === "barber" ? "/dashboard" : nextParam || "/cliente");
      } else {
        await authService.signUp(email, password, name.trim(), role, phone.replace(/\s/g, ""));
        setSuccess("Registro casi completado. Revisa tu email para confirmar tu cuenta.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError("");
    try {
      await authService.signInWithGoogle(role);
      // Supabase redirige automáticamente — no necesitamos hacer nada más aquí
    } catch (err: any) {
      setError(err.message || "Error al conectar con Google");
      setGoogleLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    try {
      await authService.resetPassword(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || "Error al enviar el email de recuperación");
    } finally {
      setResetLoading(false);
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

        {/* Selector de rol */}
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

        {/* Botón Google */}
        <button
          type="button"
          id="google-login-btn"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-3.5 text-sm font-bold text-foreground transition-all hover:bg-secondary hover:border-primary/30 active:scale-[0.98] disabled:opacity-50"
        >
          {googleLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          ) : (
            <GoogleIcon />
          )}
          {googleLoading ? "Conectando..." : "Continuar con Google"}
        </button>

        {/* Divisor */}
        <div className="relative mb-6 flex items-center">
          <div className="flex-grow border-t border-border" />
          <span className="mx-4 flex-shrink text-xs font-bold uppercase tracking-widest text-muted-foreground">
            o con email
          </span>
          <div className="flex-grow border-t border-border" />
        </div>

        {/* Formulario email/contraseña */}
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Contraseña
              </label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => { setShowReset(true); setResetEmail(email); setError(""); }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
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

      {/* Modal: Recuperar contraseña */}
      {showReset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowReset(false); setResetSent(false); }}}
        >
          <div className="w-full max-w-sm rounded-3xl border border-border bg-background p-8 shadow-2xl animate-in fade-in zoom-in-95">
            {resetSent ? (
              <div className="space-y-4 text-center">
                <div className="text-4xl">📬</div>
                <h2 className="text-lg font-black text-foreground">¡Email enviado!</h2>
                <p className="text-sm text-muted-foreground">
                  Revisa tu bandeja de entrada en <span className="font-bold text-primary">{resetEmail}</span> y haz clic en el enlace para crear tu nueva contraseña.
                </p>
                <button
                  onClick={() => { setShowReset(false); setResetSent(false); }}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-black text-foreground">Recuperar contraseña</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Te enviaremos un enlace para crear una nueva contraseña.
                  </p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="block w-full rounded-xl border border-border bg-secondary/30 px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
                  />
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                  >
                    {resetLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReset(false)}
                    className="w-full rounded-xl border border-border py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-all"
                  >
                    Cancelar
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
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

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
