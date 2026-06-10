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
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="sticky top-8 rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
              <h1 className="mb-6 text-center text-2xl font-bold capitalize text-gray-900">
                {barber?.full_name || barberSlug}
              </h1>

              <div className="text-center">
                {!user ? (
                  <>
                    <p className="mb-6 text-gray-600">
                      Inicia sesión para poder reservar tu cita en esta barbería.
                    </p>
                    <Link
                      href={`/login?next=/${barberSlug}`}
                      className="block w-full rounded-md bg-black px-4 py-3 font-medium text-white transition-colors hover:bg-gray-800"
                    >
                      Acceder para Reservar
                    </Link>
                  </>
                ) : (
                  <Link
                    href={`/${barberSlug}/reserva`}
                    className="block w-full rounded-md bg-black px-4 py-3 font-medium text-white transition-colors hover:bg-gray-800"
                  >
                    Reservar Cita
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Últimos trabajos
            </h2>
            {photos.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
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
                      alt="Corte en barbería"
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
