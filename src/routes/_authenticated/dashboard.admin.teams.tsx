import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Trash2, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/teams")({
  component: () => <AdminShell><TeamsAdmin /></AdminShell>,
});

interface Project { id: string; title: string; slug: string }
interface Member { id: string; user_id: string; project_id: string; role_in_project: string; full_name: string; username: string | null; avatar_url: string | null }
interface Profile { id: string; full_name: string; username: string | null; avatar_url: string | null }

function TeamsAdmin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<Project | null>(null);

  const load = async () => {
    setLoading(true);
    const [projs, mems, profs] = await Promise.all([
      supabase.from("projects").select("id, title, slug").order("title"),
      supabase.from("project_members").select("id, user_id, project_id, role_in_project"),
      supabase.from("profiles").select("id, full_name, username, avatar_url").eq("is_active", true),
    ]);
    const profMap = new Map((profs.data ?? []).map((p) => [p.id, p]));
    setProjects(projs.data ?? []);
    setProfiles(profs.data ?? []);
    setMembers((mems.data ?? []).map((m) => {
      const p = profMap.get(m.user_id);
      return {
        ...m,
        full_name: p?.full_name || "(sin nombre)",
        username: p?.username ?? null,
        avatar_url: p?.avatar_url ?? null,
      };
    }));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const removeMember = async (id: string) => {
    if (!confirm("¿Quitar a este integrante del equipo?")) return;
    const { error } = await supabase.from("project_members").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Integrante removido");
    load();
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-white p-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Equipos por proyecto</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Asigna integrantes a cada proyecto y define su rol dentro del equipo.
        </p>
      </Card>

      {loading ? (
        <Card className="p-6 text-sm text-muted-foreground">Cargando...</Card>
      ) : projects.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">No hay proyectos creados aún.</Card>
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => {
            const team = members.filter((m) => m.project_id === p.id);
            return (
              <Card key={p.id} className="border-border/70 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{p.title}</h3>
                    <p className="font-mono text-xs text-muted-foreground">{p.slug}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setAdding(p)}>
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Añadir integrante
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {team.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin integrantes asignados.</p>
                  ) : team.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 py-1 pl-1 pr-2 text-sm">
                      <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-[10px] font-bold text-primary">
                        {m.avatar_url ? <img src={m.avatar_url} alt="" className="h-full w-full object-cover" /> : (m.full_name[0] || "?").toUpperCase()}
                      </div>
                      <span className="font-medium">{m.full_name}</span>
                      <Badge variant="outline" className="text-[10px]">{m.role_in_project}</Badge>
                      <button onClick={() => removeMember(m.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AddMemberDialog
        project={adding}
        profiles={profiles}
        existing={members}
        onClose={() => setAdding(null)}
        onSaved={() => { setAdding(null); load(); }}
      />
    </div>
  );
}

function AddMemberDialog({ project, profiles, existing, onClose, onSaved }: { project: Project | null; profiles: Profile[]; existing: Member[]; onClose: () => void; onSaved: () => void }) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("integrante");
  const [q, setQ] = useState("");

  useEffect(() => { setUserId(""); setRole("integrante"); setQ(""); }, [project]);

  const available = useMemo(() => {
    if (!project) return [];
    const taken = new Set(existing.filter((m) => m.project_id === project.id).map((m) => m.user_id));
    return profiles.filter((p) => !taken.has(p.id) && (q === "" || `${p.full_name} ${p.username ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  }, [project, profiles, existing, q]);

  if (!project) return null;

  const save = async () => {
    if (!userId) return toast.error("Selecciona un integrante");
    const { error } = await supabase.from("project_members").insert({
      project_id: project.id, user_id: userId, role_in_project: role,
    });
    if (error) return toast.error(error.message);
    toast.success("Integrante añadido");
    onSaved();
  };

  return (
    <Dialog open={!!project} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir a {project.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label className="text-xs">Buscar</Label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre o @username" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Integrante</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
              <SelectContent className="max-h-72">
                {available.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-muted-foreground">Sin resultados</div>
                ) : available.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name} {p.username ? `(@${p.username})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Rol en el proyecto</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lider">Líder</SelectItem>
                <SelectItem value="integrante">Integrante</SelectItem>
                <SelectItem value="colaborador">Colaborador</SelectItem>
                <SelectItem value="mentor">Mentor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} className="bg-primary hover:bg-primary/90">Añadir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
