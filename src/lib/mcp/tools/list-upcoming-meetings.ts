import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_upcoming_meetings",
  title: "Próximas reuniones",
  description: "Lista las próximas reuniones del semillero PerceptIA visibles para el usuario conectado.",
  inputSchema: {
    limit: z.number().int().optional().describe("Cantidad máxima de reuniones (por defecto 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const take = Math.min(Math.max(limit ?? 10, 1), 50);

    const { data, error } = await supabase
      .from("meetings")
      .select("id, title, description, meeting_date, location, research_line_id")
      .gte("meeting_date", new Date().toISOString())
      .order("meeting_date", { ascending: true })
      .limit(take);

    if (error) return fail(error.message);
    return ok(data ?? []);
  },
});
