"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { barberService, StaffMember } from "@/lib/services/barber.service";
import { storageService } from "@/lib/services/storage.service";
import Link from "next/link";
import Image from "next/image";

export default function TeamManagement() {
  const { user, profile, loading: authLoading } = useAuth("barber");
  const router = useRouter();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  
  // Form state for staff member (new or edit)
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"barber" | "owner">("barber");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const startAdding = () => {
    setEditingMember(null);
    setIsAdding(true);
    setNewName("");
    setNewRole("barber");
    setAvatarFile(null);
    setAvatarPreview("");
    setError("");
  };

  const startEditing = (member: StaffMember) => {
    setIsAdding(false);
    setEditingMember(member);
    setNewName(member.name);
    setNewRole(member.role);
    setAvatarFile(null);
    setAvatarPreview(member.avatar_url || "");
    setError("");
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingMember(null);
    setNewName("");
    setNewRole("barber");
    setAvatarFile(null);
    setAvatarPreview("");
    setError("");
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.staffInfo || !user) return;

    setError("");
    setSaving(true);

    try {
      let avatarUrl = null;
      if (avatarFile) {
        try {
          const path = `${user.id}/staff/${storageService.generateFileName("staff-avatar", avatarFile)}`;
          avatarUrl = await storageService.uploadImage(avatarFile, "portfolio", path);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "desconocido";
          throw new Error(`Error al subir la foto de perfil: ${errMsg}`);
        }
      }

      const newMember = await barberService.addStaffMember({
        barbershop_id: profile.staffInfo.barbershop_id,
        user_id: null,
        name: newName,
        avatar_url: avatarUrl,
        role: newRole,
      });

      setStaff((prev) => [...prev, newMember]);
      
      await barberService.updateBarbershop(profile.staffInfo.barbershop_id, {
        num_barbers: staff.length + 1
      });

      handleCancel();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al añadir miembro";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.staffInfo || !editingMember || !user) return;

    setError("");
    setSaving(true);

    try {
      let avatarUrl = editingMember.avatar_url;
      if (avatarFile) {
        try {
          const path = `${user.id}/staff/${storageService.generateFileName("staff-avatar", avatarFile)}`;
          avatarUrl = await storageService.uploadImage(avatarFile, "portfolio", path);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "desconocido";
          throw new Error(`Error al subir la foto de perfil: ${errMsg}`);
        }
      }

      const updated = await barberService.updateStaffMember(editingMember.id, {
        name: newName,
        role: newRole,
        avatar_url: avatarUrl,
      });

      setStaff((prev) =>
        prev.map((m) => (m.id === editingMember.id ? updated : m))
      );

      handleCancel();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al actualizar miembro";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!profile?.staffInfo) return;
    if (memberId === profile.staffInfo.id) {
      alert("No puedes eliminarte a ti mismo.");
      return;
    }
    if (!confirm("¿Estás seguro de que deseas eliminar a este miembro del equipo?")) {
      return;
    }

    try {
      await barberService.deleteStaffMember(memberId);
      const updatedStaff = staff.filter((m) => m.id !== memberId);
      setStaff(updatedStaff);
      
      await barberService.updateBarbershop(profile.staffInfo.barbershop_id, {
        num_barbers: updatedStaff.length
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al eliminar miembro";
      alert(message);
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
          {!isAdding && !editingMember && (
            <button
              onClick={startAdding}
              className="group flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>+ Añadir Barbero</span>
            </button>
          )}
        </div>

        {(isAdding || editingMember) && (
          <div className="mb-12 rounded-3xl border border-border bg-secondary/30 p-8 shadow-2xl backdrop-blur-sm">
            <h2 className="mb-6 text-xl font-black text-foreground">
              {isAdding ? "Nuevo Profesional" : `Editar Profesional: ${editingMember?.name}`}
            </h2>
            <form onSubmit={isAdding ? handleAddMember : handleEditMember} className="flex flex-col gap-6 md:grid md:grid-cols-12 md:items-start">
              
              {/* Selector de Foto de Perfil */}
              <div className="md:col-span-3 flex flex-col items-center gap-3">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground w-full text-center md:text-left">
                  Foto de Perfil
                </label>
                <div className="relative group/avatar h-28 w-28 overflow-hidden rounded-full border-2 border-border bg-background shadow-inner cursor-pointer">
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="Vista previa" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-black text-muted-foreground bg-secondary/30">
                      {newName ? newName.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                  <label htmlFor="avatar-file-input" className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                    <CameraIcon className="h-6 w-6 text-white" />
                    <span className="text-[10px] text-white font-bold mt-1">Subir Foto</span>
                  </label>
                </div>
                <input
                  type="file"
                  id="avatar-file-input"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                {avatarFile && (
                  <button 
                    type="button" 
                    onClick={() => { setAvatarFile(null); setAvatarPreview(editingMember?.avatar_url || ""); }}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold"
                  >
                    Quitar foto
                  </button>
                )}
              </div>

              {/* Campos de Formulario */}
              <div className="md:col-span-9 grid grid-cols-1 gap-6 md:grid-cols-12">
                <div className="md:col-span-7 space-y-1.5">
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
                <div className="md:col-span-5 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rol asignado</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as "barber" | "owner")}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                  >
                    <option value="barber">Barbero</option>
                    <option value="owner">Dueño / Admin</option>
                  </select>
                </div>
                
                {/* Botones */}
                <div className="md:col-span-12 flex gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 md:flex-initial md:px-8 rounded-xl bg-primary py-3 font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-xl border border-border bg-background px-6 py-3 text-sm font-bold text-muted-foreground transition-all hover:border-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
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
              className="group relative flex items-center justify-between gap-5 rounded-3xl border border-border bg-secondary/30 p-6 transition-all hover:border-primary/50 hover:bg-secondary shadow-lg shadow-black/5"
            >
              <div className="flex items-center gap-5">
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-border bg-background shadow-inner flex-shrink-0">
                  {member.avatar_url ? (
                    <Image src={member.avatar_url} alt={member.name} fill className="object-cover transition-transform group-hover:scale-110" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-black text-muted-foreground bg-secondary/50">
                      {member.name.charAt(0).toUpperCase()}
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
              
              {/* Botones de acción */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => startEditing(member)}
                  title="Editar barbero"
                  className="p-2 rounded-xl border border-border bg-background text-muted-foreground hover:text-primary hover:border-primary/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <EditIcon className="h-4 w-4" />
                </button>
                {member.id !== profile?.staffInfo?.id && (
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    title="Eliminar barbero"
                    className="p-2 rounded-xl border border-border bg-background text-muted-foreground hover:text-red-400 hover:border-red-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
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

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9 9m12-3a29.97 29.97 0 0 1-18 0m18 0a2.25 2.25 0 0 0-2.25-2.25h-3.879a2.25 2.25 0 0 0-1.591.659l-.752.752c-.426.426-.984.659-1.591.659H7.88a2.25 2.25 0 0 0-1.591-.659l-.752-.752M3 6h18m-1.5 0-1.855 12.986A2.25 2.25 0 0 1 15.402 21H8.598a2.25 2.25 0 0 1-2.243-2.014L4.5 6h15Z" />
    </svg>
  );
}
