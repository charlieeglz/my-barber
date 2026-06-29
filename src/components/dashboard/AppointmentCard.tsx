"use client";

import { Appointment } from "@/lib/services/appointment.service";
import { dateUtils } from "@/lib/utils/date-utils";

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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5 sm:h-4 sm:w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                </svg>
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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
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

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function CancelIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.967C16.63 2.016 14.16 1.01 11.536 1.01c-5.438 0-9.863 4.37-9.867 9.801 0 2.03.541 4.021 1.568 5.761l-.994 3.634 3.744-.973zm13.067-7.393c-.303-.151-1.793-.883-2.073-.984-.28-.102-.484-.151-.688.151-.204.303-.79.984-.968 1.186-.178.204-.356.228-.659.077-1.2-.6-2.019-1.05-2.827-2.44-.216-.372.216-.345.618-1.144.103-.204.051-.383-.026-.534-.076-.151-.688-1.66-.943-2.274-.248-.596-.5-.515-.688-.525-.178-.009-.382-.01-.587-.01a1.13 1.13 0 0 0-.817.382c-.282.303-1.074 1.047-1.074 2.553 0 1.506 1.099 2.96 1.252 3.162.154.204 2.163 3.303 5.239 4.629.732.316 1.302.505 1.748.647.736.233 1.407.2 1.938.12.592-.09 1.793-.733 2.048-1.439.256-.706.256-1.314.18-1.44-.077-.127-.282-.204-.585-.355z" />
    </svg>
  );
}
