import { useRef, useState } from "react";
import { Camera, Loader2, Trash2, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AvatarUploaderProps {
  userId: string;
  avatarUrl: string | null;
  onChange: (url: string | null) => void;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "h-16 w-16",
  md: "h-24 w-24",
  lg: "h-32 w-32",
};

const MAX_BYTES = 2 * 1024 * 1024;

export function AvatarUploader({ userId, avatarUrl, onChange, size = "md" }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      return toast.error("Selecciona una imagen válida");
    }
    if (file.size > MAX_BYTES) {
      return toast.error("La imagen debe pesar menos de 2 MB");
    }

    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });

    if (upErr) {
      setBusy(false);
      return toast.error("No se pudo subir la imagen: " + upErr.message);
    }

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { error: updErr } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    setBusy(false);
    if (updErr) {
      return toast.error("Imagen subida pero no se pudo actualizar el perfil: " + updErr.message);
    }
    onChange(publicUrl);
    toast.success("Foto actualizada");
  };

  const handleRemove = async () => {
    if (!avatarUrl) return;
    setBusy(true);
    // Try to delete the file from storage (best-effort)
    const marker = "/avatars/";
    const idx = avatarUrl.indexOf(marker);
    if (idx >= 0) {
      const path = avatarUrl.slice(idx + marker.length);
      await supabase.storage.from("avatars").remove([path]);
    }
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
    setBusy(false);
    if (error) return toast.error(error.message);
    onChange(null);
    toast.success("Foto eliminada");
  };

  return (
    <div className="flex items-center gap-4">
      <div className={`relative ${SIZES[size]} overflow-hidden rounded-full border border-border/60 bg-primary-soft text-primary`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UserIcon className="h-1/2 w-1/2" />
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
        <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
          <Camera className="mr-1.5 h-3.5 w-3.5" /> {avatarUrl ? "Cambiar foto" : "Subir foto"}
        </Button>
        {avatarUrl && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleRemove}
            disabled={busy}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Eliminar
          </Button>
        )}
        <p className="text-[11px] text-muted-foreground">JPG, PNG, WEBP o GIF. Máx 2 MB.</p>
      </div>
    </div>
  );
}
