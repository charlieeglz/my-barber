/**
 * Utilidades para el manejo de fechas y horarios en la barbería.
 */
import type { WorkingHours } from "@/lib/services/barber.service";

/**
 * Horario por defecto (fallback) cuando el barbero no tiene horario configurado.
 * Cubre de 09:00 a 21:00 en franjas de 30 min.
 * Se utiliza SOLO como último recurso; el horario real del barbero siempre tiene prioridad.
 */
export const WORKING_HOURS = [
  "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30",
];

/**
 * Genera slots de 30 minutos entre dos horas (start inclusivo, end exclusivo).
 * Ejemplo: generateTimeSlots("10:00", "14:00") => ["10:00", "10:30", "11:00", ...]
 */
function generateTimeSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  if (!start || !end) return slots;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let current = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  while (current <= endMinutes) {
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
    const date = new Date(isoDate);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  },

  /**
   * Formatea una fecha ISO a hora (ej: "10:30").
   */
  formatFriendlyTime(isoDate: string) {
    const d = new Date(isoDate);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  },

  /**
   * Genera los slots de tiempo disponibles para una fecha específica.
   * Si se pasa workingHours, usa las horas configuradas por el barbero.
   * Si no, cae en el horario por defecto (WORKING_HOURS).
   */
  getAvailableSlots(date: string, bookedTimes: string[], workingHours?: WorkingHours | null, durationMinutes: number = 30) {
    if (!date) return [];
    const today = this.getTodayString();

    if (date < today) return [];

    let slots: string[];

    if (workingHours) {
      // Verificar si la fecha cae en un periodo de vacaciones
      if (workingHours.vacations && Array.isArray(workingHours.vacations)) {
        const isVacation = workingHours.vacations.some((v) => {
          return date >= v.start_date && date <= v.end_date;
        });
        if (isVacation) return [];
      }

      const [year, month, day] = date.split("-").map(Number);
      const dayOfWeek = new Date(year, month - 1, day).getDay();
      if (!workingHours.days.includes(dayOfWeek)) return [];


      slots = [
        ...generateTimeSlots(workingHours.morning_start, workingHours.morning_end),
        ...generateTimeSlots(workingHours.afternoon_start, workingHours.afternoon_end),
      ];
    } else {
      slots = [...WORKING_HOURS];
    }

    const isToday = date === today;
    const slotsNeeded = Math.max(1, Math.ceil(durationMinutes / 30));

    // Construir un Set de minutos válidos para verificar consecutividad real
    const slotMinutesSet = new Set(
      slots.map((t) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      })
    );

    return slots.filter((time, index) => {
      // Filtrar horas pasadas si es hoy
      if (isToday) {
        const [hour, minute] = time.split(":").map(Number);
        const now = new Date();
        if (hour < now.getHours()) return false;
        if (hour === now.getHours() && minute <= now.getMinutes()) return false;
      }

      // Verificar que todos los slots consecutivos necesarios:
      // 1. Existen en el horario del barbero (no cruzan un descanso)
      // 2. No están ocupados
      const [sh, sm] = time.split(":").map(Number);
      const startMin = sh * 60 + sm;

      for (let i = 0; i < slotsNeeded; i++) {
        const checkMin = startMin + i * 30;
        const checkTime = `${String(Math.floor(checkMin / 60)).padStart(2, "0")}:${String(checkMin % 60).padStart(2, "0")}`;

        // El slot requerido está ocupado
        if (bookedTimes.includes(checkTime)) return false;

        // Solo exigimos que el slot de INICIO esté dentro del horario laboral.
        // Los slots de continuación por duración del servicio pueden terminar después de la hora de cierre.
        if (i === 0) {
          if (!slotMinutesSet.has(checkMin)) return false;
        } else {
          // Si el barbero tiene descansos, evitamos que un turno de la mañana invada la tarde cruzando el descanso
          if (workingHours) {
            const parseMin = (t?: string | null) => {
              if (!t) return 0;
              const [h, m] = t.split(":").map(Number);
              return h * 60 + m;
            };
            const morningEndMin = parseMin(workingHours.morning_end);
            const afternoonStartMin = parseMin(workingHours.afternoon_start);
            // Si empezó en el turno de mañana, no puede invadir el descanso
            if (startMin < morningEndMin && checkMin >= morningEndMin && checkMin < afternoonStartMin) {
              return false;
            }
          }
        }
      }

      return true;
    });
  },

  /**
   * Combina una fecha (YYYY-MM-DD) y una hora (HH:mm) en un string ISO.
   */
  combineDateAndTime(date: string, time: string) {
    const offsetMinutes = new Date().getTimezoneOffset();
    const offsetSign = offsetMinutes > 0 ? "-" : "+";
    const absOffsetMinutes = Math.abs(offsetMinutes);
    const offsetHours = String(Math.floor(absOffsetMinutes / 60)).padStart(2, "0");
    const offsetMins = String(absOffsetMinutes % 60).padStart(2, "0");
    const offsetString = `${offsetSign}${offsetHours}:${offsetMins}`;
    return `${date}T${time}:00${offsetString}`;
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
