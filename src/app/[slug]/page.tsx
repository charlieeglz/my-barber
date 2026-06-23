"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useBooking } from "@/hooks/useBooking";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";

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
          <div className="mb-6 text-6xl">💈</div>
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
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Columna Principal: Servicios y Portfolio */}
          <div className="lg:col-span-8">
            {/* Servicios */}
            <section className="mb-16">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight text-foreground">Servicios</h2>
                <div className="h-px flex-1 bg-border mx-6 hidden sm:block" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {barber?.services && barber.services.length > 0 ? (
                  barber.services.map((service, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between rounded-2xl border border-border bg-secondary/30 p-5 transition-all hover:bg-secondary"
                    >
                      <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {service.name}
                      </span>
                      <span className="rounded-xl bg-primary/10 px-4 py-1.5 font-black text-primary border border-primary/10">
                        {service.price}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full text-center py-12 text-muted-foreground italic bg-secondary/20 rounded-3xl border border-dashed border-border">
                    No hay servicios listados actualmente.
                  </p>
                )}
              </div>
            </section>

            {/* Portfolio */}
            <section>
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight text-foreground">Portfolio</h2>
                <div className="h-px flex-1 bg-border mx-6 hidden sm:block" />
              </div>
              {photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-secondary/10 p-16 text-center text-muted-foreground">
                  <div className="mb-4 text-4xl">📸</div>
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
