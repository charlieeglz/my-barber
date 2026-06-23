"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase redirige con el token en el hash; la sesión se recupera automáticamente
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      setError(err.message || "Error al actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-12 text-center">
        <Link href="/" className="mb-8 inline-block text-3xl font-black tracking-tighter text-foreground">
          Barber<span className="text-primary">App</span>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Nueva contraseña</h1>
        <p className="mt-2 text-muted-foreground">
          {ready ? "Elige una nueva contraseña para tu cuenta." : "Validando tu enlace de recuperación..."}
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-secondary/30 p-8 shadow-2xl backdrop-blur-sm">
        {success ? (
          <div className="space-y-4 text-center">
            <div className="text-4xl">✅</div>
            <p className="font-bold text-primary">¡Contraseña actualizada!</p>
            <p className="text-sm text-muted-foreground">Redirigiendo al login...</p>
          </div>
        ) : !ready ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nueva contraseña
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
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Confirmar contraseña
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-center text-xs font-medium text-red-400 border border-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Actualizar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />}>
        <ResetContent />
      </Suspense>
    </main>
  );
}
