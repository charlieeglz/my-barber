"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { barberService, Barbershop } from "@/lib/services/barber.service";
import { storageService } from "@/lib/services/storage.service";
import Link from "next/navigation";

type ServiceInput = {
  name: string;
  price: string;
};

export default function EditProfilePage() {
  const { user, profile, loading: authLoading } = useAuth("barber");
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [slug, setSlug] = useState("");
  const [location, setLocation] = useState("");
  const [numBarbers, setNumBarbers] = useState("1");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [services, setServices] = useState<ServiceInput[]>([
    { name: "", price: "" },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [barber, setBarber] = useState<Barbershop | null>(null);

  useEffect(() => {
    async function loadBarberData() {
      if (!user) return;
      try {
        const data = await barberService.getByUserId(user.id);
        if (data) {
          setBarber(data);
          setFullName(data.full_name);
          setSlug(data.slug);
          setLocation(data.location || "");
          setNumBarbers(data.num_barbers.toString());
          setServices(data.services.length > 0 ? data.services : [{ name: "", price: "" }]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && user) {
      loadBarberData();
    }
  }, [user, authLoading]);

  const handleServiceChange = (index: number, field: keyof ServiceInput, value: string) => {
    const newServices = [...services];
    newServices[index][field] = value;
    setServices(newServices);
  };

  const addServiceField = () => setServices([...services, { name: "", price: "" }]);
  const removeServiceField = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !barber) return;
    
    setError("");
    setSaving(true);

    try {
      const formattedSlug = slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      // Solo chequear si el slug cambió
      if (formattedSlug !== barber.slug) {
        const isAvailable = await barberService.checkSlugAvailability(formattedSlug);
        if (!isAvailable) {
          setError("Esta URL ya está en uso. Por favor, elige otra.");
          setSaving(false);
          return;
        }
      }

      let avatarUrl = barber.avatar_url;
      let coverUrl = barber.cover_url;

      if (avatarFile) {
        const path = `${user.id}/${storageService.generateFileName("avatar", avatarFile)}`;
        avatarUrl = await storageService.uploadImage(avatarFile, "portfolio", path);
      }

      if (coverFile) {
        const path = `${user.id}/${storageService.generateFileName("cover", coverFile)}`;
        coverUrl = await storageService.uploadImage(coverFile, "portfolio", path);
      }

      const filteredServices = services.filter(
        (s) => s.name.trim() !== "" && s.price.trim() !== ""
      );

      await barberService.updateBarbershop(barber.id, {
        name: fullName,
        full_name: fullName,
        slug: formattedSlug,
        num_barbers: parseInt(numBarbers) || 1,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        location,
        services: filteredServices,
      });

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al actualizar el perfil");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );

  return (
    <main className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-12">
          <button 
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Volver al Dashboard
          </button>
          <h1 className="text-3xl font-black text-foreground md:text-4xl">Editar Perfil</h1>
          <p className="mt-3 text-muted-foreground text-lg">Actualiza la información de tu barbería.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10 rounded-3xl border border-border bg-secondary/30 p-8 shadow-2xl backdrop-blur-sm md:p-12">
          {/* Sección 1: Datos Básicos */}
          <div className="space-y-6">
            <h2 className="flex items-center gap-3 text-lg font-black text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm">1</span>
              Información General
            </h2>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nombre de la Barbería</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Especialistas</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={numBarbers}
                  onChange={(e) => setNumBarbers(e.target.value)}
                  className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dirección / Ubicación</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/30"
                placeholder="Ej: Calle Gran Vía 15, Madrid"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tu URL personalizada</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-sm font-bold text-muted-foreground/50">barber-app.com/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="block w-full rounded-xl border border-border bg-background py-3 pl-[125px] pr-4 text-foreground font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/20"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Identidad Visual */}
          <div className="space-y-6">
            <h2 className="flex items-center gap-3 text-lg font-black text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm">2</span>
              Identidad Visual
            </h2>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Logo / Perfil (Nueva)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-xs file:font-black file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Imagen de Portada (Nueva)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-xs file:font-black file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección 3: Servicios */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-3 text-lg font-black text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm">3</span>
                Servicios y Tarifas
              </h2>
              <button 
                type="button" 
                onClick={addServiceField} 
                className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
              >
                + Añadir Servicio
              </button>
            </div>
            
            <div className="space-y-3">
              {services.map((service, index) => (
                <div key={index} className="group flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      placeholder="Ej: Corte clásico"
                      value={service.name}
                      onChange={(e) => handleServiceChange(index, "name", e.target.value)}
                      className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/20"
                    />
                  </div>
                  <div className="relative w-32">
                    <input
                      type="text"
                      required
                      placeholder="Ej: 15€"
                      value={service.price}
                      onChange={(e) => handleServiceChange(index, "price", e.target.value)}
                      className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-black text-primary text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-primary/30"
                    />
                  </div>
                  {services.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeServiceField(index)} 
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={saving}
              className="group relative w-full overflow-hidden rounded-2xl bg-primary py-5 text-xl font-black text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                {saving ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <>
                    <span>Actualizar Perfil</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </>
                )}
              </div>
            </button>

            {error && (
              <div className="mt-6 rounded-xl bg-red-500/10 p-4 text-center text-sm font-bold text-red-400 border border-red-500/20">
                {error}
              </div>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}
