"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function WelcomePage() {
  const { user, profile } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-4xl text-center">
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 md:text-6xl">
          Bienvenido a <span className="text-black underline decoration-gray-300">BarberApp</span>
        </h1>
        <p className="mb-12 text-lg text-gray-600 md:text-xl">
          La plataforma definitiva para gestionar tus citas y encontrar a los mejores profesionales.
        </p>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Opción 1: Cliente */}
          <Link
            href="/explorar"
            className="group flex flex-col items-center rounded-3xl border border-gray-100 bg-white p-10 shadow-sm transition-all hover:-translate-y-2 hover:border-black hover:shadow-2xl"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 text-4xl transition-colors group-hover:bg-black group-hover:text-white">
              🔍
            </div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Busco una Barbería</h2>
            <p className="text-gray-500">
              Explora el directorio, mira trabajos reales y reserva tu próxima cita en segundos.
            </p>
            <span className="mt-8 inline-flex items-center font-bold text-black group-hover:underline">
              Explorar ahora →
            </span>
          </Link>

          {/* Opción 2: Barbero */}
          <Link
            href={user && profile?.role === "barber" ? "/dashboard" : "/login"}
            className="group flex flex-col items-center rounded-3xl border border-gray-100 bg-white p-10 shadow-sm transition-all hover:-translate-y-2 hover:border-black hover:shadow-2xl"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 text-4xl transition-colors group-hover:bg-black group-hover:text-white">
              💈
            </div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Soy una Barbería</h2>
            <p className="text-gray-500">
              Gestiona tu agenda, muestra tu portfolio y haz crecer tu negocio con nosotros.
            </p>
            <span className="mt-8 inline-flex items-center font-bold text-black group-hover:underline">
              Entrar al Panel →
            </span>
          </Link>
        </div>

        {/* Footer simple */}
        <div className="mt-16 text-sm text-gray-400">
          © 2026 BarberApp. Todos los derechos reservados.
        </div>
      </div>
    </main>
  );
}
