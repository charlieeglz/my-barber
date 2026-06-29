"use client";

import { useState } from "react";
import { reviewService, CreateReviewData } from "@/lib/services/review.service";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appointmentId: string) => void;
  appointmentId: string;
  barbershopId: string;
  staffId: string | null;
  staffName?: string;
  barbershopName?: string;
  clientId: string;
};

export function ReviewModal({
  isOpen,
  onClose,
  onSuccess,
  appointmentId,
  barbershopId,
  staffId,
  staffName,
  barbershopName,
  clientId,
}: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Por favor, selecciona una puntuación.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const reviewData: CreateReviewData = {
        appointment_id: appointmentId,
        barbershop_id: barbershopId,
        staff_id: staffId,
        client_id: clientId,
        rating,
        comment: comment.trim() || undefined,
      };
      await reviewService.create(reviewData);
      onSuccess(appointmentId);
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar la reseña. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels: Record<number, string> = {
    1: "Muy malo",
    2: "Malo",
    3: "Regular",
    4: "Bueno",
    5: "Excelente",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-secondary/80 shadow-2xl backdrop-blur-md">
        {/* Glow decoration */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

        <div className="p-8">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Tu reseña
              </h2>
              {barbershopName && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {barbershopName}
                  {staffName && (
                    <span className="text-primary"> · {staffName}</span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-all hover:text-foreground"
              aria-label="Cerrar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Puntuación
              </p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110 active:scale-95"
                    aria-label={`${star} estrellas`}
                  >
                    <StarIcon
                      className="h-9 w-9"
                      filled={(hovered || rating) >= star}
                    />
                  </button>
                ))}
                {(hovered || rating) > 0 && (
                  <span className="ml-2 text-sm font-bold text-primary">
                    {ratingLabels[hovered || rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label
                htmlFor="review-comment"
                className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >
                Comentario{" "}
                <span className="normal-case font-normal">(opcional)</span>
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Cuéntanos tu experiencia..."
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {comment.length}/500
              </p>
            </div>

            {error && (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-border bg-background py-3 text-sm font-bold text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || rating === 0}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Guardando...
                  </span>
                ) : (
                  "Publicar reseña"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function StarIcon({
  className,
  filled,
}: {
  className?: string;
  filled: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke={filled ? "transparent" : "currentColor"}
      fill={filled ? "currentColor" : "none"}
      className={`${className} ${filled ? "text-primary" : "text-border"}`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
      />
    </svg>
  );
}
