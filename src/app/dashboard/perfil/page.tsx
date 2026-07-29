"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { barberService, Barbershop, PortfolioPhoto, VacationPeriod } from "@/lib/services/barber.service";
import { storageService } from "@/lib/services/storage.service";
import { authService } from "@/lib/services/auth.service";
import { dateUtils } from "@/lib/utils/date-utils";
import {
  TrashIcon,
  CameraIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@/components/Icons";

const DAYS_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const TIME_OPTIONS: string[] = Array.from({ length: 31 }, (_, i) => {
  const h = Math.floor(i / 2) + 7; // 7:00 a 22:00
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

type ServiceInput = {
  name: string;
  price: string;
  duration: string;
};

// Usa FileReader para generar un data URL estable (compatible con React Strict Mode)
function useLocalPreview(file: File | null) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!cancelled) setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    return () => { cancelled = true; };
  }, [file]);
  return preview;
}

export default function EditProfilePage() {
  const { user, profile, loading: authLoading } = useAuth("barber");
  const router = useRouter();

  // Personal Info State
  const [personalName, setPersonalName] = useState("");
  const [personalAvatarFile, setPersonalAvatarFile] = useState<File | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);

  // Barbershop Info State (Only for owners)
  const [barbershopName, setBarbershopName] = useState("");
  const [slug, setSlug] = useState("");
  const [location, setLocation] = useState("");
  const [numBarbers, setNumBarbers] = useState("1");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceInput[]>([
    { name: "", price: "", duration: "30" },
  ]);

  // Working Hours State
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [morningStart, setMorningStart] = useState("09:00");
  const [morningEnd, setMorningEnd] = useState("14:00");
  const [afternoonStart, setAfternoonStart] = useState("16:00");
  const [afternoonEnd, setAfternoonEnd] = useState("20:00");

  // Vacations State
  const [vacations, setVacations] = useState<VacationPeriod[]>([]);
  const [newVacationStart, setNewVacationStart] = useState("");
  const [newVacationEnd, setNewVacationEnd] = useState("");
  const [vacationError, setVacationError] = useState("");

  const handleAddVacation = () => {
    setVacationError("");
    if (!newVacationStart || !newVacationEnd) {
      setVacationError("Debes seleccionar ambas fechas.");
      return;
    }
    if (newVacationStart > newVacationEnd) {
      setVacationError("La fecha de inicio no puede ser posterior a la de fin.");
      return;
    }
    
    const overlaps = vacations.some(
      (v) =>
        (newVacationStart >= v.start_date && newVacationStart <= v.end_date) ||
        (newVacationEnd >= v.start_date && newVacationEnd <= v.end_date) ||
        (newVacationStart <= v.start_date && newVacationEnd >= v.end_date)
    );
    if (overlaps) {
      setVacationError("Este periodo se solapa con uno existente.");
      return;
    }

    setVacations((prev) =>
      [...prev, { start_date: newVacationStart, end_date: newVacationEnd }].sort(
        (a, b) => a.start_date.localeCompare(b.start_date)
      )
    );
    setNewVacationStart("");
    setNewVacationEnd("");
  };

  const handleRemoveVacation = (indexToRemove: number) => {
    setVacations((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const toggleWorkDay = (dayIndex: number) => {
    setWorkDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [barberData, setBarberData] = useState<Barbershop | null>(null);

  // Portfolio state
  const [portfolioPhotos, setPortfolioPhotos] = useState<PortfolioPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Password reset
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  // Añadir barbero inline
  const [showAddBarber, setShowAddBarber] = useState(false);
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberAvatarFile, setNewBarberAvatarFile] = useState<File | null>(null);
  const [newBarberSaving, setNewBarberSaving] = useState(false);
  const [newBarberError, setNewBarberError] = useState('');
  const [newBarberSuccess, setNewBarberSuccess] = useState(false);

  // Local image previews
  const avatarPreview = useLocalPreview(personalAvatarFile);
  const coverPreview = useLocalPreview(coverFile);
  const newBarberAvatarPreview = useLocalPreview(newBarberAvatarFile);

  const isOwner = profile?.staffInfo?.role === "owner";

  useEffect(() => {
    async function loadData() {
      if (!user || !profile?.staffInfo) return;

      try {
        setPersonalName(profile.staffInfo.name);
        setCurrentAvatarUrl(profile.staffInfo.avatar_url);

        if (isOwner) {
          const data = await barberService.getByUserId(user.id);
          if (data) {
            setBarberData(data);
            setBarbershopName(data.full_name);
            setSlug(data.slug);
            setLocation(data.location || "");
            setNumBarbers(data.num_barbers.toString());
            setCurrentCoverUrl(data.cover_url);
            setServices(
              data.services.length > 0
                ? data.services.map((s) => ({
                    name: s.name,
                    price: String(s.price),
                    duration: String(s.duration_minutes ?? 30),
                  }))
                : [{ name: "", price: "", duration: "30" }]
            );
            if (data.working_hours) {
              setWorkDays(data.working_hours.days || [1, 2, 3, 4, 5, 6]);
              setMorningStart(data.working_hours.morning_start || "09:00");
              setMorningEnd(data.working_hours.morning_end || "14:00");
              setAfternoonStart(data.working_hours.afternoon_start || "16:00");
              setAfternoonEnd(data.working_hours.afternoon_end || "20:00");
              setVacations(data.working_hours.vacations || []);
            }
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

  // Cargar fotos de portfolio
  useEffect(() => {
    async function loadPhotos() {
      if (!profile?.staffInfo) return;
      setLoadingPhotos(true);
      try {
        const photos = await barberService.getPortfolioPhotos(
          profile.staffInfo.barbershop_id,
          isOwner ? undefined : profile.staffInfo.id,
          false
        );
        setPortfolioPhotos(photos);
      } catch (err) {
        console.error("Error al cargar portfolio:", err);
      } finally {
        setLoadingPhotos(false);
      }
    }
    if (!loading && profile) {
      loadPhotos();
    }
  }, [loading, profile, isOwner]);

  const handleToggleVisibility = async (photo: PortfolioPhoto) => {
    setTogglingId(photo.id);
    try {
      await barberService.togglePhotoVisibility(photo.id, !photo.is_visible);
      setPortfolioPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, is_visible: !p.is_visible } : p))
      );
    } catch (err) {
      console.error("Error al cambiar visibilidad:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      await authService.resetPassword(user.email);
      setPasswordResetSent(true);
      setTimeout(() => setPasswordResetSent(false), 6000);
    } catch (err) {
      console.error("Error enviando email de recuperación:", err);
    }
  };

  async function handleAddBarber() {
    if (!user || !barberData || !newBarberName.trim()) return;
    setNewBarberSaving(true);
    setNewBarberError('');
    try {
      let avatarUrl: string | null = null;
      if (newBarberAvatarFile) {
        const path = `${user.id}/staff/${storageService.generateFileName('staff-avatar', newBarberAvatarFile)}`;
        avatarUrl = await storageService.uploadImage(newBarberAvatarFile, 'avatars', path);
      }
      await barberService.addStaffMember({
        barbershop_id: barberData.id,
        user_id: null,
        name: newBarberName.trim(),
        avatar_url: avatarUrl,
        role: 'barber',
      });
      const newCount = (parseInt(numBarbers) || 1) + 1;
      await barberService.updateBarbershop(barberData.id, { num_barbers: newCount });
      setNumBarbers(String(newCount));
      setNewBarberSuccess(true);
      setNewBarberName('');
      setNewBarberAvatarFile(null);
      setTimeout(() => {
        setShowAddBarber(false);
        setNewBarberSuccess(false);
      }, 2000);
    } catch (err: any) {
      setNewBarberError(err.message || 'Error al añadir el barbero');
    } finally {
      setNewBarberSaving(false);
    }
  }

  const handleServiceChange = (index: number, field: keyof ServiceInput, value: string) => {
    const newServices = [...services];
    newServices[index][field] = value;
    setServices(newServices);
  };

  const addServiceField = () => setServices([...services, { name: "", price: "", duration: "30" }]);
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
      // 1. Subir avatar al bucket correcto ("avatars")
      let newAvatarUrl = currentAvatarUrl;
      if (personalAvatarFile) {
        try {
          const path = `${user.id}/${storageService.generateFileName("avatar", personalAvatarFile)}`;
          newAvatarUrl = await storageService.uploadImage(personalAvatarFile, "avatars", path);
          setCurrentAvatarUrl(newAvatarUrl);
        } catch (err: any) {
          throw new Error(`Error al subir foto de perfil: ${err.message}`);
        }
      }

      // 2. Actualizar registro de staff
      try {
        await barberService.updateStaffMember(profile.staffInfo.id, {
          name: personalName,
          avatar_url: newAvatarUrl,
        });
      } catch (err: any) {
        throw new Error(`Error al actualizar información personal: ${err.message}`);
      }

      // 3. Actualizar barbería (solo owners)
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

        // Subir portada al bucket correcto ("covers")
        let newCoverUrl = currentCoverUrl;
        if (coverFile) {
          try {
            const path = `${user.id}/${storageService.generateFileName("cover", coverFile)}`;
            newCoverUrl = await storageService.uploadImage(coverFile, "covers", path);
            setCurrentCoverUrl(newCoverUrl);
          } catch (err: any) {
            throw new Error(`Error al subir foto de portada: ${err.message}`);
          }
        }

        const filteredServices = services.filter(
          (s) => s.name.trim() !== "" && s.price !== "" && parseFloat(s.price) > 0
        );

        try {
          await barberService.updateBarbershop(barberData.id, {
            name: barbershopName.trim(),
            full_name: barbershopName.trim(),
            slug: formattedSlug,
            num_barbers: parseInt(numBarbers) || 1,
            avatar_url: newAvatarUrl,  // avatar del owner sincronizado
            cover_url: newCoverUrl,
            location,
            services: filteredServices.map((s) => ({
              name: s.name.trim(),
              price: parseFloat(s.price) || 0,
              duration_minutes: parseInt(s.duration) || 30,
            })),
            working_hours: {
              days: workDays,
              morning_start: morningStart,
              morning_end: morningEnd,
              afternoon_start: afternoonStart,
              afternoon_end: afternoonEnd,
              vacations: vacations,
            },
          });
        } catch (err: any) {
          throw new Error(`Error al actualizar información de la barbería: ${err.message}`);
        }
      }

      // Limpiar archivos seleccionados tras guardar con éxito
      setPersonalAvatarFile(null);
      setCoverFile(null);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
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
    <main className="min-h-screen bg-background p-6 pb-40 md:p-12 md:pb-44">
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
          {/* SECCIÓN PERSONAL */}
          <section className="space-y-8 rounded-3xl border border-border bg-secondary/30 p-6 shadow-2xl backdrop-blur-sm sm:p-8 md:p-12">
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

              {/* Avatar con preview */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Foto de Perfil</label>
                <div className="flex items-center gap-5">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary">
                    {avatarPreview || currentAvatarUrl ? (
                      <img
                        key={avatarPreview ?? currentAvatarUrl!}
                        src={avatarPreview ?? currentAvatarUrl!}
                        alt="Vista previa avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-black text-muted-foreground">
                        {personalName.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    {avatarPreview && (
                      <div className="absolute inset-0 flex items-end justify-center bg-primary/10">
                        <span className="w-full bg-primary/80 py-0.5 text-center text-[9px] font-black uppercase tracking-widest text-primary-foreground">
                          Nueva
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPersonalAvatarFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-xs file:font-black file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">JPG, PNG o WEBP · Máx. 5 MB</p>
                  </div>
                </div>
              </div>

              {/* Cambiar contraseña */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-foreground">Contraseña</p>
                  <p className="text-xs text-muted-foreground">Recibirás un enlace en tu email para cambiarla.</p>
                </div>
                {passwordResetSent ? (
                  <span className="text-xs font-bold text-green-500">✓ Email enviado</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    className="text-xs font-black text-primary hover:underline"
                  >
                    Cambiar →
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* SECCIÓN NEGOCIO (Solo dueños) */}
          {isOwner && (
            <>
              <section className="space-y-8 rounded-3xl border border-border bg-secondary/30 p-6 shadow-2xl backdrop-blur-sm sm:p-8 md:p-12">
                <h2 className="flex items-center gap-3 text-xl font-black text-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm">2</span>
                  Información de la Barbería
                </h2>

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
                  <div className="flex items-center overflow-hidden rounded-xl border border-border bg-background transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                    <span className="select-none whitespace-nowrap pl-4 pr-1 text-sm font-bold text-muted-foreground/50">
                      bestyle.com/
                    </span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent py-3 pr-4 font-bold text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                {/* Portada con preview */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Imagen de Portada</label>
                  {(coverPreview || currentCoverUrl) && (
                    <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-border">
                      <img
                        key={coverPreview ?? currentCoverUrl!}
                        src={coverPreview ?? currentCoverUrl!}
                        alt="Vista previa portada"
                        className="h-full w-full object-cover"
                      />
                      {coverPreview && (
                        <div className="absolute inset-0 flex items-end">
                          <span className="w-full bg-primary/80 py-1 text-center text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                            Nueva imagen — sin guardar
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-xs file:font-black file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">JPG, PNG o WEBP · Máx. 5 MB · Recomendado: 1280×400 px</p>
                </div>
              </section>

              <section className="space-y-8 rounded-3xl border border-border bg-secondary/30 p-6 shadow-2xl backdrop-blur-sm sm:p-8 md:p-12">
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

                <div className="space-y-3">
                  {services.map((service, index) => (
                    <div key={index} className="rounded-xl border border-border bg-background p-3">
                      <input
                        type="text"
                        required
                        placeholder="Corte Degradado"
                        value={service.name}
                        onChange={(e) => handleServiceChange(index, "name", e.target.value)}
                        className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-sm font-bold text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-all"
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">€</span>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.5"
                            placeholder="20"
                            value={service.price}
                            onChange={(e) => handleServiceChange(index, "price", e.target.value)}
                            className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 pl-6 pr-3 text-sm font-black text-primary focus:border-primary focus:outline-none transition-all"
                          />
                        </div>
                        <select
                          value={service.duration}
                          onChange={(e) => handleServiceChange(index, "duration", e.target.value)}
                          className="flex-1 rounded-lg border border-border bg-secondary/30 px-2 py-2.5 text-sm font-bold text-muted-foreground focus:border-primary focus:outline-none transition-all"
                        >
                          <option value="15">15 min</option>
                          <option value="30">30 min</option>
                          <option value="45">45 min</option>
                          <option value="60">1h</option>
                          <option value="75">1h 15m</option>
                          <option value="90">1h 30m</option>
                          <option value="120">2h</option>
                        </select>
                        {services.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeServiceField(index)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── SECCIÓN 4: Horario de Trabajo ── */}
              <section className="space-y-6 rounded-3xl border border-border bg-secondary/30 p-6 shadow-2xl backdrop-blur-sm sm:p-8 md:p-12">
                <h2 className="flex items-center gap-3 text-xl font-black text-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm">4</span>
                  Horario de Trabajo
                </h2>

                {/* Días laborables */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">Días laborables</label>
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
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Turno Mañana</p>
                    <div className="flex items-center gap-2">
                      <select
                        value={morningStart}
                        onChange={(e) => setMorningStart(e.target.value)}
                        className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className="text-xs font-bold text-muted-foreground">hasta</span>
                      <select
                        value={morningEnd}
                        onChange={(e) => setMorningEnd(e.target.value)}
                        className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Turno tarde */}
                  <div className="space-y-3 rounded-2xl border border-border bg-background/40 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Turno Tarde</p>
                    <div className="flex items-center gap-2">
                      <select
                        value={afternoonStart}
                        onChange={(e) => setAfternoonStart(e.target.value)}
                        className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className="text-xs font-bold text-muted-foreground">hasta</span>
                      <select
                        value={afternoonEnd}
                        onChange={(e) => setAfternoonEnd(e.target.value)}
                        className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── SECCIÓN 5: Vacaciones y Cierres ── */}
              <section className="space-y-6 rounded-3xl border border-border bg-secondary/30 p-6 shadow-2xl backdrop-blur-sm sm:p-8 md:p-12">
                <h2 className="flex items-center gap-3 text-xl font-black text-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm">5</span>
                  Vacaciones y Cierres Temporales
                </h2>
                <p className="text-sm text-muted-foreground text-left">
                  Define los periodos en los que la barbería estará cerrada. No se podrán realizar reservas durante estas fechas.
                </p>

                {/* Formulario para añadir periodo de vacaciones */}
                <div className="rounded-2xl border border-border bg-background/40 p-4 space-y-4">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground text-left">Añadir Periodo de Vacaciones</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-lg">
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-muted-foreground">Fecha de inicio</label>
                      <input
                        type="date"
                        value={newVacationStart}
                        onChange={(e) => setNewVacationStart(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-muted-foreground">Fecha de fin</label>
                      <input
                        type="date"
                        value={newVacationEnd}
                        onChange={(e) => setNewVacationEnd(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVacation}
                    className="w-full max-w-lg rounded-xl bg-primary/10 hover:bg-primary/20 py-2.5 text-xs font-bold text-primary transition-all cursor-pointer block"
                  >
                    + Añadir Periodo
                  </button>
                  {vacationError && (
                    <p className="text-xs text-red-400 font-medium text-left">{vacationError}</p>
                  )}
                </div>

                {/* Lista de vacaciones guardadas */}
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground text-left">Periodos Configurados</p>
                  {vacations.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-left">No hay periodos de vacaciones configurados.</p>
                  ) : (
                    <div className="space-y-2">
                      {vacations.map((vac, idx) => {
                        const formatDateStr = (dateStr: string) => {
                          const [year, month, day] = dateStr.split("-");
                          return `${day}/${month}/${year}`;
                        };
                        return (
                          <div key={idx} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">
                                Del <span className="font-bold text-primary">{formatDateStr(vac.start_date)}</span> al <span className="font-bold text-primary">{formatDateStr(vac.end_date)}</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveVacation(idx)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* SECCIÓN PORTFOLIO */}
          <section className="space-y-6 rounded-3xl border border-border bg-secondary/30 p-6 shadow-2xl backdrop-blur-sm sm:p-8 md:p-12">
            <div>
              <h2 className="flex items-center gap-3 text-xl font-black text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm">
                  {isOwner ? "6" : "2"}
                </span>
                Gestión de Portfolio
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Haz clic en una foto para mostrarla u ocultarla en tu perfil público. Los cambios se guardan al instante.
              </p>
            </div>

            {loadingPhotos ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
              </div>
            ) : portfolioPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20 py-14 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <CameraIcon className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Aún no tienes fotos en el portfolio.</p>
                <p className="mt-1 text-xs text-muted-foreground/60">Se añaden automáticamente al completar una cita desde el Dashboard.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {portfolioPhotos.map((photo) => {
                  const isToggling = togglingId === photo.id;
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => handleToggleVisibility(photo)}
                      disabled={isToggling}
                      title={photo.is_visible ? "Haz clic para ocultar del perfil" : "Haz clic para mostrar en el perfil"}
                      className="group relative aspect-square overflow-hidden rounded-2xl border border-border focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-wait"
                    >
                      <Image
                        src={photo.image_url}
                        alt="Foto de portfolio"
                        fill
                        className={`object-cover transition-all duration-300 ${
                          !photo.is_visible ? "opacity-30 grayscale" : "group-hover:scale-105"
                        }`}
                        unoptimized
                      />
                      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                        photo.is_visible ? "bg-black/0 group-hover:bg-black/50" : "bg-black/30"
                      }`}>
                        {isToggling ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <div className={`rounded-full bg-black/70 p-2 transition-all duration-200 ${
                            photo.is_visible
                              ? "scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                              : "scale-100 opacity-100"
                          }`}>
                            {photo.is_visible ? (
                              <EyeSlashIcon className="h-5 w-5 text-white" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-white" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0">
                        <div className={`py-1 text-center text-[10px] font-black uppercase tracking-widest transition-all ${
                          photo.is_visible ? "bg-primary/80 text-primary-foreground" : "bg-black/60 text-white/70"
                        }`}>
                          {photo.is_visible ? "Visible" : "Oculta"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* SECCIÓN AÑADIR BARBERO (Solo dueños) */}
          {isOwner && (
            <section className="space-y-6 rounded-3xl border border-border bg-secondary/30 p-6 shadow-2xl backdrop-blur-sm sm:p-8 md:p-12">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-3 text-xl font-black text-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm">7</span>
                  Añadir Barbero al Equipo
                </h2>
                {!showAddBarber && (
                  <button
                    type="button"
                    onClick={() => { setShowAddBarber(true); setNewBarberError(''); setNewBarberSuccess(false); }}
                    className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
                  >
                    + Añadir
                  </button>
                )}
              </div>

              {!showAddBarber && (
                <p className="text-sm text-muted-foreground">
                  Añade nuevos barberos a tu equipo sin salir de esta página.
                </p>
              )}

              {showAddBarber && (
                <div className="space-y-5">
                  <div className="flex items-center gap-5">
                    {/* Avatar preview */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary">
                      {newBarberAvatarPreview ? (
                        <img
                          key={newBarberAvatarPreview}
                          src={newBarberAvatarPreview}
                          alt="Vista previa"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-black text-muted-foreground">
                          {newBarberName.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nombre</label>
                      <input
                        type="text"
                        value={newBarberName}
                        onChange={(e) => setNewBarberName(e.target.value)}
                        placeholder="Ej: Carlos G."
                        className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Foto de perfil <span className="normal-case font-normal">(opcional)</span></label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewBarberAvatarFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-xs file:font-black file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                    />
                  </div>

                  {newBarberError && (
                    <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">{newBarberError}</p>
                  )}
                  {newBarberSuccess && (
                    <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary">✓ Barbero añadido correctamente</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleAddBarber}
                      disabled={newBarberSaving || !newBarberName.trim()}
                      className="flex-1 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {newBarberSaving ? 'Guardando...' : 'Guardar barbero'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddBarber(false); setNewBarberName(''); setNewBarberAvatarFile(null); setNewBarberError(''); }}
                      className="rounded-xl border border-border bg-background px-6 py-3 text-sm font-bold text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Barra fija de guardado */}
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/90 backdrop-blur-lg">
            <div className="mx-auto max-w-2xl px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-primary py-4 text-base font-black text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Guardando cambios...
                  </span>
                ) : (
                  "Guardar todos los cambios"
                )}
              </button>

              {success && (
                <p className="mt-3 text-center text-sm font-bold text-green-500">
                  ✓ Perfil actualizado correctamente. Redirigiendo...
                </p>
              )}
              {error && (
                <p className="mt-3 text-center text-sm font-bold text-red-400">{error}</p>
              )}
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

