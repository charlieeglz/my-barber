import { supabase } from "../supabase";
import imageCompression from "browser-image-compression";

export const storageService = {
  async uploadImage(file: File, bucket: string, path: string) {
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
          upsert: true
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
