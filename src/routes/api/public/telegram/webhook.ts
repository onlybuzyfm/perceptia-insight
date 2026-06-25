import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "crypto";
import type { Database } from "@/integrations/supabase/types";

function deriveWebhookSecret(apiKey: string) {
  return createHash("sha256").update(`telegram-webhook:${apiKey}`).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

async function sendMessage(chatId: number, text: string) {
  const lovableKey = process.env.LOVABLE_API_KEY!;
  const tgKey = process.env.TELEGRAM_API_KEY!;
  await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": tgKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const tgKey = process.env.TELEGRAM_API_KEY;
        if (!tgKey) return new Response("Not configured", { status: 500 });

        const expected = deriveWebhookSecret(tgKey);
        const actual = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(actual, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = await request.json().catch(() => null);
        const message = update?.message ?? update?.edited_message;
        if (!message?.chat?.id) return Response.json({ ok: true });

        const chatId: number = message.chat.id;
        const text: string = message.text ?? "";
        const tgUser: string | null = message.from?.username ?? null;

        const admin = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        // Comando /start CODIGO o /start@bot CODIGO
        const startMatch = text.trim().match(/^\/start(?:@\w+)?(?:\s+([A-Z0-9]{4,12}))?/i);
        if (startMatch) {
          const code = (startMatch[1] || "").toUpperCase().trim();
          if (!code) {
            await sendMessage(
              chatId,
              "👋 <b>Bienvenido a PerceptIA</b>\n\nPara vincular tu cuenta, ve a <i>Ajustes → Notificaciones por Telegram</i> en el portal y envíame:\n\n<code>/start TU_CODIGO</code>",
            );
            return Response.json({ ok: true });
          }
          const { data: profile, error } = await admin
            .from("profiles")
            .select("id, full_name")
            .eq("telegram_link_code", code)
            .maybeSingle();
          if (error || !profile) {
            await sendMessage(chatId, "❌ Código inválido. Verifica en el portal y vuelve a intentar.");
            return Response.json({ ok: true });
          }
          await admin
            .from("profiles")
            .update({
              telegram_chat_id: chatId,
              telegram_username: tgUser,
              telegram_linked_at: new Date().toISOString(),
            })
            .eq("id", profile.id);
          await sendMessage(
            chatId,
            `✅ <b>Cuenta vinculada</b>\nHola ${profile.full_name || "estudiante"}, ya recibirás notificaciones del portal aquí. 🚀`,
          );
          return Response.json({ ok: true });
        }

        // /unlink
        if (/^\/unlink(?:@\w+)?/i.test(text.trim())) {
          await admin
            .from("profiles")
            .update({ telegram_chat_id: null, telegram_username: null, telegram_linked_at: null })
            .eq("telegram_chat_id", chatId);
          await sendMessage(chatId, "🔌 Tu cuenta fue desvinculada. Vuelve a generar un código en el portal para reconectar.");
          return Response.json({ ok: true });
        }

        // Mensaje genérico
        await sendMessage(
          chatId,
          "🤖 Soy el bot de <b>PerceptIA</b>. Usa <code>/start TU_CODIGO</code> para vincular tu cuenta.",
        );
        return Response.json({ ok: true });
      },
    },
  },
});
