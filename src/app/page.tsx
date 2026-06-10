"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";

type Barber = {
  id: string;
  slug: string;
  full_name: string;
};

export default function DirectoryPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBarbers() {
      const { data } = await supabase
        .from("barbers")
        .select("id, slug, full_name");

      if (data) {
        setBarbers(data);
      }
      setLoading(false);
    }
    loadBarbers();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
          Encuentra tu estilo
        </h1>
        <p className="mb-12 text-lg text-gray-600">
          Explora las mejores barberías de tu zona y reserva tu cita en
          segundos.
        </p>

        {loading ? (
          <p className="font-medium text-gray-500">Cargando directorio...</p>
        ) : barbers.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
            <p className="text-gray-500">
              Aún no hay barberías registradas en la plataforma.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {barbers.map((barber) => (
              <Link
                key={barber.id}
                href={`/${barber.slug}`}
                className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-black hover:shadow-md"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                  ✂️
                </div>
                <h2 className="text-xl font-bold capitalize text-gray-900">
                  {barber.full_name || barber.slug.replace("-", " ")}
                </h2>
                <span className="mt-4 rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
                  Ver perfil
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
