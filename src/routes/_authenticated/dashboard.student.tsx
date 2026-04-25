import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/student")({
  component: StudentDashboard,
});

interface ProjectRow {
  id: string;
  title: string;
  description: string;
  status: string;
}

function StudentDashboard() {
  const auth = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [profile, setProfile] = useState<{ full_name: string; carrera: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.user) return;
    (async () => {
      const [pm, prof] = await Promise.all([
        supabase
          .from("project_members")
          .select("project_id, projects(id, title, description, status)")
          .eq("user_id", auth.user!.id),
        supabase.from("profiles").select("full_name, carrera").eq("id", auth.user!.id).maybeSingle(),
      ]);
      const list: ProjectRow[] = (pm.data ?? [])
        .map((r) => (r.projects as ProjectRow | null))
        .filter((p): p is ProjectRow => !!p);
      setProjects(list);
      setProfile(prof.data ?? null);
      setLoading(false);
    })();
  }, [auth.user]);

  return (
    <DashboardShell title="Mi espacio de estudiante">
      <Card className="border-border/70 p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Mi perfil</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <dt className="text-muted-foreground">Nombre</dt>
          <dd className="text-foreground">{profile?.full_name || "—"}</dd>
          <dt className="text-muted-foreground">Carrera</dt>
          <dd className="text-foreground">{profile?.carrera || "—"}</dd>
          <dt className="text-muted-foreground">Correo</dt>
          <dd className="text-foreground">{auth.user?.email}</dd>
        </dl>
      </Card>

      <Card className="mt-6 border-border/70 p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Proyectos asignados</h2>
        {loading ? (
          <p className="mt-3 text-sm text-muted-foreground">Cargando...</p>
        ) : projects.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Aún no tienes un proyecto asignado. Contacta a tu coordinador.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {projects.map((p) => (
              <li key={p.id} className="rounded-lg border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  <Badge variant="outline">{p.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </DashboardShell>
  );
}
