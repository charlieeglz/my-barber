/**
 * Utilidades para el manejo de fechas y horarios en la barbería.
 */
import type { WorkingHours } from "@/lib/services/barber.service";

export const WORKING_HOURS = [
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
];

/**
 * Genera slots de 30 minutos entre dos horas (start inclusivo, end exclusivo).
 * Ejemplo: generateTimeSlots("10:00", "14:00") => ["10:00", "10:30", "11:00", ...]
 */
function generateTimeSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let current = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  while (current < endMinutes) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    current += 30;
  }
  return slots;
}

export const dateUtils = {
  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD local.
   */
  getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  /**
   * Formatea una fecha ISO a una cadena legible de fecha (ej: "lunes, 10 de junio").
   */
  formatFriendlyDate(isoDate: string) {
    const [datePart] = isoDate.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC"
    });
  },

  /**
   * Formatea una fecha ISO a hora (ej: "10:30").
   */
  formatFriendlyTime(isoDate: string) {
    const timePart = isoDate.split("T")[1];
    if (!timePart) return "";
    return timePart.substring(0, 5); // Retorna "HH:mm" directamente
  },

  /**
   * Genera los slots de tiempo disponibles para una fecha específica.
   * Si se pasa workingHours, usa las horas configuradas por el barbero.
   * Si no, cae en el horario por defecto (WORKING_HOURS).
   */
  getAvailableSlots(date: string, bookedTimes: string[], workingHours?: WorkingHours | null) {
    if (!date) return [];
    const today = this.getTodayString();

    // Si la fecha seleccionada es en el pasado, no hay disponibilidad
    if (date < today) return [];

    let slots: string[];

    if (workingHours) {
      // Comprobar si el día de la semana está dentro de los días laborables
      const [year, month, day] = date.split("-").map(Number);
      const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getDay();
      if (!workingHours.days.includes(dayOfWeek)) return [];

      slots = [
        ...generateTimeSlots(workingHours.morning_start, workingHours.morning_end),
        ...generateTimeSlots(workingHours.afternoon_start, workingHours.afternoon_end),
      ];
    } else {
      slots = [...WORKING_HOURS];
    }

    const isToday = date === today;

    return slots.filter((time) => {
      if (bookedTimes.includes(time)) return false;

      if (isToday) {
        const [hour, minute] = time.split(":").map(Number);
        const now = new Date();
        if (hour < now.getHours()) return false;
        if (hour === now.getHours() && minute <= now.getMinutes()) return false;
      }

      return true;
    });
  },

  /**
   * Combina una fecha (YYYY-MM-DD) y una hora (HH:mm) en un string ISO.
   */
  combineDateAndTime(date: string, time: string) {
    return `${date}T${time}:00.000Z`;
  },

  /**
   * Lógica para el calendario del dashboard.
   */
  getCalendarData(currentMonth: Date) {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Ajuste para que la semana empiece en Lunes (0: L, 1: M, ..., 6: D)
    const firstDayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    return {
      year,
      month,
      daysInMonth,
      firstDayOffset,
      daysArray: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      blanksArray: Array.from({ length: firstDayOffset }, (_, i) => i),
    };
  },

  /**
   * Formatea un precio numérico (en euros) a string con símbolo de moneda.
   * Ej: 20 => "20 €", 15.5 => "15,50 €"
   */
  formatPrice(price: number | string): string {
    const num = typeof price === "string" ? parseFloat(price.replace(",", ".")) : price;
    if (isNaN(num)) return "—";
    return num.toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  },

  /**
   * Traduce el estado de una cita al español.
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: "Pendiente",
      completed: "Finalizada",
      cancelled: "Cancelada",
    };
    return labels[status] ?? status;
  },
};
