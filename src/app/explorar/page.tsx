"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

type Barber = {
  id: string;
  slug: string;
  full_name: string;
  avatar_url: string | null;
};

export default function DirectoryPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBarbers() {
      const { data } = await supabase
        .from("barbers")
        .select("id, slug, full_name, avatar_url");

      if (data) {
        setBarbers(data);
      }
      setLoading(false);
    }
    loadBarbers();
  }, []);

  const filteredBarbers = barbers.filter((barber) => {
    const name = barber.full_name?.toLowerCase() || "";
    const slug = barber.slug?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return name.includes(search) || slug.includes(search);
  });

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <Link href="/" className="mb-4 inline-block text-sm font-medium text-gray-500 hover:text-black">
            ← Volver al inicio
          </Link>
          <h1 className="mb-4 text-3xl font-extrabold text-gray-900 md:text-5xl">
            Encuentra tu estilo
          </h1>
          <p className="mb-8 text-lg text-gray-600">
            Explora las mejores barberías y reserva tu cita en segundos.
          </p>

          {/* Buscador */}
          <div className="relative mx-auto max-w-xl">
            <input
              type="text"
              placeholder="Buscar por nombre o ciudad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-6 py-4 text-lg shadow-sm transition-all focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl grayscale opacity-50">
              🔍
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
            <p className="mt-4 font-medium text-gray-500">Buscando barberías...</p>
          </div>
        ) : filteredBarbers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-20 text-center shadow-sm">
            <p className="text-xl font-medium text-gray-400">
              {searchTerm 
                ? `No hemos encontrado ninguna barbería que coincida con "${searchTerm}"`
                : "Aún no hay barberías registradas en la plataforma."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBarbers.map((barber) => (
              <Link
                key={barber.id}
                href={`/${barber.slug}`}
                className="group flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-black hover:shadow-xl"
              >
                <div className="relative mb-6 h-24 w-24 overflow-hidden rounded-2xl bg-gray-100 shadow-inner group-hover:shadow-md">
                  {barber.avatar_url ? (
                    <Image
                      src={barber.avatar_url}
                      alt={barber.full_name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-300">
                      {barber.full_name?.charAt(0) || "B"}
                    </div>
                  )}
                </div>
                
                <h2 className="text-xl font-bold capitalize text-gray-900 group-hover:text-black">
                  {barber.full_name}
                </h2>
                
                <div className="mt-6 rounded-xl bg-gray-50 px-5 py-2 text-sm font-bold text-gray-600 transition-colors group-hover:bg-black group-hover:text-white">
                  Ver perfil
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
