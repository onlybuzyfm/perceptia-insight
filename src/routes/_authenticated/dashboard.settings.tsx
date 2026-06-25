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
import { KeyRound, Mail, Send, CheckCircle2, Copy, Unlink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useServerFn } from "@tanstack/react-start";
import {
  getOrCreateMyTelegramLinkCode,
  unlinkMyTelegram,
  sendMyTelegramTest,
} from "@/lib/telegram.functions";

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

  // Telegram state
  const fnGetLinkCode = useServerFn(getOrCreateMyTelegramLinkCode);
  const fnUnlink = useServerFn(unlinkMyTelegram);
  const fnTest = useServerFn(sendMyTelegramTest);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgCode, setTgCode] = useState<string | null>(null);
  const [tgBot, setTgBot] = useState<string | null>(null);
  const [tgChatId, setTgChatId] = useState<number | null>(null);
  const [tgUsername, setTgUsername] = useState<string | null>(null);
  const [tgNotify, setTgNotify] = useState(true);
  const [tgSavingNotify, setTgSavingNotify] = useState(false);
  const [polling, setPolling] = useState(false);

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

  const loadTelegram = async () => {
    setTgLoading(true);
    try {
      const res = await fnGetLinkCode();
      setTgCode(res.code);
      setTgBot(res.botUsername);
      setTgChatId(res.chatId);
      setTgUsername(res.telegramUsername);
      setTgNotify(res.notifyTelegram);
    } catch (e) {
      toast.error("No se pudo cargar Telegram: " + (e instanceof Error ? e.message : ""));
    } finally {
      setTgLoading(false);
    }
  };

  useEffect(() => {
    if (auth.user) loadTelegram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user]);

  // Polling cuando el usuario está esperando vincular
  useEffect(() => {
    if (!polling || tgChatId || !auth.user) return;
    const t = setInterval(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("telegram_chat_id, telegram_username")
        .eq("id", auth.user!.id)
        .maybeSingle();
      if (data?.telegram_chat_id) {
        setTgChatId(Number(data.telegram_chat_id));
        setTgUsername(data.telegram_username);
        setPolling(false);
        toast.success("¡Telegram vinculado!");
      }
    }, 3000);
    return () => clearInterval(t);
  }, [polling, tgChatId, auth.user]);

  const copyCode = async () => {
    if (!tgCode) return;
    await navigator.clipboard.writeText(`/start ${tgCode}`);
    toast.success("Comando copiado");
  };

  const openBot = () => {
    if (!tgBot || !tgCode) return;
    window.open(`https://t.me/${tgBot}?start=${tgCode}`, "_blank");
    setPolling(true);
  };

  const handleUnlink = async () => {
    if (!confirm("¿Desvincular tu Telegram?")) return;
    await fnUnlink();
    setTgChatId(null);
    setTgUsername(null);
    toast.success("Telegram desvinculado");
  };

  const handleTest = async () => {
    const res = await fnTest();
    if (res.ok) toast.success("Mensaje de prueba enviado");
    else toast.error("No se pudo enviar (" + (res.reason ?? "error") + ")");
  };

  const toggleTgNotify = async (val: boolean) => {
    if (!auth.user) return;
    setTgSavingNotify(true);
    const { error } = await supabase
      .from("profiles")
      .update({ notify_telegram: val })
      .eq("id", auth.user.id);
    setTgSavingNotify(false);
    if (error) { toast.error("No se pudo guardar"); return; }
    setTgNotify(val);
    toast.success("Preferencia actualizada");
  };

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
      <Card className="mt-6 border-border/70 p-6">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">Notificaciones por correo</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Registra un correo secundario (preferentemente Gmail) para recibir avisos importantes del portal.
        </p>
        <div className="mt-4 grid gap-4 sm:max-w-md">
          <div>
            <Label className="text-muted-foreground">Correo secundario</Label>
            <Input
              type="email"
              className="mt-1.5"
              value={emailSecundario}
              onChange={(e) => setEmailSecundario(e.target.value)}
              placeholder="tu.correo@gmail.com"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Activar notificaciones</p>
              <p className="text-xs text-muted-foreground">Recibirás avisos automáticos en tu correo secundario.</p>
            </div>
            <Switch checked={notifActivas} onCheckedChange={setNotifActivas} />
          </div>
          <Button onClick={saveEmailPrefs} disabled={savingEmail}>
            {savingEmail ? "Guardando..." : "Guardar preferencias"}
          </Button>
        </div>
      </Card>
    </DashboardShell>
  );
}
