/**
 * Utilidades para el manejo de fechas y horarios en la barbería.
 */

export const WORKING_HOURS = [
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
];

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
   * Genera los slots de tiempo disponibles para una fecha específica,
   * filtrando las horas pasadas si la fecha es hoy y excluyendo las ya reservadas.
   */
  getAvailableSlots(date: string, bookedTimes: string[]) {
    const today = this.getTodayString();
    const isToday = date === today;

    return WORKING_HOURS.filter((time) => {
      // 1. Excluir si ya está reservado
      if (bookedTimes.includes(time)) return false;

      // 2. Si es hoy, excluir horas que ya pasaron
      if (isToday) {
        const [hour, minute] = time.split(":").map(Number);
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        if (hour < currentHour) return false;
        if (hour === currentHour && minute <= currentMinute) return false;
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
  }
};
