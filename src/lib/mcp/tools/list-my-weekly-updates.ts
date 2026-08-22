import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_my_weekly_updates",
  title: "Mis avances semanales",
  description: "Lista los avances semanales registrados por el usuario conectado, del más reciente al más antiguo.",
  inputSchema: {
    limit: z.number().int().optional().describe("Cantidad máxima de avances a devolver (por defecto 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const take = Math.min(Math.max(limit ?? 20, 1), 100);

    const { data, error } = await supabase
      .from("weekly_updates")
      .select(
        "id, week_start, summary, achievements, blockers, hours_spent, repo_url, evidence_url, project_id, activity_id, created_at",
      )
      .eq("user_id", ctx.getUserId()!)
      .order("week_start", { ascending: false })
      .limit(take);

    if (error) return fail(error.message);
    return ok(data ?? []);
  },
});
