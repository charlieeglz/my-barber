"use client";

import { useState } from "react";
import { dateUtils } from "@/lib/utils/date-utils";
import { Appointment } from "@/lib/services/appointment.service";

interface CalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  appointments: Appointment[];
}

export function Calendar({ selectedDate, onDateSelect, appointments }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const { 
    year, 
    month, 
    daysArray, 
    blanksArray 
  } = dateUtils.getCalendarData(currentMonth);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const hasAppointmentsOnDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return appointments.some((apt) => apt.appointment_date.startsWith(dateStr));
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onDateSelect(dateStr);
  };

  return (
    <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="rounded-full p-2 font-bold text-gray-600 hover:bg-gray-100"
        >
          &lt;
        </button>
        <h2 className="text-lg font-bold capitalize text-gray-800">
          {monthNames[month]} {year}
        </h2>
        <button
          onClick={handleNextMonth}
          className="rounded-full p-2 font-bold text-gray-600 hover:bg-gray-100"
        >
          &gt;
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center">
        {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
          <div key={day} className="text-xs font-bold text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {blanksArray.map((blank) => (
          <div key={`blank-${blank}`} className="p-2"></div>
        ))}
        {daysArray.map((day) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSelected = selectedDate === dateStr;
          const hasApt = hasAppointmentsOnDate(day);
          const isToday = dateUtils.getTodayString() === dateStr;

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`relative flex h-10 w-full items-center justify-center rounded-lg text-sm transition-all
                ${isSelected ? "bg-black font-bold text-white" : "text-gray-700 hover:bg-gray-100"}
                ${isToday && !isSelected ? "border border-black" : ""}
              `}
            >
              {day}
              {hasApt && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-black"}`}
                ></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
