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
import {
  BarberIcon,
  UserIcon,
  StarIcon,
  StarFilledIcon,
  CancelIcon,
  CalendarIcon,
} from "@/components/Icons";

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
              <CalendarIcon className="h-8 w-8" />
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
                            <CalendarIcon className="h-4 w-4" />
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

