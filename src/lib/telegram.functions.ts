import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

function telegramHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const tgKey = process.env.TELEGRAM_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY no configurado");
  if (!tgKey) throw new Error("TELEGRAM_API_KEY no configurado");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": tgKey,
    "Content-Type": "application/json",
  };
}

async function callTelegram(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${GATEWAY_URL}/${method}`, {
    method: "POST",
    headers: telegramHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: any = text;
  try { parsed = JSON.parse(text); } catch { /* keep text */ }
  if (!res.ok || (parsed && parsed.ok === false)) {
    throw new Error(`Telegram ${method} falló [${res.status}]: ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`);
  }
  return parsed;
}

function genLinkCode() {
  // 6 chars uppercase alfanum
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/** Genera (o regenera) el código de vinculación del usuario actual. */
export const getOrCreateMyTelegramLinkCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("telegram_link_code, telegram_chat_id, telegram_username, telegram_linked_at, notify_telegram")
      .eq("id", context.userId)
      .maybeSingle();

    let code = profile?.telegram_link_code ?? null;
    if (!code) {
      // intentar generar uno único
      for (let i = 0; i < 5; i++) {
        const candidate = genLinkCode();
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ telegram_link_code: candidate })
          .eq("id", context.userId);
        if (!error) { code = candidate; break; }
      }
      if (!code) throw new Error("No se pudo generar código");
    }

    const me = await callTelegram("getMe", {}).catch(() => null);
    const botUsername: string | null = me?.result?.username ?? null;

    return {
      code,
      botUsername,
      chatId: profile?.telegram_chat_id ?? null,
      telegramUsername: profile?.telegram_username ?? null,
      linkedAt: profile?.telegram_linked_at ?? null,
      notifyTelegram: profile?.notify_telegram ?? true,
    };
  });

/** Desvincula la cuenta de Telegram del usuario actual. */
export const unlinkMyTelegram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        telegram_chat_id: null,
        telegram_username: null,
        telegram_linked_at: null,
      })
      .eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

/** Envía un mensaje de prueba al chat vinculado del usuario actual. */
export const sendMyTelegramTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("telegram_chat_id, full_name, notify_telegram")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile?.telegram_chat_id) return { ok: false, reason: "not_linked" as const };
    const name = profile.full_name || "estudiante";
    const text = `✅ <b>PerceptIA</b>\nHola ${escapeHtml(name)}, este es un mensaje de prueba. Tu cuenta está conectada correctamente. 🚀`;
    try {
      await callTelegram("sendMessage", {
        chat_id: profile.telegram_chat_id,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
      await supabaseAdmin.from("telegram_notification_logs").insert({
        user_id: context.userId,
        chat_id: profile.telegram_chat_id,
        kind: "test",
        status: "sent",
        message: text,
      });
      return { ok: true };
    } catch (e) {
      await supabaseAdmin.from("telegram_notification_logs").insert({
        user_id: context.userId,
        chat_id: profile.telegram_chat_id,
        kind: "test",
        status: "error",
        message: text,
        error: e instanceof Error ? e.message : String(e),
      });
      return { ok: false, reason: "send_failed" as const };
    }
  });

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

/**
 * Envía notificación a un usuario (admin/staff) o al propio usuario.
 * Respeta notify_telegram. Usa silenciosamente si no está vinculado.
 */
const notifySchema = z.object({
  targetUserId: z.string().uuid().optional(),
  kind: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(3500),
  url: z.string().url().optional(),
});

export const sendTelegramNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => notifySchema.parse(input))
  .handler(async ({ data, context }) => {
    const targetUserId = data.targetUserId ?? context.userId;
    if (targetUserId !== context.userId) {
      const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
      if (!isStaff) throw new Error("Forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("telegram_chat_id, notify_telegram")
      .eq("id", targetUserId)
      .maybeSingle();
    if (!profile?.telegram_chat_id) return { ok: false, reason: "not_linked" as const };
    if (!profile.notify_telegram) return { ok: false, reason: "disabled" as const };

    const text =
      `🔔 <b>${escapeHtml(data.title)}</b>\n\n${escapeHtml(data.body)}` +
      (data.url ? `\n\n🔗 ${data.url}` : "");

    try {
      await callTelegram("sendMessage", {
        chat_id: profile.telegram_chat_id,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      });
      await supabaseAdmin.from("telegram_notification_logs").insert({
        user_id: targetUserId,
        chat_id: profile.telegram_chat_id,
        kind: data.kind,
        status: "sent",
        message: text,
      });
      return { ok: true };
    } catch (e) {
      await supabaseAdmin.from("telegram_notification_logs").insert({
        user_id: targetUserId,
        chat_id: profile.telegram_chat_id,
        kind: data.kind,
        status: "error",
        message: text,
        error: e instanceof Error ? e.message : String(e),
      });
      return { ok: false, reason: "send_failed" as const };
    }
  });

/**
 * Broadcast a todos los estudiantes vinculados (solo staff).
 */
const broadcastSchema = z.object({
  kind: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(3500),
  url: z.string().url().optional(),
  onlyRole: z.enum(["estudiante", "docente_asociado", "coordinador", "admin"]).optional(),
});

export const broadcastTelegram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => broadcastSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let userIds: string[] | null = null;
    if (data.onlyRole) {
      const { data: roleRows } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", data.onlyRole);
      userIds = (roleRows ?? []).map((r: any) => r.user_id);
      if (userIds.length === 0) return { ok: true, sent: 0, failed: 0 };
    }

    let query = supabaseAdmin
      .from("profiles")
      .select("id, telegram_chat_id, notify_telegram")
      .not("telegram_chat_id", "is", null)
      .eq("notify_telegram", true);
    if (userIds) query = query.in("id", userIds);
    const { data: profiles } = await query;

    const text =
      `🔔 <b>${escapeHtml(data.title)}</b>\n\n${escapeHtml(data.body)}` +
      (data.url ? `\n\n🔗 ${data.url}` : "");

    let sent = 0, failed = 0;
    for (const p of profiles ?? []) {
      try {
        await callTelegram("sendMessage", {
          chat_id: p.telegram_chat_id,
          text,
          parse_mode: "HTML",
        });
        sent++;
        await supabaseAdmin.from("telegram_notification_logs").insert({
          user_id: p.id, chat_id: p.telegram_chat_id, kind: data.kind, status: "sent", message: text,
        });
      } catch (e) {
        failed++;
        await supabaseAdmin.from("telegram_notification_logs").insert({
          user_id: p.id, chat_id: p.telegram_chat_id, kind: data.kind, status: "error",
          message: text, error: e instanceof Error ? e.message : String(e),
        });
      }
    }
    return { ok: true, sent, failed };
  });

/**
 * Publica un aviso en TODOS los grupos de Telegram registrados (solo staff).
 */
const groupBroadcastSchema = z.object({
  kind: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(3500),
  url: z.string().url().optional(),
});

export const broadcastTelegramToGroups = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => groupBroadcastSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: groups } = await supabaseAdmin
      .from("telegram_groups")
      .select("chat_id")
      .eq("is_active", true);

    const text =
      `📣 <b>${escapeHtml(data.title)}</b>\n\n${escapeHtml(data.body)}` +
      (data.url ? `\n\n🔗 ${data.url}` : "");

    let sent = 0, failed = 0;
    for (const g of groups ?? []) {
      try {
        await callTelegram("sendMessage", {
          chat_id: g.chat_id,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: false,
        });
        sent++;
        await supabaseAdmin.from("telegram_notification_logs").insert({
          user_id: null, chat_id: g.chat_id, kind: `group:${data.kind}`, status: "sent", message: text,
        });
      } catch (e) {
        failed++;
        await supabaseAdmin.from("telegram_notification_logs").insert({
          user_id: null, chat_id: g.chat_id, kind: `group:${data.kind}`, status: "error",
          message: text, error: e instanceof Error ? e.message : String(e),
        });
      }
    }
    return { ok: true, sent, failed };
  });
