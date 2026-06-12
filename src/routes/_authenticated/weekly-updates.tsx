import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star } from "lucide-react";
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
  created_at: string;
}

const schema = z.object({
  week_start: z.string().min(1),
  summary: z.string().min(5).max(2000),
  achievements: z.string().max(2000).optional(),
  blockers: z.string().max(2000).optional(),
  hours_spent: z.number().min(0).max(168),
  repo_url: z.string().url("Debe ser un enlace válido").max(500).optional().or(z.literal("")),
});

function WeeklyUpdatesPage() {
  const auth = useAuth();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!auth.user) return;
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

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth.user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      week_start: fd.get("week_start"),
      summary: fd.get("summary"),
      achievements: fd.get("achievements") || undefined,
      blockers: fd.get("blockers") || undefined,
      hours_spent: Number(fd.get("hours_spent") || 0),
      repo_url: fd.get("repo_url") || "",
    });
    if (!parsed.success) {
      toast.error("Revisa los campos del formulario.");
      return;
    }
    setSubmitting(true);
    const { repo_url, ...rest } = parsed.data;
    const { error } = await supabase.from("weekly_updates").insert({
      user_id: auth.user.id,
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
    load();
  };

  return (
    <DashboardShell title="Avances semanales">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="border-border/70 p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Registrar avance</h2>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
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
            <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary/90">
              {submitting ? "Guardando..." : "Guardar avance"}
            </Button>
          </form>
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
