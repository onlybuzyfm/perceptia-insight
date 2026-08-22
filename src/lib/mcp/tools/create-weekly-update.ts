import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "create_weekly_update",
  title: "Registrar avance semanal",
  description:
    "Registra un avance semanal del usuario conectado para un proyecto y una actividad asignada. La semana debe indicarse en formato YYYY-MM-DD (lunes de la semana).",
  inputSchema: {
    week_start: z.string().describe("Lunes de la semana en formato YYYY-MM-DD."),
    summary: z.string().describe("Resumen del avance de la semana."),
    project_id: z.string().describe("UUID del proyecto al que pertenece el avance."),
    activity_id: z.string().describe("UUID de la actividad del proyecto asociada al avance."),
    achievements: z.string().optional().describe("Logros de la semana."),
    blockers: z.string().optional().describe("Bloqueos o dificultades."),
    hours_spent: z.number().optional().describe("Horas dedicadas durante la semana."),
    repo_url: z.string().optional().describe("Enlace al repositorio o commit relacionado."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.week_start)) return fail("week_start debe tener formato YYYY-MM-DD.");
    if (!input.summary.trim()) return fail("El resumen no puede estar vacío.");

    const supabase = supabaseForUser(ctx);

    const { data: activity } = await supabase
      .from("project_activities")
      .select("id, project_id")
      .eq("id", input.activity_id)
      .maybeSingle();

    if (!activity) return fail("No se encontró la actividad o no tienes acceso a ella.");
    if (activity.project_id !== input.project_id)
      return fail("La actividad no pertenece al proyecto indicado.");

    const { data, error } = await supabase
      .from("weekly_updates")
      .insert({
        user_id: ctx.getUserId()!,
        week_start: input.week_start,
        summary: input.summary.trim(),
        achievements: input.achievements ?? null,
        blockers: input.blockers ?? null,
        hours_spent: input.hours_spent ?? null,
        repo_url: input.repo_url ?? null,
        project_id: input.project_id,
        activity_id: input.activity_id,
      })
      .select("id, week_start, summary, project_id, activity_id")
      .single();

    if (error) return fail(error.message);
    return ok(data);
  },
});
