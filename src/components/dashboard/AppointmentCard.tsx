"use client";

import { Appointment } from "@/lib/services/appointment.service";
import { dateUtils } from "@/lib/utils/date-utils";
import {
  ClockIcon,
  UserIcon,
  CameraIcon,
  CheckIcon,
  CancelCircleIcon as CancelIcon,
  WhatsAppIcon,
  CalendarIcon,
} from "@/components/Icons";

interface AppointmentCardProps {
  appointment: Appointment;
  onPhotoUpload: (file: File, appointment: Appointment) => void;
  isUploading: boolean;
  onCancel?: (appointment: Appointment) => void;
  isCanceling?: boolean;
  onReschedule?: (appointment: Appointment) => void;
}

export function AppointmentCard({
  appointment,
  onPhotoUpload,
  isUploading,
  onCancel,
  isCanceling = false,
  onReschedule
}: AppointmentCardProps) {
  const isCompleted = appointment.status === "completed";
  const isCancelled = appointment.status === "cancelled";


  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-secondary/50 p-4 transition-all hover:bg-secondary sm:p-6">
      <div className="mb-4 sm:mb-6">
        <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4">
          <div className="min-w-0 space-y-0.5">
            <h3 className="truncate text-base font-bold text-foreground sm:text-xl">
              {appointment.customer_name}
            </h3>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {appointment.customer_phone}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider sm:px-3 sm:text-[10px] ${
              isCompleted
                ? "bg-primary/10 text-primary border border-primary/20"
                : isCancelled
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
            }`}
          >
            {dateUtils.getStatusLabel(appointment.status)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-foreground sm:gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground sm:h-8 sm:w-8">
              <ClockIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <span className="text-xs font-medium sm:text-sm">
              {dateUtils.formatFriendlyTime(appointment.appointment_date)}
            </span>
          </div>

          {appointment.staff?.name && (
            <div className="flex items-center gap-2 text-sm text-foreground sm:gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground sm:h-8 sm:w-8">
                <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className="truncate text-xs font-medium sm:text-sm">
                {appointment.staff.name}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-3 sm:pt-4">
        {appointment.status === "pending" ? (
          <div className="flex flex-col gap-2">
            <label
              className={`group relative flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] sm:py-3 sm:text-sm ${
                isUploading || isCanceling ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <CameraIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {isUploading ? "Subiendo..." : "Subir Resultado"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onPhotoUpload(file, appointment);
                }}
                disabled={isUploading || isCanceling}
              />
            </label>

            {/* Botón WhatsApp de Recordatorio (Costo 0€) */}
            {(() => {
              const formattedTime = dateUtils.formatFriendlyTime(appointment.appointment_date);
              const message = `Hola ${appointment.customer_name}, te recordamos tu cita de hoy a las ${formattedTime} hs. ¡Te esperamos!`;
              const encodedMessage = encodeURIComponent(message);
              let phoneClean = appointment.customer_phone.replace(/[^0-9]/g, "");
              if (phoneClean.length === 9 && (phoneClean.startsWith("6") || phoneClean.startsWith("7") || phoneClean.startsWith("8") || phoneClean.startsWith("9"))) {
                phoneClean = "34" + phoneClean;
              }
              const whatsappUrl = `https://wa.me/${phoneClean}?text=${encodedMessage}`;

              return (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500/10 py-2.5 text-xs font-bold text-green-400 transition-all hover:bg-green-500 hover:text-white sm:py-3 sm:text-sm"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Recordar por WhatsApp
                </a>
              );
            })()}

            {onReschedule && (
              <button
                type="button"
                onClick={() => onReschedule(appointment)}
                disabled={isUploading || isCanceling}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-2.5 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground sm:py-3 sm:text-sm cursor-pointer"
              >
                <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Reprogramar Cita
              </button>
            )}

            {onCancel && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`¿Estás seguro de que deseas cancelar la cita de ${appointment.customer_name}?`)) {
                    onCancel(appointment);
                  }
                }}
                disabled={isUploading || isCanceling}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 py-2.5 text-xs font-bold text-red-400 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50 sm:py-3 sm:text-sm"
              >
                <CancelIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isCanceling ? "Cancelando..." : "Cancelar Cita"}
              </button>
            )}
          </div>
        ) : isCompleted ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-xs font-medium text-muted-foreground sm:py-3 sm:text-sm">
            <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Cita finalizada
          </div>
        ) : (
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400 sm:py-3 sm:text-sm">
            <CancelIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Cita cancelada
          </div>
        )}
      </div>
    </div>
  );
}

