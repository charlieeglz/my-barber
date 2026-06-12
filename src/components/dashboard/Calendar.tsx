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
    <div className="mb-8 overflow-hidden rounded-3xl border border-border bg-secondary/30 p-8 shadow-2xl backdrop-blur-sm">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-black capitalize text-foreground">
          {monthNames[month]} <span className="text-primary">{year}</span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/50 text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/50 text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-7 gap-2 text-center">
        {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
          <div key={day} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {blanksArray.map((blank) => (
          <div key={`blank-${blank}`} className="aspect-square"></div>
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
              className={`relative flex aspect-square w-full flex-col items-center justify-center rounded-xl text-sm font-bold transition-all
                ${isSelected 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                  : "text-foreground hover:bg-muted hover:scale-105"}
                ${isToday && !isSelected ? "border-2 border-primary/30 text-primary" : ""}
              `}
            >
              <span>{day}</span>
              {hasApt && (
                <span
                  className={`absolute bottom-2 h-1 w-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`}
                ></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
