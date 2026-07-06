"use client";

import { useEffect, useState } from "react";
import { Appointment, appointmentService } from "@/lib/services/appointment.service";
import { dateUtils } from "@/lib/utils/date-utils";
import { CancelIcon } from "@/components/Icons";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appointmentId: string, newDate: string) => void;
  appointment: Appointment;
}

export function RescheduleModal({ isOpen, onClose, onSuccess, appointment }: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Cargar turnos ocupados al cambiar de fecha
  useEffect(() => {
    async function fetchBookedTimes() {
      if (!selectedDate) {
        setBookedTimes([]);
        return;
      }
      setLoadingSlots(true);
      setError("");
      try {
        const times = await appointmentService.getBookedTimes(appointment.staff_id, selectedDate);
        setBookedTimes(times);
      } catch (err) {
        console.error("Error al cargar turnos:", err);
        setError("Error al cargar horarios. Intenta de nuevo.");
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchBookedTimes();
  }, [selectedDate, appointment.staff_id]);

  if (!isOpen) return null;

  const workingHours = appointment.barbershops?.working_hours;
  const availableSlots = selectedDate
    ? dateUtils.getAvailableSlots(selectedDate, bookedTimes, workingHours, 30)
    : [];

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    setError("");

    try {
      const combinedDate = dateUtils.combineDateAndTime(selectedDate, selectedTime);
      await appointmentService.reschedule(appointment.id, appointment.staff_id, combinedDate);

      // Enviar correo de notificación (simulación o real según notify api)
      fetch("/api/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "booking", appointmentId: appointment.id }),
      }).catch((err) => console.error("Error al enviar notificación de reprogramación:", err));

      onSuccess(appointment.id, combinedDate);
      onClose();
    } catch (err) {
      console.error("Error al reprogramar:", err);
      const errMsg = err instanceof Error ? err.message : "Error al reprogramar la cita.";
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-foreground">Reprogramar Cita</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all cursor-pointer"
          >
            <CancelIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl bg-secondary/30 p-4 border border-border text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cita actual</p>
            <p className="mt-1.5 text-sm font-bold text-foreground">
              {appointment.barbershops?.full_name} · {appointment.staff?.name}
            </p>
            <p className="text-xs text-primary font-bold mt-1">
              {dateUtils.formatFriendlyDate(appointment.appointment_date)} a las {dateUtils.formatFriendlyTime(appointment.appointment_date)} hs
            </p>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nueva Fecha</label>
            <input
              type="date"
              min={dateUtils.getTodayString()}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime("");
              }}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:dark]"
            />
          </div>

          {selectedDate && (
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">Horarios Disponibles</label>
              {loadingSlots ? (
                <div className="flex justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-xs text-red-400 font-medium italic py-2">
                  No hay turnos disponibles para este día. Intenta con otra fecha.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                  {availableSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                        selectedTime === time
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.03]"
                          : "border border-border bg-background text-foreground hover:border-primary/30"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 font-medium bg-red-500/10 px-3 py-2.5 rounded-xl border border-red-500/20 text-left">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleConfirm}
              disabled={submitting || !selectedDate || !selectedTime}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? "Reprogramando..." : "Confirmar Reprogramación"}
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-border bg-background px-5 py-3 text-sm font-bold text-muted-foreground transition-all hover:border-foreground hover:text-foreground cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
