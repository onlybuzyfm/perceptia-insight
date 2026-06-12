import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import {
  ListChecks,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trophy,
  FolderKanban,
  Users,
  CalendarClock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/indicators")({
  component: () => (
    <AdminShell>
      <Indicators />
    </AdminShell>
  ),
});

interface ActivityRow {
  id: string;
  title: string;
  status: "pendiente" | "en_progreso" | "completada";
  deadline: string;
  project_id: string;
}

interface ProjectRow {
  id: string;
  title: string;
  status: string;
  research_line_id: string | null;
}

interface AssigneeRow {
  activity_id: string;
  user_id: string;
}

interface ProfileRow {
  id: string;
  full_title: string;
  avatar_url: string | null;
}

interface ResearchLineRow {
  id: string;
  title: string;
}

function Indicators() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [assignees, setAssignees] = useState<AssigneeRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [lines, setLines] = useState<ResearchLineRow[]>([]);

  useEffect(() => {
    (async () => {
      const [actsRes, projRes, asgRes, linesRes] = await Promise.all([
        supabase.from("project_activities").select("id, title, status, deadline, project_id"),
        supabase.from("projects").select("id, title, status, research_line_id"),
        supabase.from("activity_assignees").select("activity_id, user_id"),
        supabase.from("research_lines").select("id, title"),
      ]);
      const acts = (actsRes.data ?? []) as ActivityRow[];
      const asg = (asgRes.data ?? []) as AssigneeRow[];
      setActivities(acts);
      setProjects((projRes.data ?? []) as ProjectRow[]);
      setAssignees(asg);
      setLines((linesRes.data ?? []) as ResearchLineRow[]);

      const userIds = Array.from(new Set(asg.map((a) => a.user_id)));
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);
        const map: Record<string, ProfileRow> = {};
        (profs ?? []).forEach((p) => {
          map[p.id] = p as ProfileRow;
        });
        setProfiles(map);
      }
      setLoading(false);
    })();
  }, []);

  const now = new Date();
  const in7days = new Date();
  in7days.setDate(in7days.getDate() + 7);

  const total = activities.length;
  const completed = activities.filter((a) => a.status === "completada").length;
  const inProgress = activities.filter((a) => a.status === "en_progreso").length;
  const pending = activities.filter((a) => a.status === "pendiente").length;
  const overdue = activities.filter(
    (a) => a.status !== "completada" && new Date(a.deadline) < now,
  );
  const upcoming = activities
    .filter(
      (a) =>
        a.status !== "completada" &&
        new Date(a.deadline) >= now &&
        new Date(a.deadline) <= in7days,
    )
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Top estudiantes por actividades completadas
  const completedActivityIds = new Set(
    activities.filter((a) => a.status === "completada").map((a) => a.id),
  );
  const completedPerUser: Record<string, number> = {};
  assignees.forEach((a) => {
    if (completedActivityIds.has(a.activity_id)) {
      completedPerUser[a.user_id] = (completedPerUser[a.user_id] ?? 0) + 1;
    }
  });
  const topStudents = Object.entries(completedPerUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Progreso por proyecto
  const projectsById: Record<string, ProjectRow> = {};
  projects.forEach((p) => {
    projectsById[p.id] = p;
  });
  const projectProgress = projects
    .filter((p) => p.status === "activo")
    .map((p) => {
      const acts = activities.filter((a) => a.project_id === p.id);
      const done = acts.filter((a) => a.status === "completada").length;
      const pct = acts.length > 0 ? Math.round((done / acts.length) * 100) : 0;
      return { project: p, total: acts.length, done, pct };
    })
    .sort((a, b) => b.total - a.total);

  // Distribución por línea de investigación
  const linesById: Record<string, string> = {};
  lines.forEach((l) => {
    linesById[l.id] = l.name;
  });
  const projectsPerLine: Record<string, number> = {};
  projects.forEach((p) => {
    const key = p.research_line_id ? linesById[p.research_line_id] ?? "Sin línea" : "Sin línea";
    projectsPerLine[key] = (projectsPerLine[key] ?? 0) + 1;
  });

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando indicadores…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Indicadores</h1>
        <p className="text-sm text-muted-foreground">
          Métricas en tiempo real de actividades, proyectos y participación de estudiantes.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={ListChecks} label="Total actividades" value={total} />
        <Stat icon={CheckCircle2} label="Completadas" value={completed} accent />
        <Stat icon={Clock} label="En progreso" value={inProgress} />
        <Stat icon={AlertTriangle} label="Vencidas" value={overdue.length} danger={overdue.length > 0} />
      </div>

      {/* Tasa de cumplimiento */}
      <Card className="border-border/70 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Tasa de cumplimiento</h2>
            <p className="text-sm text-muted-foreground">
              {completed} de {total} actividades completadas
            </p>
          </div>
          <span className="font-display text-3xl font-bold text-primary">{completionRate}%</span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-primary-soft">
          <div className="h-full bg-primary transition-all" style={{ width: `${completionRate}%` }} />
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span>✅ {completed} completadas</span>
          <span>⏳ {inProgress} en progreso</span>
          <span>📌 {pending} pendientes</span>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Deadlines próximos */}
        <Card className="border-border/70 bg-white p-6">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">Deadlines próximos (7 días)</h2>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No hay deadlines en los próximos 7 días.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border/60">
              {upcoming.slice(0, 6).map((a) => {
                const days = Math.ceil(
                  (new Date(a.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                );
                return (
                  <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{a.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {projectsById[a.project_id]?.name ?? "—"}
                      </p>
                    </div>
                    <Badge variant={days <= 2 ? "destructive" : "outline"}>
                      {days === 0 ? "Hoy" : days === 1 ? "Mañana" : `${days} días`}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Vencidas */}
        <Card className="border-border/70 bg-white p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="font-display text-lg font-semibold text-foreground">Actividades vencidas</h2>
          </div>
          {overdue.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">🎉 No hay actividades vencidas.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border/60">
              {overdue.slice(0, 6).map((a) => {
                const days = Math.floor(
                  (now.getTime() - new Date(a.deadline).getTime()) / (1000 * 60 * 60 * 24),
                );
                return (
                  <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{a.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {projectsById[a.project_id]?.name ?? "—"}
                      </p>
                    </div>
                    <Badge variant="destructive">{days}d tarde</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Top estudiantes */}
        <Card className="border-border/70 bg-white p-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">Top estudiantes activos</h2>
          </div>
          {topStudents.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Aún no hay actividades completadas.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topStudents.map(([userId, count], idx) => {
                const profile = profiles[userId];
                return (
                  <li key={userId} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft font-display text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {profile?.full_name ?? "Estudiante"}
                      </p>
                    </div>
                    <Badge variant="outline">{count} ✓</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Progreso por proyecto */}
        <Card className="border-border/70 bg-white p-6">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">Progreso por proyecto activo</h2>
          </div>
          {projectProgress.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No hay proyectos activos.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {projectProgress.slice(0, 6).map((p) => (
                <li key={p.project.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium text-foreground">{p.project.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.done}/{p.total} · {p.pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded bg-primary-soft">
                    <div className="h-full bg-primary" style={{ width: `${p.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Proyectos por línea de investigación */}
      <Card className="border-border/70 bg-white p-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">Proyectos por línea de investigación</h2>
        </div>
        {Object.keys(projectsPerLine).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Sin datos.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(projectsPerLine).map(([line, count]) => {
              const max = Math.max(...Object.values(projectsPerLine));
              return (
                <li key={line}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate text-foreground">{line}</span>
                    <span className="font-semibold text-primary">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded bg-primary-soft">
                    <div className="h-full bg-primary" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <Card
      className={`border-border/70 bg-white p-4 ${danger ? "ring-1 ring-destructive/40" : accent ? "ring-1 ring-primary/30" : ""}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${danger ? "text-destructive" : accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <p
        className={`mt-2 font-display text-2xl font-bold ${danger ? "text-destructive" : accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
    </Card>
  );
}
