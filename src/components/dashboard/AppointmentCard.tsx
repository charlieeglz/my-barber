"use client";

import { Appointment } from "@/lib/services/appointment.service";
import { dateUtils } from "@/lib/utils/date-utils";

interface AppointmentCardProps {
  appointment: Appointment;
  onPhotoUpload: (file: File, appointment: Appointment) => void;
  isUploading: boolean;
}

export function AppointmentCard({ appointment, onPhotoUpload, isUploading }: AppointmentCardProps) {
  return (
    <div
      className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <div className="mb-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {appointment.customer_name}
          </h3>
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${appointment.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
          >
            {appointment.status}
          </span>
        </div>
        <p className="mb-1 text-sm text-gray-600">
          📞 {appointment.customer_phone}
        </p>
        <p className="text-sm text-gray-600">
          🕒{" "}
          {dateUtils.formatFriendlyTime(appointment.appointment_date)}
        </p>
      </div>

      <div className="mt-auto border-t border-gray-50 pt-4">
        {appointment.status !== "completed" ? (
          <label
            className={`block w-full cursor-pointer rounded-md bg-black px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-gray-800 ${isUploading ? "pointer-events-none opacity-50" : ""}`}
          >
            {isUploading ? "Subiendo..." : "📷 Subir Foto"}
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
          <div className="w-full rounded-md bg-gray-50 px-4 py-2 text-center text-sm font-medium text-gray-500">
            Cita finalizada
          </div>
        )}
      </div>
    </div>
  );
}
