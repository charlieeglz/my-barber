"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBooking } from "@/hooks/useBooking";
import { AuthModal } from "@/components/auth/AuthModal";

export default function ReservaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const barberSlug = resolvedParams.slug;
  const router = useRouter();

  // Cargamos auth pero no exigimos rol para permitir ver el formulario
  const { user, profile, loading: authLoading } = useAuth();
  
  const {
    barber,
    loading: bookingLoading,
    notFound,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    availableSlots,
    bookingLoading: actionLoading,
    message,
    handleCreateBooking,
  } = useBooking(barberSlug);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPendingBooking, setIsPendingBooking] = useState(false);

  // Sincronizamos el nombre si el usuario está logueado
  useEffect(() => {
    if (profile?.full_name) {
      setName(profile.full_name);
    }
  }, [profile]);

  // Si había una reserva pendiente y el usuario se logueó, ejecutarla
  useEffect(() => {
    if (user && isPendingBooking) {
      executeBooking();
      setIsPendingBooking(false);
    }
  }, [user, isPendingBooking]);

  const onBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setIsPendingBooking(true);
      setShowAuthModal(true);
      return;
    }

    executeBooking();
  };

  const executeBooking = async () => {
    if (!user) return;
    const success = await handleCreateBooking(user.id, name, phone);
    if (success) {
      setTimeout(() => {
        router.push("/cliente");
      }, 1500);
    }
  };

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Barbería no encontrada
          </h1>
          <Link href="/explorar" className="mt-4 block text-blue-600 hover:underline">
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  if (authLoading || bookingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">Cargando formulario...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="mb-6 text-center text-2xl font-bold capitalize text-gray-900">
          Reserva en {barber?.full_name || barberSlug}
        </h1>

        <form onSubmit={onBookingSubmit} className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Tus datos</h2>
            <Link
              href={`/${barberSlug}`}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Volver al perfil
            </Link>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="¿A quién anotamos?"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Para enviarte recordatorios"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime("");
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          {selectedDate && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Hora
              </label>
              {availableSlots.length === 0 ? (
                <p className="text-sm font-medium text-red-600">
                  No hay horas disponibles para este día.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setSelectedTime(h)}
                      className={`rounded-md border py-2 text-sm font-medium transition-colors ${selectedTime === h ? "border-black bg-black text-white" : "border-gray-300 bg-white text-gray-700 hover:border-black"}`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={actionLoading || !selectedDate || !selectedTime}
            className="mt-4 w-full rounded-md bg-black px-4 py-2 font-medium text-white hover:bg-gray-800 disabled:bg-gray-400"
          >
            {actionLoading ? "Procesando..." : "Confirmar Reserva"}
          </button>
        </form>
        {message && (
          <p
            className={`mt-4 text-center text-sm font-medium ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}
          >
            {message}
          </p>
        )}
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </main>
  );
}
