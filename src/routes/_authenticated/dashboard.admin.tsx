import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  component: AdminDashboard,
});

interface UserWithRoles {
  id: string;
  full_name: string;
  roles: AppRole[];
}

function AdminDashboard() {
  const auth = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [profs, ur] = await Promise.all([
      supabase.from("profiles").select("id, full_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const map = new Map<string, AppRole[]>();
    (ur.data ?? []).forEach((r) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role as AppRole);
      map.set(r.user_id, arr);
    });
    setUsers(
      (profs.data ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name || "(sin nombre)",
        roles: map.get(p.id) ?? [],
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    if (auth.hasRole("admin")) load();
  }, [auth]);

  if (!auth.isLoading && !auth.hasRole("admin")) {
    return <Navigate to="/dashboard" replace />;
  }

  const toggleRole = async (userId: string, role: AppRole, has: boolean) => {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Rol actualizado");
    load();
  };

  const ALL_ROLES: AppRole[] = ["estudiante", "coordinador", "admin"];

  return (
    <DashboardShell title="Administración">
      <Card className="border-border/70 p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Usuarios y roles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Activa o desactiva roles para cada usuario registrado.
        </p>
        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-foreground">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground">{u.id.slice(0, 8)}...</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((r) => {
                    const has = u.roles.includes(r);
                    return (
                      <Button
                        key={r}
                        size="sm"
                        variant={has ? "default" : "outline"}
                        onClick={() => toggleRole(u.id, r, has)}
                        className={has ? "bg-primary hover:bg-primary/90" : ""}
                      >
                        {r}
                      </Button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6 border-border/70 p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Tu sesión</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {auth.user?.email} · roles:{" "}
          {auth.roles.map((r) => (
            <Badge key={r} variant="outline" className="mx-0.5">{r}</Badge>
          ))}
        </p>
      </Card>
    </DashboardShell>
  );
}
