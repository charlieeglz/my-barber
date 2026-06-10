import { useState, useEffect } from "react";
import { barberService, BarberProfile } from "../lib/services/barber.service";
import { appointmentService } from "../lib/services/appointment.service";
import { dateUtils } from "../lib/utils/date-utils";

export function useBooking(barberSlug: string) {
  const [barber, setBarber] = useState<BarberProfile | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadBarber() {
      try {
        const data = await barberService.getBySlug(barberSlug);
        setBarber(data);
        
        const photosData = await barberService.getPortfolioPhotos(data.id);
        setPhotos(photosData || []);
      } catch (error) {
        console.error("Error loading barber:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadBarber();
  }, [barberSlug]);

  useEffect(() => {
    async function loadBookedTimes() {
      if (!selectedDate || !barber) {
        setBookedTimes([]);
        return;
      }
      try {
        const times = await appointmentService.getBookedTimes(barber.id, selectedDate);
        setBookedTimes(times);
      } catch (error) {
        console.error("Error loading booked times:", error);
      }
    }
    loadBookedTimes();
  }, [selectedDate, barber]);

  const handleCreateBooking = async (
    userId: string,
    customerName: string,
    customerPhone: string
  ) => {
    if (!barber || !userId || !selectedDate || !selectedTime) {
      setMessage("Faltan datos para la reserva.");
      return false;
    }

    setBookingLoading(true);
    setMessage("");

    try {
      const appointmentDate = dateUtils.combineDateAndTime(selectedDate, selectedTime);
      
      await appointmentService.create({
        barber_id: barber.id,
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
    photos,
    loading,
    notFound,
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
