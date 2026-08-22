import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_my_activities",
  title: "Mis actividades",
  description:
    "Lista las actividades de los proyectos del usuario conectado, con su fecha límite y estado. Permite filtrar por estado.",
  inputSchema: {
    status: z
      .enum(["pendiente", "en_progreso", "completada", "todas"])
      .optional()
      .describe("Filtro de estado. Por defecto: todas."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);

    let query = supabase
      .from("project_activities")
      .select("id, title, description, deadline, status, project_id, projects(title)")
      .order("deadline", { ascending: true });

    if (status && status !== "todas") {
      query = query.eq("status", status as "pendiente" | "en_progreso" | "completada");
    }

    const { data, error } = await query;
    if (error) return fail(error.message);
    return ok(data ?? []);
  },
});
