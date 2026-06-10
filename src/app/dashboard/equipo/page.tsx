"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { barberService, StaffMember } from "@/lib/services/barber.service";
import Link from "next/link";
import Image from "next/image";

export default function TeamManagement() {
  const { user, profile, loading: authLoading } = useAuth("barber");
  const router = useRouter();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state for new staff member
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"barber" | "owner">("barber");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchStaff() {
      if (!profile?.staffInfo) return;
      try {
        const data = await barberService.getStaffByBarbershop(profile.staffInfo.barbershop_id);
        setStaff(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && profile) {
      if (profile.staffInfo?.role !== "owner") {
        router.push("/dashboard");
        return;
      }
      fetchStaff();
    }
  }, [profile, authLoading, router]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.staffInfo) return;

    setError("");
    setSaving(true);

    try {
      const newMember = await barberService.addStaffMember({
        barbershop_id: profile.staffInfo.barbershop_id,
        user_id: null, // Initial staff members don't have a user account linked yet
        name: newName,
        avatar_url: null,
        role: newRole,
      });

      setStaff((prev) => [...prev, newMember]);
      
      // Actualizar el contador en la barbería
      await barberService.updateBarbershop(profile.staffInfo.barbershop_id, {
        num_barbers: staff.length + 1
      });

      setNewName("");
      setIsAdding(false);
    } catch (err: any) {
      setError(err.message || "Error al añadir miembro");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="font-medium text-gray-500">Cargando equipo...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-black">
              ← Volver al Panel
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
              Gestión de Equipo
            </h1>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Añadir Barbero
            </button>
          )}
        </div>

        {isAdding && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Nuevo Miembro</h2>
            <form onSubmit={handleAddMember} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Nombre</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Carlos G."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Rol</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                >
                  <option value="barber">Barbero</option>
                  <option value="owner">Dueño / Admin</option>
                </select>
              </div>
              <div className="flex items-end gap-2 sm:col-span-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-black py-2 text-sm font-bold text-white hover:bg-gray-800 disabled:bg-gray-400"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <div key={member.id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gray-100">
                {member.avatar_url ? (
                  <Image src={member.avatar_url} alt={member.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-300">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{member.name}</h3>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  {member.role === "owner" ? "Dueño / Admin" : "Barbero"}
                </p>
                {member.user_id && (
                  <span className="mt-1 inline-block rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600">
                    Cuenta vinculada
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
