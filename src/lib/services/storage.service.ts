import { supabase } from "../supabase";
import imageCompression from "browser-image-compression";

export const storageService = {
  async uploadImage(file: File, bucket: string, path: string) {
    // 1. Validaciones básicas de seguridad en el cliente
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error("El archivo seleccionado no es una imagen válida (debe ser JPEG, PNG, WEBP o GIF).");
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw new Error("La imagen supera el tamaño máximo permitido de 5 MB.");
    }

    const options = {
      maxSizeMB: 0.1,
      maxWidthOrHeight: 1080,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, compressedFile, {
          cacheControl: "3600",
          upsert: true // Evita duplicar o fallar por conflicto si ya existe
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Error in storageService.uploadImage:", error);
      throw error;
    }
  },

  generateFileName(id: string, file: File) {
    const ext = file.name.split(".").pop();
    return `${id}-${Date.now()}.${ext}`;
  }
};
