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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="font-medium text-gray-500">Cargando tu panel...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Mis Citas
          </h1>
          <div className="flex gap-4">
            <Link
              href="/"
              className="rounded text-sm font-medium text-blue-600 hover:underline"
            >
              Buscar Barberías
            </Link>
            <button
              onClick={signOut}
              className="rounded text-sm font-medium text-gray-500 hover:text-black"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
            No tienes ninguna cita programada. Ve al directorio para buscar tu
            barbería.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div>
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="text-lg font-bold capitalize text-gray-900">
                      {dateUtils.formatFriendlyDate(apt.appointment_date)}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        apt.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {apt.status === "completed" ? "Finalizada" : "Pendiente"}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 mb-2">
                    🕒 {dateUtils.formatFriendlyTime(apt.appointment_date)}
                  </p>
                  <p className="text-sm font-medium text-gray-600">
                    📍 {apt.barbers?.full_name || "Barbería"}
                  </p>
                </div>

                {apt.status !== "completed" && (
                  <div className="mt-6 border-t border-gray-50 pt-4">
                    <button
                      onClick={() => handleCancel(apt.id)}
                      className="w-full rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-100"
                    >
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
