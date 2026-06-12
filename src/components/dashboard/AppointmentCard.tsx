"use client";

import { Appointment } from "@/lib/services/appointment.service";
import { dateUtils } from "@/lib/utils/date-utils";

interface AppointmentCardProps {
  appointment: Appointment;
  onPhotoUpload: (file: File, appointment: Appointment) => void;
  isUploading: boolean;
}

export function AppointmentCard({ appointment, onPhotoUpload, isUploading }: AppointmentCardProps) {
  const isCompleted = appointment.status === "completed";

  return (
    <div
      className="flex flex-col justify-between rounded-2xl border border-border bg-secondary/50 p-6 transition-all hover:bg-secondary"
    >
      <div className="mb-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground">
              {appointment.customer_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {appointment.customer_phone}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
              isCompleted 
                ? "bg-primary/10 text-primary border border-primary/20" 
                : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
            }`}
          >
            {appointment.status}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ClockIcon className="h-4 w-4" />
            </div>
            <span className="font-medium">
              {dateUtils.formatFriendlyTime(appointment.appointment_date)}
            </span>
          </div>

          {appointment.staff?.name && (
            <div className="flex items-center gap-3 text-sm text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <UserIcon className="h-4 w-4" />
              </div>
              <span className="font-medium">
                {appointment.staff.name}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4">
        {!isCompleted ? (
          <label
            className={`group relative flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isUploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <CameraIcon className="h-4 w-4" />
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
              disabled={isUploading}
            />
          </label>
        ) : (
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
            <CheckIcon className="h-4 w-4" />
            Cita finalizada
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
