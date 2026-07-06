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
import { RescheduleModal } from "@/components/RescheduleModal";
import {
  EyeIcon,
  CalendarIcon,
  UserIcon as ProfileIcon,
  PlusIcon,
  TeamIcon,
} from "@/components/Icons";

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
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<{
    open: boolean;
    appointment: Appointment | null;
  }>({ open: false, appointment: null });
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Estados para Cita Manual
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [manualCustomerPhone, setManualCustomerPhone] = useState("");
  const [manualStaffId, setManualStaffId] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [manualDate, setManualDate] = useState(dateUtils.getTodayString());
  const [manualBookedTimes, setManualBookedTimes] = useState<string[]>([]);

  useEffect(() => {
    if (isManualModalOpen && manualDate && manualStaffId) {
      appointmentService.getBookedTimes(manualStaffId, manualDate).then(setManualBookedTimes).catch(console.error);
    }
  }, [manualDate, manualStaffId, isManualModalOpen]);

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
        if (staffData.length > 0) {
          setManualStaffId(staffData[0].id);
        }
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

  const handleCancel = async (apt: Appointment) => {
    setCancelingId(apt.id);
    try {
      const res = await fetch("/api/appointments/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appointmentId: apt.id }),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || "No se pudo cancelar");
      }

      setAppointments((prev) =>
        prev.map((a) => (a.id === apt.id ? { ...a, status: "cancelled" } : a))
      );
    } catch (error) {
      console.error(error);
      alert("Error al cancelar la cita");
    } finally {
      setCancelingId(null);
    }
  };

  const handleRescheduleSuccess = (appointmentId: string, newDate: string) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, appointment_date: newDate } : apt
      )
    );
  };

  const handleCreateManualAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barber || !manualCustomerName.trim() || !manualCustomerPhone.trim() || !manualStaffId || !manualDate || !manualTime) {
      alert("Por favor rellena todos los campos.");
      return;
    }

    try {
      const combinedDate = dateUtils.combineDateAndTime(manualDate, manualTime);
      const newApt = await appointmentService.create({
        barber_id: barber.id,
        staff_id: manualStaffId,
        client_id: null,
        customer_name: manualCustomerName.trim(),
        customer_phone: manualCustomerPhone.replace(/\s/g, ""),
        appointment_date: combinedDate,
        status: "pending"
      });

      const staffMember = staff.find(s => s.id === manualStaffId);
      const newAptWithStaff = {
        ...newApt,
        staff: {
          name: staffMember ? staffMember.name : ""
        }
      };

      setAppointments((prev) => [...prev, newAptWithStaff as Appointment]);

      // Reset form and close modal
      setManualCustomerName("");
      setManualCustomerPhone("");
      setManualTime("");
      setIsManualModalOpen(false);
      alert("Cita manual creada con éxito.");
    } catch (err: any) {
      console.error(err);
      alert("Error al crear la cita: " + err.message);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const d = new Date(apt.appointment_date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const localDateString = `${year}-${month}-${day}`;

    const matchesDate = localDateString === selectedDate;
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
              <button
                onClick={() => {
                  setManualDate(selectedDate);
                  setIsManualModalOpen(true);
                }}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] sm:px-5 sm:text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                Nueva Cita
              </button>
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
                href="/cliente"
                className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-bold text-foreground transition-all hover:border-primary/50 hover:bg-secondary sm:px-5 sm:text-sm"
              >
                <CalendarIcon className="h-4 w-4 text-primary" />
                Mis Citas (Cliente)
              </Link>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:col-span-4 lg:grid-cols-1 lg:gap-6">
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

            {/* Código QR Escaparate (Costo 0€) */}
            {isOwner && barber && origin && (
              <div className="relative overflow-hidden rounded-3xl border border-border bg-secondary/30 p-5 text-center shadow-xl backdrop-blur-sm sm:p-6 flex flex-col justify-between items-center">
                <div className="absolute -right-4 -top-4 h-10 w-10 rounded-full bg-primary/10 blur-xl" />
                <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground w-full">
                  QR Escaparate
                </h3>
                <div className="mx-auto my-2 flex h-28 w-28 items-center justify-center rounded-2xl bg-white p-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(origin + '/' + barber.slug)}`}
                    alt="Código QR de la Barbería"
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                  Escanea para reservar online al instante.
                </p>
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(origin + '/' + barber.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground transition-all hover:bg-secondary"
                >
                  Ver QR Grande
                </a>
              </div>
            )}
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
                onCancel={handleCancel}
                isCanceling={cancelingId === apt.id}
                onReschedule={(appointment) => setRescheduleModal({ open: true, appointment })}
              />
            ))}
            {filteredAppointments.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-secondary/10 py-16 text-center md:py-24">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground opacity-50">
                  <CalendarIcon className="h-7 w-7" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">No hay citas para este día.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Cita Manual */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-xl font-black text-foreground mb-4">Añadir Cita Manual</h2>
            <form onSubmit={handleCreateManualAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={manualCustomerName}
                  onChange={(e) => setManualCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Teléfono</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. 600000000"
                  value={manualCustomerPhone}
                  onChange={(e) => setManualCustomerPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Barbero Asignado</label>
                <select
                  value={manualStaffId}
                  onChange={(e) => setManualStaffId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Hora</label>
                  <select
                    value={manualTime}
                    required
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Selecciona hora</option>
                    {dateUtils.getAvailableSlots(manualDate, manualBookedTimes, barber?.working_hours, 30).map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="flex-1 rounded-xl border border-border bg-secondary/50 py-3 text-xs font-bold text-foreground transition-all hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground transition-all hover:opacity-90"
                >
                  Guardar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
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

