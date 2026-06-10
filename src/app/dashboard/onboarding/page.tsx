"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { barberService } from "@/lib/services/barber.service";
import { storageService } from "@/lib/services/storage.service";

type ServiceInput = {
  name: string;
  price: string;
};

export default function OnboardingPage() {
  const { user, profile, loading: authLoading } = useAuth("barber");
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [slug, setSlug] = useState("");
  const [numBarbers, setNumBarbers] = useState("1");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [services, setServices] = useState<ServiceInput[]>([
    { name: "", price: "" },
  ]);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync profile name
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  // Check if already has profile
  useEffect(() => {
    async function checkProfile() {
      if (user) {
        const existing = await barberService.getByUserId(user.id);
        if (existing) {
          router.push("/dashboard");
        }
      }
    }
    if (!authLoading && user) {
      checkProfile();
    }
  }, [user, authLoading, router]);

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
    if (!user) return;
    
    setError("");
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
        avatarUrl = await storageService.uploadImage(avatarFile, "portfolio", path);
      }

      if (coverFile) {
        const path = `${user.id}/${storageService.generateFileName("cover", coverFile)}`;
        coverUrl = await storageService.uploadImage(coverFile, "portfolio", path);
      }

      const filteredServices = services.filter(
        (s) => s.name.trim() !== "" && s.price.trim() !== ""
      );

      await barberService.createProfile({
        user_id: user.id,
        name: fullName,
        full_name: fullName,
        slug: formattedSlug,
        num_barbers: parseInt(numBarbers) || 1,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        services: filteredServices,
      });

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al guardar el perfil");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return <p className="text-center py-8">Cargando...</p>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-xl rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Configura tu Barbería</h1>
        <p className="mb-6 text-sm text-gray-600">Completa tu perfil profesional para el escaparate público.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre de la Barbería</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                placeholder="Ej: La Barbería de Juan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Número de Peluqueros</label>
              <input
                type="number"
                min="1"
                required
                value={numBarbers}
                onChange={(e) => setNumBarbers(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tu URL personalizada</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 text-sm">app.com/</span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                placeholder="barberia-juan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Logo / Foto de Perfil</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:py-2 file:px-4 file:text-sm file:font-semibold hover:file:bg-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Imagen de Cabecera</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:py-2 file:px-4 file:text-sm file:font-semibold hover:file:bg-gray-200"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Servicios y Tarifas</label>
              <button type="button" onClick={addServiceField} className="text-sm font-medium text-black hover:underline">+ Añadir servicio</button>
            </div>
            {services.map((service, index) => (
              <div key={index} className="mb-2 flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ej: Corte clásico"
                  value={service.name}
                  onChange={(e) => handleServiceChange(index, "name", e.target.value)}
                  className="block w-2/3 rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                />
                <input
                  type="text"
                  required
                  placeholder="Ej: 15€"
                  value={service.price}
                  onChange={(e) => handleServiceChange(index, "price", e.target.value)}
                  className="block w-1/3 rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                />
                {services.length > 1 && (
                  <button type="button" onClick={() => removeServiceField(index)} className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100">✕</button>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 w-full rounded-md bg-black px-4 py-2 font-medium text-white hover:bg-gray-800 disabled:bg-gray-400"
          >
            {saving ? "Guardando perfil..." : "Crear mi barbería"}
          </button>

          {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
        </form>
      </div>
    </main>
  );
}
