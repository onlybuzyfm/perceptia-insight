import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/coordinator")({
  component: CoordinatorDashboard,
});

function CoordinatorDashboard() {
  const auth = useAuth();
  const [counts, setCounts] = useState({ apps: 0, projects: 0, updates: 0 });
  const [recentApps, setRecentApps] = useState<Array<{ id: string; full_name: string; email: string; status: string; created_at: string }>>([]);

  useEffect(() => {
    if (!auth.isStaff()) return;
    (async () => {
      const [a, p, u, ra] = await Promise.all([
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("weekly_updates").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id, full_name, email, status, created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      setCounts({ apps: a.count ?? 0, projects: p.count ?? 0, updates: u.count ?? 0 });
      setRecentApps(ra.data ?? []);
    })();
  }, [auth]);

  if (!auth.isLoading && !auth.isStaff()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardShell title="Panel de coordinación">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Postulaciones" value={counts.apps} />
        <Stat label="Proyectos" value={counts.projects} />
        <Stat label="Avances registrados" value={counts.updates} />
      </div>

      <Card className="mt-6 border-border/70 p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Postulaciones recientes</h2>
        {recentApps.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Aún no hay postulaciones.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60">
            {recentApps.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">{a.full_name}</p>
                  <p className="text-xs text-muted-foreground">{a.email}</p>
                </div>
                <Badge variant="outline">{a.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border-border/70 p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-foreground">{value}</p>
    </Card>
  );
}
