import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_announcements",
  title: "Anuncios recientes",
  description: "Lista los anuncios vigentes del portal PerceptIA visibles para el usuario conectado.",
  inputSchema: {
    limit: z.number().int().optional().describe("Cantidad máxima de anuncios (por defecto 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const take = Math.min(Math.max(limit ?? 10, 1), 50);

    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, content, audience, created_at")
      .order("created_at", { ascending: false })
      .limit(take);

    if (error) return fail(error.message);
    return ok(data ?? []);
  },
});
