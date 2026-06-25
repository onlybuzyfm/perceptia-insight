import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, FolderKanban, Inbox, FileCheck2, AlertTriangle, BookOpen, Calendar, ScrollText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/")({
  component: () => <AdminShell><AdminOverview /></AdminShell>,
});

interface Metrics {
  studentsActive: number;
  projectsActive: number;
  applicationsPending: number;
  updatesThisWeek: number;
  updatesLate: number;
  resources: number;
  eventsUpcoming: number;
  production: number;
}

function startOfISOWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // lunes = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function AdminOverview() {
  const [m, setM] = useState<Metrics | null>(null);
  const [recentApps, setRecentApps] = useState<Array<{ id: string; full_name: string; email: string; status: string; created_at: string }>>([]);
  const [byStatus, setByStatus] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const weekStart = startOfISOWeek(new Date()).toISOString().slice(0, 10);
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekISO = startOfISOWeek(lastWeek).toISOString().slice(0, 10);

      // Estudiantes activos (rol estudiante + is_active true)
      const studentRoleIds = await supabase.from("user_roles").select("user_id").eq("role", "estudiante");
      const ids = (studentRoleIds.data ?? []).map((r) => r.user_id);
      let studentsActive = 0;
      if (ids.length > 0) {
        const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).in("id", ids).eq("is_active", true);
        studentsActive = count ?? 0;
      }

      const [projAct, projAll, appsPend, upWeek, upLast, res, prods, activeAssignees, activeProfiles, excused] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "activo"),
        supabase.from("projects").select("status"),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
        supabase.from("weekly_updates").select("id", { count: "exact", head: true }).gte("week_start", weekStart),
        supabase.from("weekly_updates").select("user_id").gte("week_start", lastWeekISO).lt("week_start", weekStart),
        supabase.from("resources").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id, full_name, email, status, created_at").order("created_at", { ascending: false }).limit(5),
        // Estudiantes con al menos una actividad activa (pendiente/en_progreso) asignada
        supabase.from("activity_assignees").select("user_id, project_activities!inner(status)").in("project_activities.status", ["pendiente", "en_progreso"]),
        supabase.from("profiles").select("id, created_at").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]).eq("is_active", true),
        supabase.from("excused_late_updates").select("user_id").eq("week_start", lastWeekISO),
      ]);

      // Avances atrasados: estudiantes activos CON actividad activa asignada,
      // creados antes del inicio de la semana evaluada, sin avance esa semana y no excusados.
      const reportedLast = new Set((upLast.data ?? []).map((r) => r.user_id));
      const withActiveActivity = new Set((activeAssignees.data ?? []).map((m: any) => m.user_id));
      const excusedSet = new Set((excused.data ?? []).map((e) => e.user_id));
      const eligible = (activeProfiles.data ?? []).filter(
        (p) => withActiveActivity.has(p.id) && new Date(p.created_at) < new Date(lastWeekISO),
      );
      const updatesLate = eligible.filter((p) => !reportedLast.has(p.id) && !excusedSet.has(p.id)).length;

      // Distribución por estado de proyecto
      const status: Record<string, number> = {};
      (projAll.data ?? []).forEach((p) => {
        status[p.status] = (status[p.status] ?? 0) + 1;
      });
      setByStatus(status);

      setM({
        studentsActive,
        projectsActive: projAct.count ?? 0,
        applicationsPending: appsPend.count ?? 0,
        updatesThisWeek: upWeek.count ?? 0,
        updatesLate,
        resources: res.count ?? 0,
        eventsUpcoming: 0, // pendiente de tabla events
        production: 0, // pendiente de tabla production
      });
      setRecentApps(prods.data ?? []);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={GraduationCap} label="Estudiantes activos" value={m?.studentsActive} />
        <Stat icon={FolderKanban} label="Proyectos activos" value={m?.projectsActive} />
        <Stat icon={Inbox} label="Postulaciones pendientes" value={m?.applicationsPending} accent={(m?.applicationsPending ?? 0) > 0} />
        <Stat icon={FileCheck2} label="Avances esta semana" value={m?.updatesThisWeek} />
        <Link to="/dashboard/admin/late-updates" className="block">
          <Stat icon={AlertTriangle} label="Avances atrasados" value={m?.updatesLate} accent={(m?.updatesLate ?? 0) > 0} />
        </Link>
        <Stat icon={BookOpen} label="Recursos internos" value={m?.resources} />
        <Stat icon={Calendar} label="Eventos próximos" value={m?.eventsUpcoming} muted />
        <Stat icon={ScrollText} label="Producción académica" value={m?.production} muted />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Proyectos por estado</h2>
          {Object.keys(byStatus).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Aún no hay proyectos.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {Object.entries(byStatus).map(([s, n]) => (
                <li key={s}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize text-foreground">{s.replace("_", " ")}</span>
                    <span className="font-semibold text-primary">{n}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded bg-primary-soft">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.min(100, (n / Math.max(1, Object.values(byStatus).reduce((a, b) => a + b, 0))) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="border-border/70 bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Postulaciones recientes</h2>
          {recentApps.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Aún no hay postulaciones.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border/60">
              {recentApps.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{a.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{a.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent, muted }: { icon: LucideIcon; label: string; value: number | undefined; accent?: boolean; muted?: boolean }) {
  return (
    <Card className={`border-border/70 bg-white p-4 ${accent ? "ring-1 ring-primary/30" : ""}`}>
      <div className="flex items-start justify-between">
        <p className={`text-xs font-medium ${muted ? "text-muted-foreground/70" : "text-muted-foreground"}`}>{label}</p>
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : muted ? "text-muted-foreground/50" : "text-muted-foreground"}`} />
      </div>
      <p className={`mt-2 font-display text-2xl font-bold ${accent ? "text-primary" : muted ? "text-muted-foreground" : "text-foreground"}`}>
        {value ?? "—"}
      </p>
    </Card>
  );
}
