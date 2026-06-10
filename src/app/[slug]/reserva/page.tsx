"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBooking } from "@/hooks/useBooking";
import { AuthModal } from "@/components/auth/AuthModal";
import Image from "next/image";

export default function ReservaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const barberSlug = resolvedParams.slug;
  const router = useRouter();

  const { user, profile, loading: authLoading } = useAuth();
  
  const {
    barber,
    staff,
    loading: bookingLoading,
    notFound,
    selectedStaff,
    setSelectedStaff,
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

  // Sincronizamos los datos del perfil si el usuario está logueado
  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
    if (profile?.phone) setPhone(profile.phone);
  }, [profile]);

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
          <h1 className="text-2xl font-bold text-gray-900">Barbería no encontrada</h1>
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
        <p className="text-gray-500 font-medium">Cargando...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Reserva en {barber?.full_name}
          </h1>
          <Link href={`/${barberSlug}`} className="text-sm font-medium text-gray-500 hover:text-black">
            ← Volver al perfil
          </Link>
        </div>

        <form onSubmit={onBookingSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          {/* Paso 1: Elegir Barbero */}
          <section>
            <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs text-white">1</span>
              Elige a tu profesional
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {staff.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setSelectedStaff(member);
                    setSelectedTime(""); // Reset time when staff changes
                  }}
                  className={`group flex flex-col items-center rounded-xl border p-4 transition-all
                    ${selectedStaff?.id === member.id ? "border-black bg-black text-white shadow-md" : "border-gray-100 bg-white hover:border-gray-300"}
                  `}
                >
                  <div className="relative mb-3 h-16 w-16 overflow-hidden rounded-full border-2 border-white shadow-sm">
                    {member.avatar_url ? (
                      <Image src={member.avatar_url} alt={member.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xl font-bold text-gray-400">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-center">{member.name}</span>
                  <span className={`text-[10px] uppercase tracking-wider opacity-60`}>
                    {member.role === 'owner' ? 'Máster' : 'Barbero'}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Paso 2: Elegir Fecha y Hora */}
          <section>
            <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs text-white">2</span>
              ¿Cuándo quieres venir?
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime("");
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hora para {selectedStaff?.name}</label>
                  {availableSlots.length === 0 ? (
                    <p className="text-sm font-medium text-red-600 p-3 bg-red-50 rounded-lg">No hay horas libres hoy.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setSelectedTime(h)}
                          className={`rounded-lg border py-2 text-sm font-medium transition-all
                            ${selectedTime === h ? "border-black bg-black text-white shadow-md" : "border-gray-200 bg-white text-gray-700 hover:border-black"}
                          `}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Paso 3: Tus Datos */}
          <section>
            <h2 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs text-white">3</span>
              Confirma tus datos
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                type="text" required placeholder="Tu nombre"
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-black focus:outline-none"
              />
              <input
                type="tel" required placeholder="Teléfono móvil"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-black focus:outline-none"
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={actionLoading || !selectedStaff || !selectedDate || !selectedTime}
            className="w-full rounded-2xl bg-black py-5 text-lg font-bold text-white shadow-xl transition-all hover:bg-gray-800 disabled:bg-gray-300 active:scale-[0.98]"
          >
            {actionLoading ? "Procesando..." : "Confirmar Reserva"}
          </button>

          {message && (
            <p className={`mt-4 text-center font-medium ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}>
              {message}
            </p>
          )}
        </form>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />
    </main>
  );
}
