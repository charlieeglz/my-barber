import { useState, useEffect } from "react";
import { barberService, Barbershop, StaffMember, PortfolioPhoto } from "../lib/services/barber.service";
import { appointmentService } from "../lib/services/appointment.service";
import { dateUtils } from "../lib/utils/date-utils";

export function useBooking(barberSlug: string) {
  const [barber, setBarber] = useState<Barbershop | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Estados de la reserva
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 1. Cargar información de la barbería y su equipo
  useEffect(() => {
    async function loadBarberData() {
      try {
        const barbershop = await barberService.getBySlug(barberSlug);
        setBarber(barbershop);
        
        const [staffData, photosData] = await Promise.all([
          barberService.getStaffByBarbershop(barbershop.id),
          barberService.getPortfolioPhotos(barbershop.id)
        ]);

        setStaff(staffData);
        setPhotos(photosData || []);
        
        // Seleccionar automáticamente al primer barbero por defecto
        if (staffData.length > 0) {
          setSelectedStaff(staffData[0]);
        }
      } catch (error) {
        console.error("Error loading barber data:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadBarberData();
  }, [barberSlug]);

  // 2. Cargar horarios ocupados cuando cambie el barbero o la fecha
  useEffect(() => {
    async function loadBookedTimes() {
      if (!selectedDate || !selectedStaff) {
        setBookedTimes([]);
        return;
      }
      try {
        const times = await appointmentService.getBookedTimes(selectedStaff.id, selectedDate);
        setBookedTimes(times);
      } catch (error) {
        console.error("Error loading booked times:", error);
      }
    }
    loadBookedTimes();
  }, [selectedDate, selectedStaff]);

  const handleCreateBooking = async (
    userId: string,
    customerName: string,
    customerPhone: string
  ) => {
    if (!barber || !selectedStaff || !userId || !selectedDate || !selectedTime) {
      setMessage("Faltan datos para la reserva.");
      return false;
    }

    setBookingLoading(true);
    setMessage("");

    try {
      const appointmentDate = dateUtils.combineDateAndTime(selectedDate, selectedTime);
      
      await appointmentService.create({
        barber_id: barber.id,
        staff_id: selectedStaff.id,
        client_id: userId,
        customer_name: customerName,
        customer_phone: customerPhone,
        appointment_date: appointmentDate,
        status: "pending",
      });

      setMessage("¡Reserva creada correctamente!");
      setBookedTimes((prev) => [...prev, selectedTime]);
      setSelectedTime("");
      return true;
    } catch (error: any) {
      setMessage("Error al crear la reserva: " + error.message);
      return false;
    } finally {
      setBookingLoading(false);
    }
  };

  const availableSlots = selectedDate 
    ? dateUtils.getAvailableSlots(selectedDate, bookedTimes)
    : [];

  return {
    barber,
    staff,
    photos,
    loading,
    notFound,
    selectedStaff,
    setSelectedStaff,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    availableSlots,
    bookingLoading,
    message,
    handleCreateBooking,
  };
}
