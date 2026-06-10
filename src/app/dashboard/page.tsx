"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { barberService, BarberProfile } from "@/lib/services/barber.service";
import { appointmentService, Appointment } from "@/lib/services/appointment.service";
import { storageService } from "@/lib/services/storage.service";
import { dateUtils } from "@/lib/utils/date-utils";
import { Calendar } from "@/components/dashboard/Calendar";
import { AppointmentCard } from "@/components/dashboard/AppointmentCard";

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth("barber");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [barber, setBarber] = useState<BarberProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(dateUtils.getTodayString());
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      try {
        const barberData = await barberService.getByUserId(user.id);
        
        if (!barberData) {
          router.push("/dashboard/onboarding");
          return;
        }

        setBarber(barberData);

        const appointmentsData = await appointmentService.getByBarber(barberData.id);
        setAppointments(appointmentsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  const handlePhotoUpload = async (file: File, apt: Appointment) => {
    setUploadingId(apt.id);

    try {
      const fileName = storageService.generateFileName(apt.id, file);
      const filePath = `${apt.barber_id}/${fileName}`;
      
      const publicUrl = await storageService.uploadImage(file, "portfolio", filePath);

      await barberService.addPortfolioPhoto(apt.barber_id, apt.id, publicUrl);
      await appointmentService.updateStatus(apt.id, "completed");

      setAppointments((prev) =>
        prev.map((a) => (a.id === apt.id ? { ...a, status: "completed" } : a)),
      );
    } catch (error) {
      console.error(error);
      alert("Error al subir la foto");
    } finally {
      setUploadingId(null);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    return apt.appointment_date.split("T")[0] === selectedDate;
  });

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="font-medium text-gray-500">Cargando tu espacio...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Panel de {barber?.name}
          </h1>
          <button
            onClick={signOut}
            className="rounded text-sm font-medium text-gray-500 hover:text-black"
          >
            Cerrar Sesión
          </button>
        </div>

        <Calendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          appointments={appointments}
        />

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">
            Citas del {selectedDate.split("-").reverse().join("/")}
          </h3>
          <span className="text-sm font-medium text-gray-500">
            {filteredAppointments.length} citas
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAppointments.map((apt) => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              onPhotoUpload={handlePhotoUpload}
              isUploading={uploadingId === apt.id}
            />
          ))}
          {filteredAppointments.length === 0 && (
            <div className="col-span-full rounded-xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
              No tienes citas programadas para esta fecha.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
