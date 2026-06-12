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
  location: string | null;
};

export default function DirectoryPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBarbers() {
      const { data } = await supabase
        .from("barbershops")
        .select("id, slug, full_name, avatar_url, location");

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
    <main className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeftIcon className="h-4 w-4" />
            Volver al inicio
          </Link>
          
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                Descubre <span className="text-primary">Excelencia</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Explora las mejores barberías y reserva tu cita con los mejores profesionales de la ciudad.
              </p>
            </div>

            {/* Buscador */}
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-border bg-secondary/50 px-6 py-4 pl-12 text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
            <p className="mt-6 font-medium text-muted-foreground">Localizando barberías...</p>
          </div>
        ) : filteredBarbers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-secondary/20 py-32 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground text-2xl">
              📭
            </div>
            <p className="max-w-xs text-xl font-medium text-muted-foreground">
              {searchTerm 
                ? `No hay resultados para "${searchTerm}"`
                : "Aún no hay barberías registradas en la plataforma."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBarbers.map((barber) => (
              <Link
                key={barber.id}
                href={`/${barber.slug}`}
                className="group relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-border bg-secondary/30 p-8 transition-all hover:border-primary/50 hover:bg-secondary"
              >
                {/* Decoration background hover */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                
                <div className="relative mb-6 h-28 w-28 overflow-hidden rounded-2xl border border-border bg-background shadow-inner">
                  {barber.avatar_url ? (
                    <Image
                      src={barber.avatar_url}
                      alt={barber.full_name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-muted-foreground">
                      {barber.full_name?.charAt(0) || "B"}
                    </div>
                  )}
                </div>
                
                <h2 className="mb-2 text-2xl font-bold capitalize text-foreground">
                  {barber.full_name}
                </h2>
                <p className="mb-8 text-sm text-muted-foreground">
                  {barber.location || "Ubicación no disponible"}
                </p>
                
                <div className="flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Ver Perfil
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}
