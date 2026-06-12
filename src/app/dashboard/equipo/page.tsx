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
        user_id: null,
        name: newName,
        avatar_url: null,
        role: newRole,
      });

      setStaff((prev) => [...prev, newMember]);
      
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary">
              <ArrowLeftIcon className="h-4 w-4" />
              Volver al Panel
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
              Gestión de <span className="text-primary">Equipo</span>
            </h1>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="group flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>+ Añadir Barbero</span>
            </button>
          )}
        </div>

        {isAdding && (
          <div className="mb-12 rounded-3xl border border-border bg-secondary/30 p-8 shadow-2xl backdrop-blur-sm">
            <h2 className="mb-6 text-xl font-black text-foreground">Nuevo Profesional</h2>
            <form onSubmit={handleAddMember} className="grid grid-cols-1 gap-6 md:grid-cols-12">
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nombre del barbero</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Carlos G."
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rol asignado</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value="barber">Barbero</option>
                  <option value="owner">Dueño / Admin</option>
                </select>
              </div>
              <div className="flex items-end gap-3 md:col-span-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-primary py-3 font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="rounded-xl border border-border bg-background px-6 py-3 text-sm font-bold text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>
            </form>
            {error && (
              <div className="mt-6 rounded-lg bg-red-500/10 p-3 text-center text-xs font-medium text-red-400 border border-red-500/20">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <div 
              key={member.id} 
              className="group flex items-center gap-5 rounded-3xl border border-border bg-secondary/30 p-6 transition-all hover:border-primary/50 hover:bg-secondary shadow-lg shadow-black/5"
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-border bg-background shadow-inner">
                {member.avatar_url ? (
                  <Image src={member.avatar_url} alt={member.name} fill className="object-cover transition-transform group-hover:scale-110" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-black text-muted-foreground">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">{member.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                  {member.role === "owner" ? "Dueño / Admin" : "Barbero Profesional"}
                </p>
                {member.user_id && (
                  <div className="mt-2 flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-bold text-primary">Cuenta vinculada</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
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
