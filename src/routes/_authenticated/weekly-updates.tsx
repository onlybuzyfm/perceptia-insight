import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/weekly-updates")({
  component: WeeklyUpdatesPage,
});

interface Evaluation {
  id: string;
  weekly_update_id: string;
  score: number;
  comment: string | null;
  evaluator_id: string;
  evaluator_name?: string;
}

interface Update {
  id: string;
  week_start: string;
  summary: string;
  achievements: string | null;
  blockers: string | null;
  hours_spent: number | null;
  repo_url: string | null;
  project_id: string | null;
  created_at: string;
}

interface ProjectOption {
  id: string;
  title: string;
}

interface ActivityOption {
  id: string;
  title: string;
  project_id: string;
  status: string;
  deadline: string;
}

const schema = z.object({
  week_start: z.string().min(1),
  summary: z.string().min(5).max(2000),
  achievements: z.string().max(2000).optional(),
  blockers: z.string().max(2000).optional(),
  hours_spent: z.number().min(0).max(168),
  repo_url: z.string().url("Debe ser un enlace válido").max(500).optional().or(z.literal("")),
  project_id: z.string().uuid("Debes seleccionar un proyecto válido"),
  activity_id: z.string().uuid("Debes seleccionar una actividad del proyecto"),
});

function WeeklyUpdatesPage() {
  const auth = useAuth();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [activities, setActivities] = useState<ActivityOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isStaff = auth.hasRole("admin") || auth.hasRole("coordinador");

  const load = async () => {
    if (!auth.user) return;
    setLoading(true);

    // Cargar proyectos del usuario (directos + por equipo). Admin/coord ven todos.
    const projMap = new Map<string, string>();
    if (isStaff) {
      const { data: all } = await supabase.from("projects").select("id, title").order("title");
      (all ?? []).forEach((p) => projMap.set(p.id, p.title));
    } else {
      const { data: direct } = await supabase
        .from("project_members")
        .select("projects(id, title)")
        .eq("user_id", auth.user.id);
      (direct ?? []).forEach((r) => {
        const p = r.projects as { id: string; title: string } | null;
        if (p) projMap.set(p.id, p.title);
      });
      const { data: tm } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", auth.user.id);
      const teamIds = (tm ?? []).map((t) => t.team_id);
      if (teamIds.length > 0) {
        const { data: tp } = await supabase
          .from("team_projects")
          .select("projects(id, title)")
          .in("team_id", teamIds);
        (tp ?? []).forEach((r) => {
          const p = r.projects as { id: string; title: string } | null;
          if (p) projMap.set(p.id, p.title);
        });
      }
    }
    const projList = Array.from(projMap, ([id, title]) => ({ id, title }));
    setProjects(projList);
    setSelectedProject(projList.length === 1 && !isStaff ? projList[0].id : "");
    setSelectedActivity("");


    const { data } = await supabase
      .from("weekly_updates")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("week_start", { ascending: false })
      .limit(20);
    const rows = data ?? [];
    setUpdates(rows);
    const ids = rows.map((r) => r.id);
    if (ids.length > 0) {
      const [{ data: evs }, { data: profs }] = await Promise.all([
        supabase.from("evaluations").select("*").in("weekly_update_id", ids),
        supabase.from("profiles").select("id, full_name"),
      ]);
      const profMap = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
      setEvals((evs ?? []).map((e) => ({ ...e, evaluator_name: profMap.get(e.evaluator_id) || "Coordinador" })));
    } else {
      setEvals([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [auth.user]);

  const activeProjectId = selectedProject;
  useEffect(() => {
    setSelectedActivity("");
    if (!activeProjectId) { setActivities([]); return; }
    let cancelled = false;
    (async () => {
      setLoadingActivities(true);
      const { data } = await supabase
        .from("project_activities")
        .select("id, title, project_id, status, deadline")
        .eq("project_id", activeProjectId)
        .order("deadline", { ascending: true });
      if (!cancelled) {
        setActivities((data ?? []) as ActivityOption[]);
        setLoadingActivities(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeProjectId]);

  const hasProjects = projects.length > 0;
  const showSelector = isStaff || projects.length > 1;
  const autoProjectId = !isStaff && projects.length === 1 ? projects[0].id : null;
  const hasActivities = activities.length > 0;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth.user) return;

    if (!hasProjects) {
      toast.error(
        isStaff
          ? "No existen proyectos en la plataforma. Crea uno antes de registrar avances."
          : "Debes tener un proyecto asignado para registrar avances semanales.",
      );
      return;
    }
    const fd = new FormData(e.currentTarget);
    const projectId = autoProjectId ?? selectedProject;
    if (!projectId) {
      toast.error("Selecciona el proyecto al que pertenece este avance.");
      return;
    }
    if (!selectedActivity) {
      toast.error("Selecciona la actividad sobre la que estás reportando.");
      return;
    }
    const parsed = schema.safeParse({
      week_start: fd.get("week_start"),
      summary: fd.get("summary"),
      achievements: fd.get("achievements") || undefined,
      blockers: fd.get("blockers") || undefined,
      hours_spent: Number(fd.get("hours_spent") || 0),
      repo_url: fd.get("repo_url") || "",
      project_id: projectId,
      activity_id: selectedActivity,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Revisa los campos del formulario.");
      return;
    }
    setSubmitting(true);
    const { repo_url, project_id, activity_id, ...rest } = parsed.data;
    const { error } = await supabase.from("weekly_updates").insert({
      user_id: auth.user.id,
      project_id,
      activity_id,
      ...rest,
      repo_url: repo_url ? repo_url : null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Avance registrado");
    e.currentTarget.reset();
    if (showSelector) setSelectedProject("");
    setSelectedActivity("");
    load();
  };

  return (
    <DashboardShell title="Avances semanales">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="border-border/70 p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Registrar avance</h2>
          {!loading && !hasProjects ? (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/70 bg-muted/30 p-6 text-center">
              <Lock className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Apartado bloqueado</p>
              <p className="text-xs text-muted-foreground">
                {isStaff
                  ? "No existen proyectos en la plataforma. Crea uno para registrar avances."
                  : auth.hasRole("docente_asociado")
                  ? "Para registrar un avance semanal debes estar asignado a un proyecto existente o crear un proyecto propio desde la pestaña Proyectos."
                  : "Debes tener un proyecto asignado para registrar avances semanales."}
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              {showSelector && (
                <div>
                  <Label htmlFor="project_id">Proyecto *</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger id="project_id" className="mt-1.5">
                      <SelectValue placeholder="Selecciona un proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {autoProjectId && (
                <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  Proyecto: <span className="font-medium text-foreground">{projects[0].title}</span>
                </div>
              )}
              {activeProjectId && (
                <div>
                  <Label htmlFor="activity_id">Actividad *</Label>
                  {loadingActivities ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">Cargando actividades…</p>
                  ) : !hasActivities ? (
                    <div className="mt-1.5 rounded-md border border-dashed border-amber-300 bg-amber-50/50 p-3 text-xs text-amber-800">
                      Este proyecto aún no tiene actividades asignadas. Un docente o coordinador debe crear una actividad antes de registrar avances semanales.
                    </div>
                  ) : (
                    <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                      <SelectTrigger id="activity_id" className="mt-1.5">
                        <SelectValue placeholder="Selecciona una actividad" />
                      </SelectTrigger>
                      <SelectContent>
                        {activities.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              <div>
                <Label htmlFor="week_start">Semana del</Label>
                <Input id="week_start" name="week_start" type="date" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="summary">Resumen</Label>
                <Textarea id="summary" name="summary" rows={3} required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="achievements">Logros</Label>
                <Textarea id="achievements" name="achievements" rows={2} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="blockers">Bloqueos</Label>
                <Textarea id="blockers" name="blockers" rows={2} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="hours_spent">Horas dedicadas</Label>
                <Input id="hours_spent" name="hours_spent" type="number" min={0} max={168} step="0.5" defaultValue={0} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="repo_url">Repositorio de GitHub</Label>
                <Input id="repo_url" name="repo_url" type="url" placeholder="https://github.com/usuario/repo" maxLength={500} className="mt-1.5" />
              </div>
              <Button
                type="submit"
                disabled={submitting || !activeProjectId || !selectedActivity || !hasActivities}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {submitting ? "Guardando..." : "Guardar avance"}
              </Button>
            </form>
          )}

        </Card>

        <Card className="border-border/70 p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Historial</h2>
          {loading ? (
            <p className="mt-3 text-sm text-muted-foreground">Cargando...</p>
          ) : updates.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Aún no has registrado avances.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {updates.map((u) => (
                <li key={u.id} className="rounded-lg border border-border/60 p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Semana del {u.week_start}</span>
                    <span>{u.hours_spent ?? 0} h</span>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{u.summary}</p>
                  {u.achievements && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Logros:</span> {u.achievements}
                    </p>
                  )}
                  {u.blockers && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Bloqueos:</span> {u.blockers}
                    </p>
                  )}
                  {u.repo_url && (
                    <p className="mt-1 text-xs">
                      <a href={u.repo_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        ↗ Repositorio GitHub
                      </a>
                    </p>
                  )}
                  {(() => {
                    const updateEvals = evals.filter((e) => e.weekly_update_id === u.id);
                    if (updateEvals.length === 0) return null;
                    return (
                      <div className="mt-3 space-y-2 rounded-md border border-primary/20 bg-primary/5 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <Star className="h-3.5 w-3.5 text-primary" /> Retroalimentación recibida
                        </p>
                        {updateEvals.map((e) => (
                          <div key={e.id} className="text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground">{e.evaluator_name}</span>
                              <Badge variant="secondary" className="gap-1">
                                <Star className="h-3 w-3 fill-current" /> {e.score}/5
                              </Badge>
                            </div>
                            {e.comment && <p className="mt-1 text-muted-foreground">{e.comment}</p>}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
