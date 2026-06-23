"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBooking } from "@/hooks/useBooking";
import { AuthModal } from "@/components/auth/AuthModal";
import { dateUtils } from "@/lib/utils/date-utils";
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

    // Validaciones de datos del cliente
    if (name.trim().length < 2) {
      alert("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    const phoneClean = phone.replace(/\s/g, "");
    if (!/^[6-9]\d{8}$/.test(phoneClean)) {
      alert("Introduce un teléfono español válido (9 dígitos, empieza por 6, 7, 8 o 9).");
      return;
    }

    if (!user) {
      setIsPendingBooking(true);
      setShowAuthModal(true);
      return;
    }
    executeBooking();
  };

  const executeBooking = async () => {
    if (!user) return;
    const success = await handleCreateBooking(user.id, name.trim(), phone.replace(/\s/g, ""));
    if (success) {
      setTimeout(() => {
        router.push("/cliente");
      }, 1500);
    }
  };

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="text-center">
          <div className="mb-6 text-6xl">💈</div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Barbería no encontrada</h1>
          <Link href="/explorar" className="inline-flex items-center rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition-all hover:scale-[1.02]">
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  if (authLoading || bookingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
              Reserva tu <span className="text-primary">Experiencia</span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Estás reservando en <span className="font-bold text-foreground">{barber?.full_name}</span>
            </p>
          </div>
          <Link href={`/${barberSlug}`} className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeftIcon className="h-4 w-4" />
            Volver al perfil
          </Link>
        </div>

        <form onSubmit={onBookingSubmit} className="space-y-10 rounded-3xl border border-border bg-secondary/30 p-8 shadow-2xl backdrop-blur-sm md:p-12">
          {/* Paso 1: Elegir Barbero */}
          <section>
            <div className="mb-6 flex items-center gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-black text-primary-foreground shadow-lg shadow-primary/20">1</span>
              <h2 className="text-xl font-black text-foreground">Selecciona tu Profesional</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {staff.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setSelectedStaff(member);
                    setSelectedTime("");
                  }}
                  className={`group relative flex flex-col items-center rounded-2xl border p-5 transition-all
                    ${selectedStaff?.id === member.id ? "border-primary bg-primary/10 shadow-lg shadow-primary/5" : "border-border bg-background/50 hover:border-primary/50"}
                  `}
                >
                  <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full border-4 border-background shadow-inner">
                    {member.avatar_url ? (
                      <Image src={member.avatar_url} alt={member.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-black text-muted-foreground">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className={`text-sm font-black transition-colors ${selectedStaff?.id === member.id ? "text-primary" : "text-foreground"}`}>{member.name}</span>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                    {member.role === 'owner' ? 'Máster' : 'Barbero'}
                  </span>
                  
                  {selectedStaff?.id === member.id && (
                    <div className="absolute right-3 top-3 text-primary">
                      <CheckCircleIcon className="h-5 w-5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Paso 2: Elegir Fecha y Hora */}
          <section>
            <div className="mb-6 flex items-center gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-black text-primary-foreground shadow-lg shadow-primary/20">2</span>
              <h2 className="text-xl font-black text-foreground">Elige el Momento</h2>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fecha de la cita</label>
                <input
                  type="date"
                  required
                  min={dateUtils.getTodayString()}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime("");
                  }}
                  className="w-full rounded-xl border border-border bg-background px-5 py-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
                />
              </div>

              {selectedDate && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Horarios disponibles</label>
                  {availableSlots.length === 0 ? (
                    <div className="flex h-[58px] items-center rounded-xl border border-red-500/20 bg-red-500/10 px-4 text-sm font-bold text-red-400">
                      Sin disponibilidad para este día.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setSelectedTime(h)}
                          className={`rounded-xl border py-3 text-sm font-black transition-all
                            ${selectedTime === h ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-border bg-background text-foreground hover:border-primary/50"}
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
            <div className="mb-6 flex items-center gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-black text-primary-foreground shadow-lg shadow-primary/20">3</span>
              <h2 className="text-xl font-black text-foreground">Confirma tus Datos</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nombre completo</label>
                <input
                  type="text" required placeholder="Tu nombre"
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-5 py-4 text-foreground focus:border-primary focus:outline-none placeholder:text-muted-foreground/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Teléfono móvil</label>
                <input
                  type="tel" required placeholder="600 000 000"
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-5 py-4 text-foreground focus:border-primary focus:outline-none placeholder:text-muted-foreground/30"
                />
              </div>
            </div>
          </section>

          <div className="pt-6">
            <button
              type="submit"
              disabled={actionLoading || !selectedStaff || !selectedDate || !selectedTime}
              className="group relative w-full overflow-hidden rounded-2xl bg-primary py-6 text-xl font-black text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                {actionLoading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Cita</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </>
                )}
              </div>
            </button>

            {message && (
              <div className={`mt-6 rounded-xl p-4 text-center font-bold border ${message.includes("Error") ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-primary/10 border-primary/20 text-primary"}`}>
                {message}
              </div>
            )}
          </div>
        </form>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />
    </main>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.74-5.24Z" clipRule="evenodd" />
    </svg>
  );
}
