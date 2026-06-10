"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useBooking } from "@/hooks/useBooking";
import { useAuth } from "@/hooks/useAuth";

export default function BarberProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const barberSlug = resolvedParams.slug;

  const {
    barber,
    photos,
    loading: bookingLoading,
    notFound,
  } = useBooking(barberSlug);

  const { user } = useAuth();

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Barbería no encontrada
          </h1>
          <Link href="/" className="mt-4 block text-blue-600 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (bookingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="font-medium text-gray-500">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Portada / Background */}
      <div className="relative h-48 w-full bg-gray-300 md:h-64">
        {barber?.cover_url ? (
          <Image
            src={barber.cover_url}
            alt="Portada de la barbería"
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-gray-800 to-black" />
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4">
        {/* Cabecera de Perfil */}
        <div className="relative -mt-16 mb-8 flex flex-col items-center md:-mt-20 md:flex-row md:items-end md:gap-6">
          <div className="relative h-32 w-32 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md md:h-40 md:w-40">
            {barber?.avatar_url ? (
              <Image
                src={barber.avatar_url}
                alt={barber.full_name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-4xl font-bold text-gray-400">
                {barber?.full_name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="mt-4 text-center md:mb-2 md:mt-0 md:text-left">
            <h1 className="text-3xl font-extrabold text-gray-900 md:text-4xl">
              {barber?.full_name}
            </h1>
            <p className="text-gray-600 font-medium">
              💈 {barber?.num_barbers} {barber?.num_barbers === 1 ? 'barbero disponible' : 'barberos disponibles'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Columna Principal: Servicios y Portfolio */}
          <div className="lg:col-span-8">
            {/* Servicios */}
            <section className="mb-12">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Servicios y Tarifas
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {barber?.services && barber.services.length > 0 ? (
                  barber.services.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      <span className="font-semibold text-gray-800">
                        {service.name}
                      </span>
                      <span className="rounded-lg bg-gray-50 px-3 py-1 font-bold text-black">
                        {service.price}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No hay servicios listados.</p>
                )}
              </div>
            </section>

            {/* Portfolio */}
            <section className="mb-12">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Nuestro Trabajo (Portfolio)
              </h2>
              {photos.length === 0 ? (
                <div className="rounded-xl border border-gray-100 bg-white p-12 text-center text-gray-500 shadow-sm">
                  Aún no hay fotos en la galería.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square overflow-hidden rounded-xl border border-gray-100 bg-gray-200 shadow-sm"
                    >
                      <Image
                        src={photo.image_url}
                        alt="Trabajo de barbería"
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Columna Lateral: Reserva */}
          <div className="lg:col-span-4">
            <div className="sticky top-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                Reserva tu cita
              </h3>
              <p className="mb-6 text-sm text-gray-600">
                Asegura tu hueco con nosotros de forma rápida y sencilla.
              </p>
              
              {!user ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    Inicia sesión para poder realizar una reserva.
                  </p>
                  <Link
                    href={`/login?next=/${barberSlug}`}
                    className="block w-full rounded-xl bg-black px-4 py-4 text-center font-bold text-white transition-all hover:bg-gray-800 hover:shadow-lg active:scale-95"
                  >
                    Acceder ahora
                  </Link>
                </div>
              ) : (
                <Link
                  href={`/${barberSlug}/reserva`}
                  className="block w-full rounded-xl bg-black px-4 py-4 text-center font-bold text-white transition-all hover:bg-gray-800 hover:shadow-lg active:scale-95"
                >
                  Continuar a la reserva
                </Link>
              )}

              <div className="mt-6 border-t border-gray-50 pt-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600">
                    ✓
                  </span>
                  Confirmación inmediata
                </div>
                <div className="mt-3 flex items-center gap-3 text-sm text-gray-600">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    📅
                  </span>
                  Elige tu horario favorito
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
