"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { barberService, WorkingHours } from "@/lib/services/barber.service";
import { storageService } from "@/lib/services/storage.service";
import Link from "next/link";

type ServiceInput = {
  name: string;
  price: string;
};

type ExtraStaffInput = {
  name: string;
};

const DAYS_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// Genera opciones de hora de 07:00 a 22:00 en pasos de 30 min
const TIME_OPTIONS: string[] = Array.from({ length: 31 }, (_, i) => {
  const total = 7 * 60 + i * 30;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

export default function OnboardingPage() {
  const { user, profile, loading: authLoading } = useAuth("barber");
  const router = useRouter();

  // — Sección 1: Info General —
  const [fullName, setFullName] = useState("");
  const [slug, setSlug] = useState("");
  const [location, setLocation] = useState("");
  const [numBarbers, setNumBarbers] = useState("1");

  // — Sección 2: Identidad Visual —
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // — Sección 3: Horario —
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5, 6]); // Lun-Sáb
  const [morningStart, setMorningStart] = useState("10:00");
  const [morningEnd, setMorningEnd] = useState("14:00");
  const [afternoonStart, setAfternoonStart] = useState("16:00");
  const [afternoonEnd, setAfternoonEnd] = useState("20:00");

  // — Sección 4: Servicios —
  const [services, setServices] = useState<ServiceInput[]>([{ name: "", price: "" }]);

  // — Sección 5: Equipo extra (si numBarbers > 1) —
  const [extraStaff, setExtraStaff] = useState<ExtraStaffInput[]>([]);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Inicializar nombre desde el perfil
  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile]);

  // Redirigir si ya tiene barbería
  useEffect(() => {
    async function checkProfile() {
      if (user) {
        const existing = await barberService.getByUserId(user.id);
        if (existing) router.push("/dashboard");
      }
    }
    if (!authLoading && user) checkProfile();
  }, [user, authLoading, router]);

  // Sincronizar extraStaff con numBarbers
  useEffect(() => {
    const count = parseInt(numBarbers) || 1;
    const extra = Math.max(0, count - 1);
    setExtraStaff((prev) => {
      if (prev.length === extra) return prev;
      if (prev.length < extra) {
        return [...prev, ...Array.from({ length: extra - prev.length }, () => ({ name: "" }))];
      }
      return prev.slice(0, extra);
    });
  }, [numBarbers]);

  // Helpers
  const toggleWorkDay = (day: number) => {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleServiceChange = (index: number, field: keyof ServiceInput, value: string) => {
    const updated = [...services];
    updated[index][field] = value;
    setServices(updated);
  };

  const updateExtraStaff = (index: number, value: string) => {
    const updated = [...extraStaff];
    updated[index].name = value;
    setExtraStaff(updated);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError("");

    if (workDays.length === 0) {
      setError("Selecciona al menos un día de trabajo.");
      return;
    }
    if (morningStart >= morningEnd && afternoonStart >= afternoonEnd) {
      setError("Los horarios de apertura deben ser anteriores a los de cierre.");
      return;
    }

    setSaving(true);

    try {
      const formattedSlug = slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const isAvailable = await barberService.checkSlugAvailability(formattedSlug);
      if (!isAvailable) {
        setError("Esta URL ya está en uso. Por favor, elige otra.");
        setSaving(false);
        return;
      }

      let avatarUrl = null;
      let coverUrl = null;

      if (avatarFile) {
        const path = `${user.id}/${storageService.generateFileName("avatar", avatarFile)}`;
        avatarUrl = await storageService.uploadImage(avatarFile, "avatars", path);
      }
      if (coverFile) {
        const path = `${user.id}/${storageService.generateFileName("cover", coverFile)}`;
        coverUrl = await storageService.uploadImage(coverFile, "covers", path);
      }

      const filteredServices = services.filter(
        (s) => s.name.trim() !== "" && s.price !== "" && parseFloat(s.price) > 0
      );

      const workingHours: WorkingHours = {
        days: workDays,
        morning_start: morningStart,
        morning_end: morningEnd,
        afternoon_start: afternoonStart,
        afternoon_end: afternoonEnd,
      };

      const barbershop = await barberService.createProfile({
        user_id: user.id,
        name: fullName.trim(),
        full_name: fullName.trim(),
        slug: formattedSlug,
        num_barbers: parseInt(numBarbers) || 1,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        location: location.trim() || null,
        services: filteredServices.map((s) => ({
          name: s.name.trim(),
          price: parseFloat(s.price) || 0,
        })),
        working_hours: workingHours,
      });

      // Crear entrada de staff para el dueño
      await barberService.addStaffMember({
        barbershop_id: barbershop.id,
        user_id: user.id,
        name: profile?.full_name || fullName.trim(),
        avatar_url: avatarUrl,
        role: "owner",
      });

      // Crear entradas de staff para especialistas adicionales
      for (const staffMember of extraStaff.filter((s) => s.name.trim() !== "")) {
        await barberService.addStaffMember({
          barbershop_id: barbershop.id,
          user_id: null,
          name: staffMember.name.trim(),
          avatar_url: null,
          role: "barber",
        });
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al guardar el perfil");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  const numBarbersInt = parseInt(numBarbers) || 1;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 md:p-12">
      <div className="w-full max-w-2xl">
        <div className="mb-12 text-center">
          <Link href="/" className="mb-8 inline-block text-3xl font-black tracking-tighter text-foreground">
            Barber<span className="text-primary">App</span>
          </Link>
          <h1 className="text-3xl font-black text-foreground md:text-4xl">Configura tu Barbería</h1>
          <p className="mt-3 text-lg text-muted-foreground">Crea tu perfil profesional y empieza a recibir citas.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10 rounded-3xl border border-border bg-secondary/30 p-8 shadow-2xl backdrop-blur-sm md:p-12">

          {/* ── SECCIÓN 1: Info General ── */}
          <div className="space-y-6">
            <h2 className="flex items-center gap-3 text-lg font-black text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm text-primary">1</span>
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
                  placeholder="Ej: La Barbería de Juan"
                  className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Especialistas</label>
                <input
                  type="number"
                  min="1"
                  max="20"
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
                placeholder="Ej: Calle Gran Vía 15, Madrid"
                className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/30"
              />
            </div>

            {/* URL — flex container para alineación perfecta */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tu URL personalizada</label>
              <div className="flex items-center overflow-hidden rounded-xl border border-border bg-background transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <span className="select-none whitespace-nowrap pl-4 pr-1 text-sm font-bold text-muted-foreground/50">
                  barber-app.com/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="barberia-juan"
                  className="min-w-0 flex-1 bg-transparent py-3 pr-4 font-bold text-foreground focus:outline-none placeholder:text-muted-foreground/20"
                />
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 2: Identidad Visual ── */}
          <div className="space-y-6">
            <h2 className="flex items-center gap-3 text-lg font-black text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm text-primary">2</span>
              Identidad Visual
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Logo / Perfil</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="block w-full cursor-pointer text-xs text-muted-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-xs file:font-black file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Imagen de Portada</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="block w-full cursor-pointer text-xs text-muted-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-xs file:font-black file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 3: Horario de Trabajo ── */}
          <div className="space-y-6">
            <h2 className="flex items-center gap-3 text-lg font-black text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm text-primary">3</span>
              Horario de Trabajo
            </h2>

            {/* Días laborables */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Días laborables</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_LABEL.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleWorkDay(index)}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                      workDays.includes(index)
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "border border-border bg-background text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Turnos */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Turno mañana */}
              <div className="space-y-3 rounded-2xl border border-border bg-background/40 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">☀️ Turno Mañana</p>
                <div className="flex items-center gap-2">
                  <select
                    value={morningStart}
                    onChange={(e) => setMorningStart(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="text-xs font-bold text-muted-foreground">hasta</span>
                  <select
                    value={morningEnd}
                    onChange={(e) => setMorningEnd(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Turno tarde */}
              <div className="space-y-3 rounded-2xl border border-border bg-background/40 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">🌆 Turno Tarde</p>
                <div className="flex items-center gap-2">
                  <select
                    value={afternoonStart}
                    onChange={(e) => setAfternoonStart(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="text-xs font-bold text-muted-foreground">hasta</span>
                  <select
                    value={afternoonEnd}
                    onChange={(e) => setAfternoonEnd(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground/60">
              💡 Solo se mostrará el turno de mañana si hay horas disponibles. Para un solo turno, pon el mismo horario en ambos campos del turno que no quieras usar.
            </p>
          </div>

          {/* ── SECCIÓN 4: Servicios ── */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-3 text-lg font-black text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm text-primary">4</span>
                Servicios y Tarifas
              </h2>
              <button
                type="button"
                onClick={() => setServices([...services, { name: "", price: "" }])}
                className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
              >
                + Añadir
              </button>
            </div>

            <div className="space-y-3">
              {services.map((service, index) => (
                <div key={index} className="flex animate-in fade-in slide-in-from-left-2 items-center gap-3 duration-300">
                  <input
                    type="text"
                    required
                    placeholder="Ej: Corte clásico"
                    value={service.name}
                    onChange={(e) => handleServiceChange(index, "name", e.target.value)}
                    className="block flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/20"
                  />
                  <div className="relative w-28">
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.5"
                      placeholder="20"
                      value={service.price}
                      onChange={(e) => handleServiceChange(index, "price", e.target.value)}
                      className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-sm font-black text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-primary/30"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-primary/50">€</span>
                  </div>
                  {services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setServices(services.filter((_, i) => i !== index))}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── SECCIÓN 5: Equipo (solo si numBarbers > 1) ── */}
          {numBarbersInt > 1 && (
            <div className="space-y-6">
              <h2 className="flex items-center gap-3 text-lg font-black text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm text-primary">5</span>
                Tu Equipo
              </h2>
              <p className="text-sm text-muted-foreground">
                Añade el nombre de tus especialistas. Podrán activar su cuenta y gestionar su agenda más adelante.
              </p>

              {/* El dueño (siempre) */}
              <div className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-black text-primary-foreground shadow-lg shadow-primary/20">
                  1
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">{profile?.full_name || fullName || "Tú"}</p>
                  <p className="text-xs text-primary font-bold">Propietario</p>
                </div>
              </div>

              {/* Especialistas adicionales */}
              {extraStaff.map((staff, index) => (
                <div
                  key={index}
                  className="flex animate-in fade-in slide-in-from-bottom-2 items-center gap-4 duration-300"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-background text-xs font-black text-muted-foreground">
                    {index + 2}
                  </div>
                  <input
                    type="text"
                    placeholder={`Nombre del especialista ${index + 2}`}
                    value={staff.name}
                    onChange={(e) => updateExtraStaff(index, e.target.value)}
                    className="block flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/30"
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Botón Enviar ── */}
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
                    <span>Guardando perfil...</span>
                  </>
                ) : (
                  <>
                    <span>Lanzar mi Barbería</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </>
                )}
              </div>
            </button>

            {error && (
              <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm font-bold text-red-400">
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
