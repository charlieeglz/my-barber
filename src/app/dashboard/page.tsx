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

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user || !profile) return;
      
      try {
        let barbershopId: string;
        
        if (profile.staffInfo) {
          barbershopId = profile.staffInfo.barbershop_id;
          setBarber(profile.staffInfo.barbershops);
        } else {
          const barberData = await barberService.getByUserId(user.id);
          if (!barberData) {
            router.push("/dashboard/onboarding");
            return;
          }
          barbershopId = barberData.id;
          setBarber(barberData);
        }

        const [staffData, appointmentsData] = await Promise.all([
          barberService.getStaffByBarbershop(barbershopId),
          profile.staffInfo?.role === 'owner' || !profile.staffInfo
            ? appointmentService.getByBarbershop(barbershopId)
            : appointmentService.getByStaff(profile.staffInfo.id)
        ]);

        setStaff(staffData);
        setAppointments(appointmentsData);
        
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  const isOwner = profile?.staffInfo?.role === 'owner';

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 md:px-12 md:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:mb-12">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {isOwner ? `Panel de ${barber?.name}` : `Agenda de ${profile?.staffInfo?.name}`}
            </h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-primary sm:text-sm">
              {isOwner ? 'Administrador' : 'Barbero Profesional'}
            </p>
          </div>
          {/* Botones — scroll horizontal en móvil */}
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
              {isOwner && (
                <Link
                  href={`/${barber?.slug}`}
                  target="_blank"
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-bold text-foreground transition-all hover:border-primary/50 hover:bg-secondary sm:px-5 sm:text-sm"
                >
                  <EyeIcon className="h-4 w-4 text-primary" />
                  Ver como Cliente
                </Link>
              )}
              <Link
                href="/dashboard/perfil"
                className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-bold text-foreground transition-all hover:border-primary/50 hover:bg-secondary sm:px-5 sm:text-sm"
              >
                <ProfileIcon className="h-4 w-4 text-primary" />
                Editar Perfil
              </Link>
              {isOwner && (
                <Link
                  href="/dashboard/equipo"
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-bold text-foreground transition-all hover:border-primary/50 hover:bg-secondary sm:px-5 sm:text-sm"
                >
                  <TeamIcon className="h-4 w-4 text-primary" />
                  Mi Equipo
                </Link>
              )}
              <button
                onClick={signOut}
                className="shrink-0 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-bold text-muted-foreground transition-all hover:border-foreground hover:text-foreground sm:px-5 sm:text-sm"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {/* Grid principal — calendario + sidebar */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Calendario ocupa todo en móvil, 8 columnas en desktop */}
          <div className="lg:col-span-8">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              appointments={appointments}
            />
          </div>

          {/* Sidebar — fila horizontal en móvil, columna en desktop */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-4 lg:grid-cols-1 lg:gap-6">
            {/* Filtro de profesional */}
            <div className="rounded-3xl border border-border bg-secondary/30 p-5 shadow-xl backdrop-blur-sm sm:p-6">
              <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground sm:mb-4">
                Profesional
              </h3>
              <select
                value={selectedStaffFilter}
                onChange={(e) => setSelectedStaffFilter(e.target.value)}
                disabled={!isOwner}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-all sm:px-4 sm:py-3 sm:text-sm"
              >
                {isOwner && <option value="all">Todo el equipo</option>}
                {staff.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>

            {/* Contador de citas */}
            <div className="relative overflow-hidden rounded-3xl border border-border bg-secondary/30 p-5 text-center shadow-xl backdrop-blur-sm sm:p-6">
              <div className="absolute -right-4 -top-4 h-10 w-10 rounded-full bg-primary/10 blur-xl" />
              <p className="text-4xl font-black text-primary sm:text-5xl">{filteredAppointments.length}</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground sm:text-[10px]">
                Citas hoy
              </p>
              <div className="mt-3 flex justify-center">
                <div className="h-1 w-6 rounded-full bg-primary/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Lista de citas */}
        <div className="mt-10 md:mt-16">
          <div className="mb-6 flex items-center gap-4 md:mb-8">
            <h3 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Detalle de la Agenda
            </h3>
            <div className="h-px flex-1 bg-border hidden sm:block" />
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
              <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-secondary/10 py-16 text-center md:py-24">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-muted-foreground">No hay citas para este día.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function TeamIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.483 8.633 7.07 6 11.25 6s7.767 2.633 9.214 5.678c.07.147.07.313 0 .46C19.017 15.367 15.43 18 11.25 18s-7.767-2.633-9.214-5.678Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}
