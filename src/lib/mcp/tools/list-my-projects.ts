import { defineTool } from "@lovable.dev/mcp-js";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_my_projects",
  title: "Mis proyectos",
  description: "Lista los proyectos del semillero PerceptIA visibles para el usuario conectado.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);

    const { data: memberships } = await supabase
      .from("project_members")
      .select("project_id, role_in_project")
      .eq("user_id", ctx.getUserId()!);

    const myIds = new Set((memberships ?? []).map((m) => m.project_id));

    const { data, error } = await supabase
      .from("projects")
      .select("id, title, slug, description, status, line, is_published, updated_at")
      .order("updated_at", { ascending: false });

    if (error) return fail(error.message);

    return ok(
      (data ?? []).map((p) => ({ ...p, is_member: myIds.has(p.id) })),
    );
  },
});
