"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { appointmentService, Appointment } from "@/lib/services/appointment.service";
import { reviewService } from "@/lib/services/review.service";
import { dateUtils } from "@/lib/utils/date-utils";
import { useRouter } from "next/navigation";
import { ReviewModal } from "@/components/ReviewModal";
import { RescheduleModal } from "@/components/RescheduleModal";

export default function ClienteDashboard() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  // Estado del modal de reseña
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    appointment: Appointment | null;
  }>({ open: false, appointment: null });

  // Estado del modal de reprogramación
  const [rescheduleModal, setRescheduleModal] = useState<{
    open: boolean;
    appointment: Appointment | null;
  }>({ open: false, appointment: null });

  // Redirigir si no está autenticado tras cargar
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const [data, reviewed] = await Promise.all([
          appointmentService.getByClient(user.id),
          reviewService.getReviewedAppointmentIds(user.id),
        ]);
        setAppointments(data);
        setReviewedIds(new Set(reviewed));
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  async function handleCancel(id: string) {
    const confirmCancel = window.confirm(
      "¿Seguro que quieres cancelar esta cita?",
    );
    if (!confirmCancel) return;

    try {
      const res = await fetch("/api/appointments/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appointmentId: id }),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || "No se pudo cancelar");
      }

      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: "cancelled" as const } : apt))
      );
    } catch (error) {
      console.error(error);
      alert("Error al cancelar la cita");
    }
  }

  function handleReviewSuccess(appointmentId: string) {
    setReviewedIds((prev) => new Set([...prev, appointmentId]));
  }

  function handleRescheduleSuccess(appointmentId: string, newDate: string) {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === appointmentId ? { ...apt, appointment_date: newDate } : apt))
    );
  }

  if (authLoading || loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-5xl">
        {profile?.role === "barber" && (
          <Link
            href="/dashboard"
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            ← Volver al Panel de Barbero
          </Link>
        )}
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
              Mis <span className="text-primary">Citas</span>
            </h1>
            <p className="mt-2 text-muted-foreground">Gestiona tus reservas y consulta tu historial.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/explorar"
              className="rounded-xl border border-primary bg-primary/10 px-6 py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
            >
              Nueva Reserva
            </Link>
            <button
              onClick={signOut}
              className="rounded-xl border border-border bg-secondary/50 px-6 py-2.5 text-sm font-bold text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-secondary/20 py-32 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <p className="mb-8 max-w-xs text-xl font-medium text-muted-foreground">
              No tienes ninguna cita programada por ahora.
            </p>
            <Link href="/explorar" className="inline-flex items-center gap-2 font-bold text-primary hover:underline">
              Explorar barberías <span>→</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {appointments.map((apt) => {
              const isCompleted = apt.status === "completed";
              const alreadyReviewed = reviewedIds.has(apt.id);

              return (
                <div
                  key={apt.id}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-8 transition-all ${
                    apt.status === "cancelled"
                      ? "border-border bg-secondary/10 opacity-60"
                      : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary"
                  }`}
                >
                  {/* Status indicator glow */}
                  <div className={`absolute -right-12 -top-12 h-24 w-24 rounded-full blur-3xl transition-opacity opacity-20 ${
                    apt.status === "completed" ? "bg-primary" : "bg-yellow-500"
                  }`} />

                  <div className="relative">
                    <div className="mb-6 flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                          {dateUtils.formatFriendlyDate(apt.appointment_date)}
                        </h3>
                        <p className="text-3xl font-black text-foreground">
                          {dateUtils.formatFriendlyTime(apt.appointment_date)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                          apt.status === "completed"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : apt.status === "cancelled"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                        }`}
                      >
                        {dateUtils.getStatusLabel(apt.status)}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border text-primary">
                          <BarberIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Barbería</p>
                          <p className="font-bold text-foreground truncate">
                            {apt.barbershops?.full_name || "Barbería"}
                          </p>
                        </div>
                      </div>

                      {apt.staff?.name && (
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border text-primary">
                            <UserIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Especialista</p>
                            <p className="font-bold text-foreground">
                              {apt.staff.name}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="relative mt-8 space-y-3 pt-6 border-t border-border/50">
                    {/* Botón reseña — solo en citas completadas */}
                    {isCompleted && (
                      alreadyReviewed ? (
                        <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-3 text-sm font-bold text-primary">
                          <StarFilledIcon className="h-4 w-4" />
                          Reseña publicada
                        </div>
                      ) : (
                        <button
                          id={`review-btn-${apt.id}`}
                          onClick={() => setReviewModal({ open: true, appointment: apt })}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-3 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                        >
                          <StarIcon className="h-4 w-4" />
                          Dejar reseña
                        </button>
                      )
                    )}

                    {/* Botones de acción — solo en citas pendientes */}
                    {apt.status === "pending" && (
                      profile?.role === "barber" ? (
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => setRescheduleModal({ open: true, appointment: apt })}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-3 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                            </svg>
                            Reprogramar
                          </button>
                          <button
                            onClick={() => handleCancel(apt.id)}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 py-3 text-sm font-bold text-red-400 transition-all hover:bg-red-500 hover:text-white cursor-pointer"
                          >
                            <CancelIcon className="h-4 w-4" />
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCancel(apt.id)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 py-3 text-sm font-bold text-red-400 transition-all hover:bg-red-500 hover:text-white cursor-pointer"
                        >
                          <CancelIcon className="h-4 w-4" />
                          Cancelar Cita
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de reseña */}
      {reviewModal.appointment && user && (
        <ReviewModal
          isOpen={reviewModal.open}
          onClose={() => setReviewModal({ open: false, appointment: null })}
          onSuccess={handleReviewSuccess}
          appointmentId={reviewModal.appointment.id}
          barbershopId={reviewModal.appointment.barber_id}
          staffId={reviewModal.appointment.staff_id}
          staffName={reviewModal.appointment.staff?.name}
          barbershopName={reviewModal.appointment.barbershops?.full_name}
          clientId={user.id}
        />
      )}

      {/* Modal de reprogramación */}
      {rescheduleModal.appointment && (
        <RescheduleModal
          isOpen={rescheduleModal.open}
          onClose={() => setRescheduleModal({ open: false, appointment: null })}
          onSuccess={handleRescheduleSuccess}
          appointment={rescheduleModal.appointment}
        />
      )}
    </main>
  );
}

function BarberIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H21.64m-11.14 0V9.308m11.14 9.308V3.692m0 0a.75.75 0 0 1 .75-.75h.385a.75.75 0 0 1 .75.75v11.077a.75.75 0 0 1-.75.75h-.385a.75.75 0 0 1-.75-.75M2.36 21V3.692m0 0a.75.75 0 0 0-.75-.75H1.23a.75.75 0 0 0-.75.75v11.077a.75.75 0 0 0 .75.75h.385a.75.75 0 0 0 .75-.75M2.36 21h7.78m11.5 0h-7.78m-1.34-4.5h-1.053a.75.75 0 0 0-.75.75V21" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );
}

function StarFilledIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
    </svg>
  );
}

function CancelIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
