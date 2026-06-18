import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardShell } from "@/components/DashboardShell";
import { AvatarUploader } from "@/components/AvatarUploader";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const auth = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [emailSecundario, setEmailSecundario] = useState("");
  const [notifActivas, setNotifActivas] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    if (!auth.user) return;
    supabase
      .from("profiles")
      .select("avatar_url, email_secundario, notificaciones_email_activas")
      .eq("id", auth.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setAvatarUrl(data?.avatar_url ?? null);
        setEmailSecundario(data?.email_secundario ?? "");
        setNotifActivas(data?.notificaciones_email_activas ?? false);
        setLoading(false);
      });
  }, [auth.user]);

  const saveEmailPrefs = async () => {
    if (!auth.user) return;
    const trimmed = emailSecundario.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Correo inválido");
      return;
    }
    if (trimmed && notifActivas && !trimmed.toLowerCase().endsWith("@gmail.com")) {
      toast.error("Por ahora solo se admiten correos @gmail.com para notificaciones");
      return;
    }
    setSavingEmail(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        email_secundario: trimmed || null,
        notificaciones_email_activas: notifActivas && !!trimmed,
      })
      .eq("id", auth.user.id);
    setSavingEmail(false);
    if (error) {
      toast.error("No se pudo guardar: " + error.message);
      return;
    }
    toast.success("Preferencias de correo guardadas");
  };

  const changePassword = async () => {
    if (pwd.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (pwd !== pwd2) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSavingPwd(false);
    if (error) {
      toast.error("No se pudo actualizar: " + error.message);
      return;
    }
    setPwd("");
    setPwd2("");
    toast.success("Contraseña actualizada");
  };

  return (
    <DashboardShell title="Ajustes">
      <Card className="border-border/70 p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Foto de perfil</h2>
        <p className="mt-1 text-xs text-muted-foreground">Tu avatar se muestra en el portal y en la sección pública de integrantes.</p>
        <div className="mt-5">
          {loading || !auth.user ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <AvatarUploader
              userId={auth.user.id}
              avatarUrl={avatarUrl}
              onChange={(url) => setAvatarUrl(url)}
            />
          )}
        </div>
      </Card>

      <Card className="mt-6 border-border/70 p-6">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">Cambiar contraseña</h2>
        </div>
        <div className="mt-4 grid gap-4 sm:max-w-md">
          <div>
            <Label className="text-muted-foreground">Nueva contraseña</Label>
            <Input
              type="password"
              className="mt-1.5"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <Label className="text-muted-foreground">Confirmar contraseña</Label>
            <Input
              type="password"
              className="mt-1.5"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
            />
          </div>
          <Button onClick={changePassword} disabled={savingPwd || !pwd}>
            {savingPwd ? "Guardando..." : "Actualizar contraseña"}
          </Button>
        </div>
      </Card>
    </DashboardShell>
  );
}
