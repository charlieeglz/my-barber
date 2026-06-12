"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { appointmentService, Appointment } from "@/lib/services/appointment.service";
import { dateUtils } from "@/lib/utils/date-utils";

export default function ClienteDashboard() {
  const { user, loading: authLoading, signOut } = useAuth("client");
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      if (!user) return;
      try {
        const data = await appointmentService.getByClient(user.id);
        setAppointments(data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      fetchAppointments();
    }
  }, [user, authLoading]);

  async function handleCancel(id: string) {
    const confirmDelete = window.confirm(
      "¿Seguro que quieres cancelar esta cita?",
    );
    if (!confirmDelete) return;

    try {
      await appointmentService.delete(id);
      setAppointments((prev) => prev.filter((apt) => apt.id !== id));
    } catch (error) {
      alert("Error al cancelar la cita");
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-5xl">
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
            <div className="mb-6 text-4xl text-muted-foreground opacity-50">🗓️</div>
            <p className="mb-8 max-w-xs text-xl font-medium text-muted-foreground">
              No tienes ninguna cita programada por ahora.
            </p>
            <Link href="/explorar" className="inline-flex items-center gap-2 font-bold text-primary hover:underline">
              Explorar barberías <span>→</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-secondary/30 p-8 transition-all hover:border-primary/50 hover:bg-secondary"
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
                          : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      }`}
                    >
                      {apt.status === "completed" ? "Finalizada" : "Pendiente"}
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

                {apt.status !== "completed" && (
                  <div className="relative mt-8 pt-6 border-t border-border/50">
                    <button
                      onClick={() => handleCancel(apt.id)}
                      className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 py-3 text-sm font-bold text-red-400 transition-all hover:bg-red-500 hover:text-white"
                    >
                      <CancelIcon className="h-4 w-4" />
                      Cancelar Cita
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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

function CancelIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
