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
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
            </svg>
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
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m7.848 8.25 1.536.887M7.848 8.25a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm1.536.887a2.165 2.165 0 0 1 1.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 1 1-5.196 3 3 3 0 0 1 5.196-3Zm1.536-.887a2.165 2.165 0 0 1 1.083-1.839 8.054 8.054 0 0 0 .112-1.02M9.384 14.863l7.552-4.36M18.75 9a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm0 0a3 3 0 1 1 5.196 3 3 3 0 0 1-5.196-3Z" />
                        </svg>
                      </div>

                      {/* Nombre + duración */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{service.name}</p>
                        {service.duration_minutes && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3 shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
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
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
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

function StarFilledIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
    </svg>
  );
}

function StarOutlineIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );
}

function MapIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446 1.972-1.479a.75.75 0 0 0 .225-.565V4.26a.75.75 0 0 0-.973-.722l-4.5 1.5a.75.75 0 0 1-.504 0l-4.5-1.5a.75.75 0 0 0-.973.722v12.431c0 .228.1.445.275.594l4.225 3.169a.75.75 0 0 0 .903 0l4.225-3.169Z" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.192a4 4 0 1 0 5.304 5.304M7.848 8.192a4 4 0 1 1 5.304 5.304M7.848 8.192 10.5 10.5m2.652 2.652L18 18M10.5 10.5l-2.652 2.652M10.5 10.5l2.652-2.652M13.152 13.152 21 21" />
    </svg>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}
