import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AlertTriangle, Trash2, RotateCcw, CalendarClock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/late-updates")({
  component: () => <AdminShell><LateUpdatesPage /></AdminShell>,
});

function startOfISOWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}
function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

interface LateRow {
  user_id: string;
  full_name: string;
  email: string | null;
  active_activities: number;
  excused: boolean;
  excused_id?: string;
  reason?: string | null;
}

function LateUpdatesPage() {
  const auth = useAuth();
  // Por defecto, la semana pasada (lunes a domingo previos)
  const defaultWeek = useMemo(() => {
    const lw = new Date(); lw.setDate(lw.getDate() - 7);
    return isoDate(startOfISOWeek(lw));
  }, []);
  const [weekStart, setWeekStart] = useState<string>(defaultWeek);
  const [rows, setRows] = useState<LateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<Record<string, string>>({});

  const weekEnd = useMemo(() => {
    const s = new Date(weekStart + "T00:00:00");
    return isoDate(addDays(s, 6));
  }, [weekStart]);

  async function load() {
    setLoading(true);
    try {
      const [roleRes, profRes, upRes, actRes, exRes] = await Promise.all([
        supabase.from("user_roles").select("user_id").eq("role", "estudiante"),
        supabase.from("profiles").select("id, full_name, email, created_at, is_active"),
        supabase.from("weekly_updates").select("user_id").eq("week_start", weekStart),
        supabase.from("activity_assignees").select("user_id, project_activities!inner(status)").in("project_activities.status", ["pendiente", "en_progreso"]),
        supabase.from("excused_late_updates").select("id, user_id, reason").eq("week_start", weekStart),
      ]);

      const studentIds = new Set((roleRes.data ?? []).map((r) => r.user_id));
      const reported = new Set((upRes.data ?? []).map((r) => r.user_id));
      const activityCount = new Map<string, number>();
      (actRes.data ?? []).forEach((a: any) => {
        activityCount.set(a.user_id, (activityCount.get(a.user_id) ?? 0) + 1);
      });
      const excusedMap = new Map<string, { id: string; reason: string | null }>();
      (exRes.data ?? []).forEach((e: any) => excusedMap.set(e.user_id, { id: e.id, reason: e.reason }));

      const list: LateRow[] = [];
      (profRes.data ?? []).forEach((p: any) => {
        if (!studentIds.has(p.id)) return;
        if (!p.is_active) return;
        if (new Date(p.created_at) >= new Date(weekStart)) return;
        const acts = activityCount.get(p.id) ?? 0;
        if (acts === 0) return; // solo quienes tienen actividades activas
        if (reported.has(p.id)) return; // ya entregó
        const exc = excusedMap.get(p.id);
        list.push({
          user_id: p.id,
          full_name: p.full_name || "(sin nombre)",
          email: p.email,
          active_activities: acts,
          excused: !!exc,
          excused_id: exc?.id,
          reason: exc?.reason ?? null,
        });
      });
      list.sort((a, b) => Number(a.excused) - Number(b.excused) || a.full_name.localeCompare(b.full_name));
      setRows(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [weekStart]);

  async function excuse(r: LateRow) {
    if (!auth.user) return;
    const { error } = await supabase.from("excused_late_updates").insert({
      user_id: r.user_id,
      week_start: weekStart,
      excused_by: auth.user.id,
      reason: reason[r.user_id]?.trim() || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`${r.full_name} excusado de la semana ${weekStart}`);
    setReason((prev) => { const next = { ...prev }; delete next[r.user_id]; return next; });
    load();
  }

  async function undoExcuse(r: LateRow) {
    if (!r.excused_id) return;
    const { error } = await supabase.from("excused_late_updates").delete().eq("id", r.excused_id);
    if (error) { toast.error(error.message); return; }
    toast.success("Excusa eliminada");
    load();
  }

  const pending = rows.filter((r) => !r.excused);
  const excused = rows.filter((r) => r.excused);

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Semana (lunes)</label>
            <Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="mt-1 w-[180px]" />
          </div>
          <div className="text-xs text-muted-foreground">
            <CalendarClock className="mr-1 inline h-3.5 w-3.5" />
            Rango: <strong>{weekStart}</strong> → <strong>{weekEnd}</strong>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <Badge variant="outline" className="border-primary/40 bg-primary-soft text-primary">
              <AlertTriangle className="mr-1 h-3.5 w-3.5" /> {pending.length} atrasados
            </Badge>
            <Badge variant="outline">{excused.length} excusados</Badge>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Solo se listan estudiantes activos, creados antes del lunes de la semana evaluada y con al menos una actividad <strong>pendiente</strong> o <strong>en progreso</strong> asignada. Excusarlos los retira del conteo de atrasados.
        </p>
      </Card>

      {loading ? (
        <Card className="border-border/70 bg-white p-6 text-sm text-muted-foreground">Cargando…</Card>
      ) : rows.length === 0 ? (
        <Card className="border-border/70 bg-white p-6 text-sm text-muted-foreground">
          🎉 Sin atrasos para la semana seleccionada.
        </Card>
      ) : (
        <Card className="border-border/70 bg-white p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">Estudiante</th>
                <th className="px-4 py-2.5 text-left">Correo</th>
                <th className="px-4 py-2.5 text-center">Actividades activas</th>
                <th className="px-4 py-2.5 text-left">Estado</th>
                <th className="px-4 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((r) => (
                <tr key={r.user_id} className={r.excused ? "bg-muted/30" : ""}>
                  <td className="px-4 py-2.5 font-medium text-foreground">{r.full_name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.email ?? "—"}</td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge variant="outline">{r.active_activities}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    {r.excused ? (
                      <span className="text-xs text-muted-foreground">
                        Excusado{r.reason ? ` · ${r.reason}` : ""}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-primary">Atrasado</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {r.excused ? (
                      <div className="flex justify-end">
                        <Button size="sm" variant="ghost" onClick={() => undoExcuse(r)}>
                          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Revertir
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          placeholder="Motivo (opcional)"
                          value={reason[r.user_id] ?? ""}
                          onChange={(e) => setReason((prev) => ({ ...prev, [r.user_id]: e.target.value }))}
                          className="h-8 w-[200px] text-xs"
                        />
                        <Button size="sm" variant="outline" onClick={() => excuse(r)}>
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Quitar de atrasados
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
