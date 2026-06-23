import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Endpoint temporal: crea un estudiante de prueba.
// Protegido con un token simple en el header `x-seed-token`.
const SEED_TOKEN = "perceptia-seed-2026";

export const Route = createFileRoute("/api/public/seed-test-student")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get("x-seed-token") !== SEED_TOKEN) {
          return new Response("Unauthorized", { status: 401 });
        }
        const url = process.env.SUPABASE_URL!;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const admin = createClient<Database>(url, key, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });

        const email = "estudiante.prueba@perceptia.test";
        const password = "Prueba1234!";

        // Crear usuario auth (email confirmado)
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: "Estudiante Prueba", username: "estudiante.prueba" },
        });
        if (createErr && !createErr.message.toLowerCase().includes("already")) {
          return new Response(JSON.stringify({ error: createErr.message }), { status: 500 });
        }
        let userId = created?.user?.id;
        if (!userId) {
          const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
          userId = list?.users.find((u) => u.email === email)?.id;
        }
        if (!userId) return new Response("No user id", { status: 500 });

        // Actualizar perfil con datos completos
        await admin.from("profiles").update({
          full_name: "Estudiante Prueba",
          username: "estudiante.prueba",
          carrera: "Ingeniería en Software",
          semestre: "5",
          paralelo: "A",
          codigo_estudiantil: "TEST-0001",
          email_secundario: "estudiante.prueba@gmail.com",
          notificaciones_email_activas: true,
          is_active: true,
        }).eq("id", userId);

        // Asegurar rol estudiante
        await admin.from("user_roles").insert({ user_id: userId, role: "estudiante" as never });

        return new Response(JSON.stringify({ ok: true, email, password, userId }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
