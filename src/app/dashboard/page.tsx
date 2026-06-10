"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { barberService, Barbershop, StaffMember } from "@/lib/services/barber.service";
import { appointmentService, Appointment } from "@/lib/services/appointment.service";
import { storageService } from "@/lib/services/storage.service";
import { dateUtils } from "@/lib/utils/date-utils";
import { Calendar } from "@/components/dashboard/Calendar";
import { AppointmentCard } from "@/components/dashboard/AppointmentCard";

export default function Dashboard() {
  const { user, profile, loading: authLoading, signOut } = useAuth("barber");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [barber, setBarber] = useState<Barbershop | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(dateUtils.getTodayString());
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>("all");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Perfil del usuario actual como miembro del staff
  const currentStaffMember = profile?.staffInfo;

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user || !profile) return;
      
      try {
        let barbershopId: string;
        
        // Si el usuario es staff (dueño o barbero), ya tenemos su info en el hook
        if (profile.staffInfo) {
          barbershopId = profile.staffInfo.barbershop_id;
          setBarber(profile.staffInfo.barbershops);
        } else {
          // Fallback: buscar si es un usuario que acaba de crear la barbería
          const barberData = await barberService.getByUserId(user.id);
          if (!barberData) {
            router.push("/dashboard/onboarding");
            return;
          }
          barbershopId = barberData.id;
          setBarber(barberData);
        }

        // Cargar equipo y citas
        const [staffData, appointmentsData] = await Promise.all([
          barberService.getStaffByBarbershop(barbershopId),
          profile.staffInfo?.role === 'owner' || !profile.staffInfo
            ? appointmentService.getByBarbershop(barbershopId)
            : appointmentService.getByStaff(profile.staffInfo.id)
        ]);

        setStaff(staffData);
        setAppointments(appointmentsData);
        
        // Si es barbero normal, forzar filtro a su ID
        if (profile.staffInfo?.role === 'barber') {
          setSelectedStaffFilter(profile.staffInfo.id);
        }

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchDashboardData();
    }
  }, [user, profile, authLoading, router]);

  const handlePhotoUpload = async (file: File, apt: Appointment) => {
    setUploadingId(apt.id);

    try {
      const fileName = storageService.generateFileName(apt.id, file);
      const filePath = `${apt.barber_id}/${fileName}`;
      
      const publicUrl = await storageService.uploadImage(file, "portfolio", filePath);

      await barberService.addPortfolioPhoto(apt.barber_id, apt.id, publicUrl, apt.staff_id);
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
    const matchesDate = apt.appointment_date.split("T")[0] === selectedDate;
    const matchesStaff = selectedStaffFilter === "all" || apt.staff_id === selectedStaffFilter;
    return matchesDate && matchesStaff;
  });

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="font-medium text-gray-500">Cargando tu espacio...</p>
      </div>
    );
  }

  const isOwner = profile?.staffInfo?.role === 'owner';

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              {isOwner ? `Panel de ${barber?.name}` : `Agenda de ${profile?.staffInfo?.name}`}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isOwner ? 'Administrador' : 'Barbero Profesional'}
            </p>
          </div>
          <div className="flex gap-4">
            {isOwner && (
               <Link
                href="/dashboard/equipo"
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Mi Equipo
              </Link>
            )}
            <button
              onClick={signOut}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              appointments={appointments}
            />
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                Filtros
              </h3>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Ver agenda de:</label>
                <select 
                  value={selectedStaffFilter}
                  onChange={(e) => setSelectedStaffFilter(e.target.value)}
                  disabled={!isOwner}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-black focus:outline-none disabled:opacity-60"
                >
                  {isOwner && <option value="all">Todo el equipo</option>}
                  {staff.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-gray-900">{filteredAppointments.length}</p>
              <p className="text-xs font-medium text-gray-500 uppercase mt-1">Citas para esta fecha</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            Detalle de citas
          </h3>

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
              <div className="col-span-full rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-500">
                No hay citas para mostrar en este profesional y fecha.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
