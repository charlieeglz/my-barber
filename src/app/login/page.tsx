"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authService } from "@/lib/services/auth.service";
import { useAuth } from "@/hooks/useAuth";

function LoginContent() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [role, setRole] = useState<"barber" | "client">("client");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && profile) {
      const redirectPath = profile.role === "barber" ? "/dashboard" : nextParam || "/cliente";
      router.push(redirectPath);
    }
  }, [user, profile, authLoading, nextParam, router]);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await authService.signIn(email, password);
        // The redirection will be handled by the useEffect or manually here
        router.push(role === "barber" ? "/dashboard" : nextParam || "/cliente");
      } else {
        await authService.signUp(email, password, name, role);
        router.push(role === "barber" ? "/dashboard" : nextParam || "/cliente");
      }
    } catch (err: any) {
      setError(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) return <p className="text-center py-8">Verificando sesión...</p>;

  return (
    <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
        {isLogin ? "Acceso a la plataforma" : "Crear nueva cuenta"}
      </h1>

      <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setRole("client")}
          className={`w-1/2 rounded-md py-2 text-sm font-medium transition-colors ${role === "client" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"}`}
        >
          Soy Cliente
        </button>
        <button
          type="button"
          onClick={() => setRole("barber")}
          className={`w-1/2 rounded-md py-2 text-sm font-medium transition-colors ${role === "barber" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"}`}
        >
          Soy Barbero
        </button>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre completo
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black px-4 py-2 font-medium text-white hover:bg-gray-800 disabled:bg-gray-400"
        >
          {loading ? "Procesando..." : isLogin ? "Entrar" : "Registrarse"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="font-semibold text-black hover:underline"
        >
          {isLogin ? "Regístrate" : "Inicia sesión"}
        </button>
      </p>

      {error && (
        <p className="mt-4 text-center text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Login() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Suspense fallback={<p>Cargando...</p>}>
        <LoginContent />
      </Suspense>
    </main>
  );
}
