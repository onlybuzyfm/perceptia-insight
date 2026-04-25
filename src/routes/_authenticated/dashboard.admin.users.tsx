import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { toast } from "sonner";
import { Search, UserCheck, UserX } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/users")({
  component: () => <AdminShell><UsersAdmin /></AdminShell>,
});

interface UserRow {
  id: string;
  full_name: string;
  email: string | null;
  is_active: boolean;
  carrera: string | null;
  semestre: string | null;
  interest_line_id: string | null;
  roles: AppRole[];
  last_sign_in_at: string | null;
  project_ids: string[];
}

interface ResearchLine { id: string; title: string }
interface Project { id: string; title: string }

const MANAGED_ROLES: AppRole[] = ["estudiante", "coordinador", "admin"];

function UsersAdmin() {
  const auth = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [lines, setLines] = useState<ResearchLine[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const [profs, ur, ls, pr, members, authUsers] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, is_active, carrera, semestre, interest_line_id"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("research_lines").select("id, title").order("display_order"),
      supabase.from("projects").select("id, title").order("title"),
      supabase.from("project_members").select("user_id, project_id"),
      supabase.rpc("admin_list_users"),
    ]);

    const rolesMap = new Map<string, AppRole[]>();
    (ur.data ?? []).forEach((r) => {
      const arr = rolesMap.get(r.user_id) ?? [];
      arr.push(r.role as AppRole);
      rolesMap.set(r.user_id, arr);
    });

    const projectsMap = new Map<string, string[]>();
    (members.data ?? []).forEach((m) => {
      const arr = projectsMap.get(m.user_id) ?? [];
      arr.push(m.project_id);
      projectsMap.set(m.user_id, arr);
    });

    const authMap = new Map<string, { last_sign_in_at: string | null; email: string | null }>();
    (authUsers.data ?? []).forEach((u: { id: string; last_sign_in_at: string | null; email: string | null }) => {
      authMap.set(u.id, { last_sign_in_at: u.last_sign_in_at, email: u.email });
    });

    setUsers(
      (profs.data ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name || "(sin nombre)",
        email: p.email || authMap.get(p.id)?.email || null,
        is_active: p.is_active ?? true,
        carrera: p.carrera,
        semestre: p.semestre,
        interest_line_id: p.interest_line_id,
        roles: rolesMap.get(p.id) ?? [],
        last_sign_in_at: authMap.get(p.id)?.last_sign_in_at ?? null,
        project_ids: projectsMap.get(p.id) ?? [],
      })),
    );
    setLines(ls.data ?? []);
    setProjects(pr.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (q && !`${u.full_name} ${u.email}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (roleFilter !== "all" && !u.roles.includes(roleFilter as AppRole)) return false;
      if (statusFilter === "active" && !u.is_active) return false;
      if (statusFilter === "inactive" && u.is_active) return false;
      return true;
    });
  }, [users, q, roleFilter, statusFilter]);

  const toggleRole = async (userId: string, role: AppRole, has: boolean) => {
    if (has) {
      if (role === "admin" && userId === auth.user?.id) {
        const adminCount = users.filter((u) => u.roles.includes("admin")).length;
        if (adminCount <= 1) return toast.error("No puedes quitarte admin: eres el único.");
        if (!window.confirm("¿Quitarte el rol admin?")) return;
      }
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Rol actualizado");
    load();
  };

  const toggleActive = async (u: UserRow) => {
    if (u.id === auth.user?.id && u.is_active) {
      return toast.error("No puedes desactivarte a ti mismo.");
    }
    const { error } = await supabase.from("profiles").update({ is_active: !u.is_active }).eq("id", u.id);
    if (error) return toast.error(error.message);
    toast.success(u.is_active ? "Usuario desactivado" : "Usuario activado");
    load();
  };

  const updateLine = async (userId: string, lineId: string) => {
    const { error } = await supabase.from("profiles").update({ interest_line_id: lineId === "none" ? null : lineId }).eq("id", userId);
    if (error) return toast.error(error.message);
    toast.success("Línea actualizada");
    load();
  };

  const assignProject = async (userId: string, projectId: string) => {
    if (projectId === "none") return;
    const { error } = await supabase.from("project_members").insert({ user_id: userId, project_id: projectId });
    if (error) return toast.error(error.message);
    toast.success("Proyecto asignado");
    load();
  };

  const removeProject = async (userId: string, projectId: string) => {
    const { error } = await supabase.from("project_members").delete().eq("user_id", userId).eq("project_id", projectId);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o correo..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="estudiante">Estudiante</SelectItem>
              <SelectItem value="coordinador">Coordinador</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-sm text-muted-foreground">{filtered.length} usuarios</span>
        </div>
      </Card>

      <Card className="border-border/70 bg-white p-0 overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Sin resultados.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((u) => (
              <li key={u.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{u.full_name}</p>
                      {!u.is_active && <Badge variant="outline" className="border-destructive/40 text-destructive">Inactivo</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{u.email ?? "(sin correo)"}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Último acceso: {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("es-EC") : "nunca"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={u.is_active ? "outline" : "default"}
                    onClick={() => toggleActive(u)}
                    className={u.is_active ? "" : "bg-primary hover:bg-primary/90"}
                  >
                    {u.is_active ? <><UserX className="mr-1.5 h-3.5 w-3.5" />Desactivar</> : <><UserCheck className="mr-1.5 h-3.5 w-3.5" />Activar</>}
                  </Button>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Roles</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {MANAGED_ROLES.map((r) => {
                        const has = u.roles.includes(r);
                        return (
                          <Button
                            key={r}
                            size="sm"
                            variant={has ? "default" : "outline"}
                            onClick={() => toggleRole(u.id, r, has)}
                            className={`h-7 px-2 text-xs ${has ? "bg-primary hover:bg-primary/90" : ""}`}
                          >
                            {r}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Línea de interés</p>
                    <Select value={u.interest_line_id ?? "none"} onValueChange={(v) => updateLine(u.id, v)}>
                      <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Sin línea" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin línea</SelectItem>
                        {lines.map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Proyectos asignados</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {u.project_ids.length === 0 && <span className="text-xs text-muted-foreground">Ninguno</span>}
                      {u.project_ids.map((pid) => {
                        const p = projects.find((x) => x.id === pid);
                        return (
                          <Badge key={pid} variant="outline" className="cursor-pointer" onClick={() => removeProject(u.id, pid)}>
                            {p?.title ?? pid.slice(0, 6)} ×
                          </Badge>
                        );
                      })}
                    </div>
                    <Select value="none" onValueChange={(v) => assignProject(u.id, v)}>
                      <SelectTrigger className="mt-1 h-7 text-xs"><SelectValue placeholder="+ Asignar proyecto" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">+ Asignar proyecto</SelectItem>
                        {projects.filter((p) => !u.project_ids.includes(p.id)).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
