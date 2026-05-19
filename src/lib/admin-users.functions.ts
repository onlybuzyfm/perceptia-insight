import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export const deleteUserCompletely = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = data;
    const { userId: callerId, supabase } = context;

    if (userId === callerId) {
      throw new Error("No puedes eliminarte a ti mismo.");
    }

    // Verify caller is admin (RLS-scoped query as the user)
    const { data: roles, error: rolesErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    if (rolesErr) throw new Error(rolesErr.message);
    if (!roles?.some((r) => r.role === "admin")) {
      throw new Error("Solo administradores pueden eliminar usuarios.");
    }

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("No se pudo acceder a las credenciales administrativas del backend.");
    }

    const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Cleanup related rows first (no FK cascade defined)
    await supabaseAdmin.from("project_members").delete().eq("user_id", userId);
    await supabaseAdmin.from("team_members").delete().eq("user_id", userId);
    await supabaseAdmin.from("weekly_updates").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    // Best-effort: remove avatar files
    const { data: files } = await supabaseAdmin.storage.from("avatars").list(userId);
    if (files?.length) {
      await supabaseAdmin.storage
        .from("avatars")
        .remove(files.map((f) => `${userId}/${f.name}`));
    }

    // Delete auth user (this is the destructive step)
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authErr) throw new Error(authErr.message);

    return { ok: true };
  });
