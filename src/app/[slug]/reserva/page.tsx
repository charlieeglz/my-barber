"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBooking } from "@/hooks/useBooking";
import { AuthModal } from "@/components/auth/AuthModal";
import { dateUtils } from "@/lib/utils/date-utils";
import Image from "next/image";

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

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
    selectedService,
    setSelectedService,
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
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
            </svg>
          </div>
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
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12 md:py-16">

        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/${barberSlug}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver al perfil
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Reserva tu <span className="text-primary">Cita</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            En <span className="font-bold text-foreground">{barber?.full_name}</span>
          </p>
        </div>

        <form onSubmit={onBookingSubmit} className="space-y-6">

          {/* ── PASO 1: Profesional ── */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            <StepLabel number={1} title="Profesional" />
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {staff.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => { setSelectedStaff(member); setSelectedTime(""); }}
                  className={`relative flex shrink-0 flex-col items-center rounded-xl border p-3 transition-all
                    ${selectedStaff?.id === member.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/40"
                    }`}
                  style={{ minWidth: "88px" }}
                >
                  {/* Avatar */}
                  <div className="relative mb-2 h-12 w-12 overflow-hidden rounded-full border-2 border-background shadow">
                    {member.avatar_url ? (
                      <Image src={member.avatar_url} alt={member.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-base font-black text-muted-foreground">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className={`w-full text-center text-xs font-black leading-tight ${selectedStaff?.id === member.id ? "text-primary" : "text-foreground"}`}>
                    {member.name}
                  </span>
                  <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
                    {member.role === "owner" ? "Máster" : "Barbero"}
                  </span>
                  {selectedStaff?.id === member.id && (
                    <div className="absolute -right-1.5 -top-1.5 rounded-full bg-background text-primary">
                      <CheckCircleIcon className="h-4 w-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── PASO 2: Servicio ── */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            <StepLabel number={2} title="Servicio" />
            {!barber?.services?.length ? (
              <p className="mt-4 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                Este barbero no tiene servicios configurados aún.
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                {barber.services.map((service, idx) => {
                  const isSelected = selectedService?.name === service.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setSelectedService(service); setSelectedTime(""); }}
                      className={`flex w-full items-center rounded-xl border px-4 py-3 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      {/* Icono indicador */}
                      <div className={`mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
                      }`}>
                        {isSelected
                          ? <CheckCircleIcon className="h-4 w-4" />
                          : <ScissorsIcon className="h-3.5 w-3.5" />
                        }
                      </div>

                      {/* Nombre + detalles */}
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-black ${isSelected ? "text-primary" : "text-foreground"}`}>
                          {service.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <ClockIcon className="h-3 w-3 shrink-0" />
                          <span>{formatDuration(service.duration_minutes ?? 30)}</span>
                        </p>
                      </div>

                      {/* Precio — siempre visible a la derecha */}
                      <span className={`ml-3 shrink-0 text-base font-black ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {dateUtils.formatPrice(service.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── PASO 3: Fecha y Hora ── */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            <StepLabel number={3} title="Fecha y Hora" />
            <div className="mt-4 space-y-4">
              {/* Selector de fecha */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  min={dateUtils.getTodayString()}
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:dark]"
                />
              </div>

              {/* Slots de hora */}
              {selectedDate && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Horarios disponibles
                    {selectedService && (
                      <span className="ml-1.5 normal-case font-normal text-muted-foreground/60">
                        · {formatDuration(selectedService.duration_minutes ?? 30)}
                      </span>
                    )}
                  </label>
                  {availableSlots.length === 0 ? (
                    <div className="flex items-center rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
                      Sin disponibilidad para este día.
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {availableSlots.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setSelectedTime(h)}
                          className={`rounded-xl border py-2.5 text-center text-xs font-black transition-all ${
                            selectedTime === h
                              ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                              : "border-border bg-background text-foreground hover:border-primary/40"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── PASO 4: Datos personales ── */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            <StepLabel number={4} title="Tus datos" />
            <div className="mt-4 flex flex-col gap-3 sm:grid sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Teléfono móvil
                </label>
                <input
                  type="tel"
                  required
                  placeholder="600 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* ── Resumen + Botón ── */}
          <div className="space-y-4">
            {selectedService && selectedDate && selectedTime && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-primary">Resumen de tu cita</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground">Servicio</span>
                    <span className="text-right font-bold text-foreground">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duración</span>
                    <span className="font-bold text-foreground">{formatDuration(selectedService.duration_minutes ?? 30)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horario</span>
                    <span className="font-bold text-foreground">
                      {selectedTime} → {(() => {
                        const [h, m] = selectedTime.split(":").map(Number);
                        const end = new Date(0, 0, 0, h, m + (selectedService.duration_minutes ?? 30));
                        return `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-primary/10 pt-2">
                    <span className="font-bold text-muted-foreground">Total</span>
                    <span className="text-base font-black text-primary">{dateUtils.formatPrice(selectedService.price)}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={actionLoading || !selectedStaff || !selectedService || !selectedDate || !selectedTime}
              className="w-full rounded-2xl bg-primary py-4 text-base font-black text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {actionLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Procesando...
                </span>
              ) : (
                "Confirmar Cita →"
              )}
            </button>

            {message && (
              <div className={`rounded-xl border p-3 text-center text-sm font-bold ${
                message.includes("Error")
                  ? "border-red-500/20 bg-red-500/10 text-red-400"
                  : "border-primary/20 bg-primary/10 text-primary"
              }`}>
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

/* ── Componente de etiqueta de paso ── */
function StepLabel({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground shadow-sm shadow-primary/30">
        {number}
      </span>
      <h2 className="text-base font-black text-foreground">{title}</h2>
    </div>
  );
}

/* ── Iconos ── */
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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m7.848 8.25 1.536.887M7.848 8.25a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm1.536.887a2.165 2.165 0 0 1 1.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 1 1-5.196 3 3 3 0 0 1 5.196-3Zm1.536-.887a2.165 2.165 0 0 1 1.083-1.839 8.054 8.054 0 0 0 .112-1.02M9.384 14.863l7.552-4.36M18.75 9a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm0 0a3 3 0 1 1 5.196 3 3 3 0 0 1-5.196-3Z" />
    </svg>
  );
}
