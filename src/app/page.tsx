"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { SearchIcon, ScissorsIcon } from "@/components/Icons";

export default function WelcomePage() {
  const { user, profile, signOut, loading } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      {/* Top Navigation */}
      <nav className="absolute right-6 top-6 flex items-center gap-4">
        {!loading && user ? (
          <>
            <span className="hidden text-sm font-medium text-muted-foreground md:inline">
              Hola, <span className="text-foreground">{profile?.full_name || user.email}</span>
            </span>
            <button
              onClick={signOut}
              className="rounded-xl border border-border bg-secondary/50 px-4 py-2 text-xs font-bold text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
            >
              Cerrar Sesión
            </button>
          </>
        ) : !loading && (
          <Link
            href="/login"
            className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            Iniciar Sesión
          </Link>
        )}
      </nav>

      <div className="relative w-full max-w-5xl text-center">
        <div className="absolute -top-24 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
        
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-foreground md:text-7xl">
          Be<span className="text-primary">Style</span>
        </h1>
        
        <p className="mx-auto mb-16 max-w-2xl text-lg text-muted-foreground md:text-xl">
          La excelencia en el cuidado personal, a un clic de distancia. 
          Gestiona citas, descubre talentos y redefine tu estilo.
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Opción 1: Cliente */}
          <Link
            href="/explorar"
            className="group relative flex flex-col items-start rounded-2xl border border-border bg-secondary/50 p-8 text-left transition-all hover:border-primary/50 hover:bg-secondary"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <SearchIcon className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Explorar Barberías</h2>
            <p className="mb-6 text-muted-foreground">
              Encuentra los mejores barberos de tu zona, revisa su portfolio y reserva al instante.
            </p>
            <div className="mt-auto flex items-center font-semibold text-primary group-hover:gap-2 transition-all">
              Comenzar búsqueda <span>→</span>
            </div>
          </Link>

          {/* Opción 2: Barbero */}
          <Link
            href={user && profile?.role === "barber" ? "/dashboard" : "/login"}
            className="group relative flex flex-col items-start rounded-2xl border border-border bg-secondary/50 p-8 text-left transition-all hover:border-primary/50 hover:bg-secondary"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <ScissorsIcon className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Portal para Profesionales</h2>
            <p className="mb-6 text-muted-foreground">
              Digitaliza tu barbería. Gestiona tu agenda, clientes y pagos en una sola plataforma.
            </p>
            <div className="mt-auto flex items-center font-semibold text-primary group-hover:gap-2 transition-all">
              Acceder al panel <span>→</span>
            </div>
          </Link>
        </div>

        {/* Minimalist Footer */}
        <footer className="mt-24 flex flex-col items-center gap-4 border-t border-border pt-8 text-sm text-muted-foreground">
          <div className="flex gap-6">
            <Link href="#" className="hover:text-primary">Términos</Link>
            <Link href="#" className="hover:text-primary">Privacidad</Link>
            <Link href="#" className="hover:text-primary">Contacto</Link>
          </div>
          <p>© 2026 BeStyle. Precision & Style.</p>
        </footer>
      </div>
    </main>
  );
}
