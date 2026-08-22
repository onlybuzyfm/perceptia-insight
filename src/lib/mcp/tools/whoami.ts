import { defineTool } from "@lovable.dev/mcp-js";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "whoami",
  title: "Mi perfil",
  description: "Devuelve el perfil y los roles del usuario conectado en el portal PerceptIA.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const [{ data: profile, error }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, username, carrera, semestre, avatar_url, research_line_id")
        .eq("id", userId!)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId!),
    ]);

    if (error) return fail(error.message);
    return ok({ profile, roles: (roles ?? []).map((r) => r.role), email: ctx.getUserEmail() });
  },
});
