"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useBooking } from "@/hooks/useBooking";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import { dateUtils } from "@/lib/utils/date-utils";
import { reviewService, Review } from "@/lib/services/review.service";
import {
  SadFaceIcon,
  ScissorsIcon,
  ClockIcon,
  CameraIcon,
  StarFilledIcon,
  StarOutlineIcon,
  MapIcon,
  ArrowLeftIcon,
  LocationIcon,
  CheckIcon,
  CalendarIcon,
} from "@/components/Icons";

export default function BarberProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const barberSlug = resolvedParams.slug;
  const router = useRouter();

  const {
    barber,
    photos,
    loading: bookingLoading,
    notFound,
  } = useBooking(barberSlug);

  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (barber?.id) {
      reviewService
        .getByBarbershop(barber.id)
        .then(setReviews)
        .catch(console.error);
    }
  }, [barber?.id]);

  const reviewStats = reviewService.calcStats(reviews);

  const handleReserveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
    } else {
      router.push(`/${barberSlug}/reserva`);
    }
  };

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <SadFaceIcon className="h-8 w-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Barbería no encontrada</h1>
          <p className="mb-8 text-muted-foreground">Lo sentimos, el perfil que buscas no existe o ha sido movido.</p>
          <Link href="/explorar" className="inline-flex items-center rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition-all hover:scale-[1.02]">
            Explorar otras barberías
          </Link>
        </div>
      </div>
    );
  }

  if (bookingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Portada / Background */}
      <div className="relative h-64 w-full md:h-80 lg:h-96">
        {barber?.cover_url ? (
          <Image
            src={barber.cover_url}
            alt="Portada de la barbería"
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-secondary to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Back button */}
        <Link href="/explorar" className="absolute left-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-background/50 text-foreground backdrop-blur-md transition-all hover:bg-background">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
      </div>

      <div className="mx-auto max-w-6xl px-6">
        {/* Cabecera de Perfil */}
        <div className="relative -mt-24 mb-12 flex flex-col items-center md:-mt-32 md:flex-row md:items-end md:gap-8">
          <div className="relative h-40 w-40 overflow-hidden rounded-3xl border-4 border-background bg-secondary shadow-2xl md:h-48 md:w-48">
            {barber?.avatar_url ? (
              <Image
                src={barber.avatar_url}
                alt={barber.full_name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-muted-foreground">
                {barber?.full_name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-1 flex-col items-center text-center md:mb-4 md:mt-0 md:items-start md:text-left">
            <h1 className="mb-2 text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {barber?.full_name}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground md:justify-start">
              <span className="flex items-center gap-1.5 font-medium">
                <ScissorsIcon className="h-4 w-4 text-primary" />
                {barber?.num_barbers} {barber?.num_barbers === 1 ? 'especialista' : 'especialistas'}
              </span>
              {barber?.location && (
                <span className="flex items-center gap-1.5 font-medium">
                  <LocationIcon className="h-4 w-4 text-primary" />
                  {barber.location}
                </span>
              )}
              {reviewStats.total > 0 && (
                <span className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-bold text-primary">
                  <StarFilledIcon className="h-4 w-4" />
                  {reviewStats.average}
                  <span className="font-normal text-muted-foreground">({reviewStats.total})</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Columna Principal: Servicios y Portfolio */}
          <div className="lg:col-span-8">
            {/* Servicios */}
            <section className="mb-12">
              <div className="mb-5 flex items-center gap-4">
                <h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">Servicios y Tarifas</h2>
                <div className="h-px flex-1 bg-border" />
              </div>

              {barber?.services && barber.services.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {barber.services.map((service, index) => (
                    <div
                      key={index}
                      className="flex w-full items-center rounded-xl border border-border bg-secondary/30 px-4 py-3 transition-all hover:bg-secondary"
                    >
                      {/* Icono decorativo */}
                      <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <ScissorsIcon className="h-3.5 w-3.5" />
                      </div>

                      {/* Nombre + duración */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{service.name}</p>
                        {service.duration_minutes && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <ClockIcon className="h-3 w-3 shrink-0" />
                            {service.duration_minutes < 60
                              ? `${service.duration_minutes} min`
                              : service.duration_minutes % 60 === 0
                                ? `${Math.floor(service.duration_minutes / 60)}h`
                                : `${Math.floor(service.duration_minutes / 60)}h ${service.duration_minutes % 60}min`
                            }
                          </p>
                        )}
                      </div>

                      {/* Precio — siempre a la derecha, nunca se oculta */}
                      <span className="ml-3 shrink-0 rounded-lg bg-primary/10 px-3 py-1 text-sm font-black text-primary">
                        {dateUtils.formatPrice(service.price)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-border bg-secondary/20 py-10 text-center text-sm text-muted-foreground italic">
                  No hay servicios listados actualmente.
                </p>
              )}
            </section>

            {/* Portfolio */}
            <section className="mb-12">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight text-foreground">Portfolio</h2>
                <div className="h-px flex-1 bg-border mx-6 hidden sm:block" />
              </div>
              {photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-secondary/10 p-16 text-center text-muted-foreground">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <CameraIcon className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Aún no hay trabajos en la galería.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-secondary shadow-lg"
                    >
                      <Image
                        src={photo.image_url}
                        alt="Trabajo de barbería"
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Reseñas */}
            <section>
              <div className="mb-6 flex items-center gap-4">
                <h2 className="text-2xl font-black tracking-tight text-foreground">Reseñas</h2>
                {reviewStats.total > 0 && (
                  <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1">
                    <StarFilledIcon className="h-4 w-4 text-primary" />
                    <span className="font-black text-primary">{reviewStats.average}</span>
                    <span className="text-xs text-muted-foreground">({reviewStats.total} reseñas)</span>
                  </div>
                )}
                <div className="h-px flex-1 bg-border" />
              </div>

              {reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-secondary/10 py-12 text-center text-muted-foreground">
                  <StarOutlineIcon className="mb-3 h-10 w-10 opacity-30" />
                  <p className="font-medium">Aún no hay reseñas para esta barbería.</p>
                  <p className="mt-1 text-sm">¡Sé el primero en compartir tu experiencia!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="relative overflow-hidden rounded-2xl border border-border bg-secondary/30 p-6 transition-all hover:bg-secondary"
                    >
                      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-primary/5 blur-2xl" />
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarFilledIcon
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating ? "text-primary" : "text-border"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mb-3 text-sm leading-relaxed text-foreground">
                          &ldquo;{review.comment}&rdquo;
                        </p>
                      )}
                      {review.staff?.name && (
                        <p className="text-xs font-bold text-muted-foreground">
                          Con <span className="text-primary">{review.staff.name}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Columna Lateral: Reserva */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-8 space-y-8">
              {/* Card Reserva */}
              <div className="overflow-hidden rounded-3xl border border-border bg-secondary/50 p-8 shadow-2xl backdrop-blur-md">
                <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
                <h3 className="mb-2 text-2xl font-black text-foreground">Reserva</h3>
                <p className="mb-8 text-muted-foreground leading-relaxed">
                  Asegura tu lugar con nosotros. Confirmación en tiempo real y recordatorios automáticos.
                </p>
                
                <button
                  onClick={handleReserveClick}
                  className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-5 text-lg font-black text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Reservar Cita</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>

                <div className="mt-10 space-y-4 border-t border-border pt-8">
                  <div className="flex items-center gap-4 text-sm text-foreground">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CheckIcon className="h-5 w-5" />
                    </div>
                    <span className="font-semibold">Confirmación inmediata</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-foreground">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CalendarIcon className="h-5 w-5" />
                    </div>
                    <span className="font-semibold">Elige tu horario favorito</span>
                  </div>
                </div>
              </div>

              {/* Mapa y Ubicación */}
              {barber?.location && (
                <div className="overflow-hidden rounded-3xl border border-border bg-secondary/30 p-6 shadow-2xl backdrop-blur-md">
                  <h3 className="mb-4 text-lg font-black text-foreground">Ubicación</h3>
                  <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0, filter: "grayscale(1) invert(0.9) contrast(1.2)" }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(barber.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                    ></iframe>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {barber.location}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barber.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-sm font-bold text-foreground transition-all hover:border-primary/50 hover:bg-secondary"
                  >
                    <MapIcon className="h-4 w-4 text-primary" />
                    Ver en Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => router.push(`/${barberSlug}/reserva`)}
      />
    </main>
  );
}

