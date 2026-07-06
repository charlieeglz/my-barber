"use client";

import { useState } from "react";
import { dateUtils } from "@/lib/utils/date-utils";
import { Appointment } from "@/lib/services/appointment.service";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/Icons";

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
    return appointments.some((apt) => {
      const d = new Date(apt.appointment_date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dy = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dy}` === dateStr;
    });
  };

  const countAppointmentsOnDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return appointments.filter((apt) => {
      const d = new Date(apt.appointment_date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dy = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dy}` === dateStr;
    }).length;
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onDateSelect(dateStr);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-secondary/30 shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6">
        <h2 className="text-lg font-black capitalize text-foreground sm:text-2xl">
          {monthNames[month]} <span className="text-primary">{year}</span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background/50 text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background/50 text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-3 pb-5 sm:px-6 sm:pb-8">
        {/* Day labels */}
        <div className="mb-2 grid grid-cols-7 text-center">
          {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
            <div key={day} className="py-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 sm:text-[10px]">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {blanksArray.map((blank) => (
            <div key={`blank-${blank}`} className="aspect-square" />
          ))}
          {daysArray.map((day) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isSelected = selectedDate === dateStr;
            const hasApt = hasAppointmentsOnDate(day);
            const count = countAppointmentsOnDate(day);
            const isToday = dateUtils.getTodayString() === dateStr;

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`relative flex aspect-square w-full flex-col items-center justify-center rounded-xl text-xs font-bold transition-all active:scale-95 sm:text-sm
                  ${isSelected
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                    : "text-foreground hover:bg-muted hover:scale-105"}
                  ${isToday && !isSelected ? "ring-2 ring-primary/40 text-primary" : ""}
                `}
              >
                <span className="leading-none">{day}</span>

                {/* Indicador de citas — barra pequeña bajo el número */}
                {hasApt && (
                  <span
                    className={`mt-0.5 block h-[3px] rounded-full transition-all
                      ${isSelected ? "bg-primary-foreground/70 w-4" : "bg-primary w-3"}
                      ${count >= 3 ? "sm:w-5 w-4" : ""}
                    `}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-3 border-t border-border/50 pt-4">
          <div className="flex items-center gap-1.5">
            <span className="h-[3px] w-4 rounded-full bg-primary" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">Con citas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-md ring-2 ring-primary/40" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">Hoy</span>
          </div>
        </div>
      </div>
    </div>
  );
}

