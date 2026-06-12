"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { barberService, Barbershop, StaffMember } from "@/lib/services/barber.service";
import { storageService } from "@/lib/services/storage.service";

type ServiceInput = {
  name: string;
  price: string;
};

export default function EditProfilePage() {
  const { user, profile, loading: authLoading } = useAuth("barber");
  const router = useRouter();

  // Personal Info State
  const [personalName, setPersonalName] = useState("");
  const [personalAvatarFile, setPersonalAvatarFile] = useState<File | null>(null);

  // Barbershop Info State (Only for owners)
  const [barbershopName, setBarbershopName] = useState("");
  const [slug, setSlug] = useState("");
  const [location, setLocation] = useState("");
  const [numBarbers, setNumBarbers] = useState("1");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [services, setServices] = useState<ServiceInput[]>([
    { name: "", price: "" },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [barberData, setBarberData] = useState<Barbershop | null>(null);

  const isOwner = profile?.staffInfo?.role === "owner";

  useEffect(() => {
    async function loadData() {
      if (!user || !profile?.staffInfo) return;
      
      try {
        // Load Personal Staff Info
        setPersonalName(profile.staffInfo.name);

        // If owner, load Barbershop Info
        if (isOwner) {
          const data = await barberService.getByUserId(user.id);
          if (data) {
            setBarberData(data);
            setBarbershopName(data.full_name);
            setSlug(data.slug);
            setLocation(data.location || "");
            setNumBarbers(data.num_barbers.toString());
            setServices(data.services.length > 0 ? data.services : [{ name: "", price: "" }]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && user) {
      loadData();
    }
  }, [user, profile, authLoading, isOwner]);

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
    if (!user || !profile?.staffInfo) return;
    
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      // 1. Update Personal Info (Staff record)
      let personalAvatarUrl = profile.staffInfo.avatar_url;
      if (personalAvatarFile) {
        try {
          const path = `${user.id}/staff/${storageService.generateFileName("avatar", personalAvatarFile)}`;
          personalAvatarUrl = await storageService.uploadImage(personalAvatarFile, "portfolio", path);
        } catch (err: any) {
          throw new Error(`Error al subir foto de perfil: ${err.message}`);
        }
      }

      try {
        await barberService.updateStaffMember(profile.staffInfo.id, {
          name: personalName,
          avatar_url: personalAvatarUrl,
        });
      } catch (err: any) {
        throw new Error(`Error al actualizar información personal: ${err.message}`);
      }

      // 2. Update Barbershop Info (If owner)
      if (isOwner && barberData) {
        const formattedSlug = slug
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");

        if (formattedSlug !== barberData.slug) {
          const isAvailable = await barberService.checkSlugAvailability(formattedSlug);
          if (!isAvailable) {
            setError("Esta URL ya está en uso. Por favor, elige otra.");
            setSaving(false);
            return;
          }
        }

        let coverUrl = barberData.cover_url;
        if (coverFile) {
          try {
            const path = `${user.id}/${storageService.generateFileName("cover", coverFile)}`;
            coverUrl = await storageService.uploadImage(coverFile, "portfolio", path);
          } catch (err: any) {
            throw new Error(`Error al subir foto de portada: ${err.message}`);
          }
        }

        const filteredServices = services.filter(
          (s) => s.name.trim() !== "" && s.price.trim() !== ""
        );

        try {
          await barberService.updateBarbershop(barberData.id, {
            name: barbershopName,
            full_name: barbershopName,
            slug: formattedSlug,
            num_barbers: parseInt(numBarbers) || 1,
            avatar_url: personalAvatarUrl, // Sync barbershop avatar with owner's avatar
            cover_url: coverUrl,
            location,
            services: filteredServices,
          });
        } catch (err: any) {
          throw new Error(`Error al actualizar información de la barbería: ${err.message}`);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
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
    <main className="min-h-screen bg-background p-6 md:p-12 pb-32">
      <div className="mx-auto max-w-2xl">
        <div className="mb-12">
          <button 
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Volver al Dashboard
          </button>
          <h1 className="text-3xl font-black text-foreground md:text-4xl">Mi Perfil</h1>
          <p className="mt-3 text-muted-foreground text-lg">
            {isOwner ? "Gestiona tu información personal y los datos de tu negocio." : "Actualiza tu información profesional."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* SECCIÓN PERSONAL (Para todos) */}
          <section className="space-y-8 rounded-3xl border border-border bg-secondary/30 p-8 shadow-2xl backdrop-blur-sm md:p-12">
            <h2 className="flex items-center gap-3 text-xl font-black text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm">1</span>
              Información Personal
            </h2>
            
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tu Nombre Público</label>
                <input
                  type="text"
                  required
                  value={personalName}
                  onChange={(e) => setPersonalName(e.target.value)}
                  className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Tu nombre artístico"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Foto de Perfil</label>
                <div className="flex items-center gap-6">
                  {profile?.staffInfo?.avatar_url && !personalAvatarFile && (
                    <div className="h-16 w-16 overflow-hidden rounded-2xl border border-border">
                      <img src={profile.staffInfo.avatar_url} alt="Avatar actual" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPersonalAvatarFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-xs file:font-black file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN NEGOCIO (Solo dueños) */}
          {isOwner && (
            <>
              <section className="space-y-8 rounded-3xl border border-border bg-secondary/30 p-8 shadow-2xl backdrop-blur-sm md:p-12">
                <h2 className="flex items-center gap-3 text-xl font-black text-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm">2</span>
                  Información de la Barbería
                </h2>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nombre del Negocio</label>
                    <input
                      type="text"
                      required
                      value={barbershopName}
                      onChange={(e) => setBarbershopName(e.target.value)}
                      className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Especialistas totales</label>
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

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dirección</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    placeholder="Calle, Ciudad, etc."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">URL de tu página</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-sm font-bold text-muted-foreground/50">barber-app.com/</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="block w-full rounded-xl border border-border bg-background py-3 pl-[125px] pr-4 text-foreground font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Imagen de Portada</label>
                  <div className="flex flex-col gap-4">
                    {barberData?.cover_url && !coverFile && (
                      <div className="relative h-32 w-full overflow-hidden rounded-2xl border border-border">
                        <img src={barberData.cover_url} alt="Portada actual" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-xs file:font-black file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-8 rounded-3xl border border-border bg-secondary/30 p-8 shadow-2xl backdrop-blur-sm md:p-12">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-3 text-xl font-black text-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm">3</span>
                    Servicios y Tarifas
                  </h2>
                  <button 
                    type="button" 
                    onClick={addServiceField} 
                    className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
                  >
                    + Añadir
                  </button>
                </div>
                
                <div className="space-y-4">
                  {services.map((service, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <input
                        type="text"
                        required
                        placeholder="Corte Degradado"
                        value={service.name}
                        onChange={(e) => handleServiceChange(index, "name", e.target.value)}
                        className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none transition-all"
                      />
                      <input
                        type="text"
                        required
                        placeholder="20€"
                        value={service.price}
                        onChange={(e) => handleServiceChange(index, "price", e.target.value)}
                        className="w-24 rounded-xl border border-border bg-background px-4 py-3 text-sm font-black text-primary text-center focus:border-primary focus:outline-none transition-all"
                      />
                      {services.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeServiceField(index)} 
                          className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/80 p-6 backdrop-blur-lg">
            <div className="mx-auto max-w-2xl">
              <button
                type="submit"
                disabled={saving}
                className="group relative w-full overflow-hidden rounded-2xl bg-primary py-4 text-lg font-black text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar todos los cambios"}
              </button>

              {success && (
                <div className="mt-4 text-center text-sm font-bold text-green-500 animate-in fade-in slide-in-from-bottom-2">
                  ¡Perfil actualizado correctamente! Redirigiendo...
                </div>
              )}

              {error && (
                <div className="mt-4 text-center text-sm font-bold text-red-400">
                  {error}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
