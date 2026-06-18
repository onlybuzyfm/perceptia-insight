import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const payloadSchema = z.object({
  targetUserId: z.string().uuid().optional(),
  subject: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(4000),
  notificationType: z.string().min(1).max(80),
  actionUrl: z.string().url().optional(),
  actionText: z.string().max(80).optional(),
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const sendPerceptiaNotificationEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => payloadSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const targetUserId = data.targetUserId ?? userId;

    // Only allow sending to another user if caller is staff
    if (targetUserId !== userId) {
      const { data: isStaff } = await supabase.rpc("is_staff", { _user_id: userId });
      if (!isStaff) throw new Error("Forbidden");
    }

    // Load target profile (use admin client to bypass RLS for this read)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email_secundario, notificaciones_email_activas")
      .eq("id", targetUserId)
      .maybeSingle();

    if (pErr || !profile) {
      return { ok: false, reason: "profile_not_found" as const };
    }
    const to = profile.email_secundario?.trim();
    if (!to) return { ok: false, reason: "missing_secondary_email" as const };
    if (!profile.notificaciones_email_activas) {
      return { ok: false, reason: "notifications_disabled" as const };
    }
    if (!EMAIL_RE.test(to)) return { ok: false, reason: "invalid_email" as const };
    if (!to.toLowerCase().endsWith("@gmail.com")) {
      return { ok: false, reason: "non_gmail_email" as const };
    }

    const webhookUrl = process.env.N8N_EMAIL_WEBHOOK_URL;

    const payload = {
      to,
      userName: profile.full_name || to,
      subject: data.subject,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl ?? null,
      actionText: data.actionText ?? null,
      notificationType: data.notificationType,
      source: "perceptia-portal",
    };

    // Insert log as pendiente
    const { data: log, error: logErr } = await supabaseAdmin
      .from("notification_logs")
      .insert({
        user_id: targetUserId,
        email_destino: to,
        subject: data.subject,
        notification_type: data.notificationType,
        estado_envio: "pendiente",
        payload,
      })
      .select("id")
      .single();
    if (logErr) throw logErr;

    if (!webhookUrl) {
      await supabaseAdmin
        .from("notification_logs")
        .update({
          estado_envio: "error",
          respuesta_webhook: { error: "N8N_EMAIL_WEBHOOK_URL not configured" },
        })
        .eq("id", log.id);
      return { ok: false, reason: "webhook_not_configured" as const, logId: log.id };
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let parsed: unknown = text;
      try { parsed = JSON.parse(text); } catch { /* keep text */ }

      await supabaseAdmin
        .from("notification_logs")
        .update({
          estado_envio: res.ok ? "enviado" : "error",
          respuesta_webhook: { status: res.status, body: parsed },
        })
        .eq("id", log.id);

      return { ok: res.ok, logId: log.id, status: res.status };
    } catch (e) {
      await supabaseAdmin
        .from("notification_logs")
        .update({
          estado_envio: "error",
          respuesta_webhook: { error: e instanceof Error ? e.message : String(e) },
        })
        .eq("id", log.id);
      return { ok: false, reason: "webhook_failed" as const, logId: log.id };
    }
  });
