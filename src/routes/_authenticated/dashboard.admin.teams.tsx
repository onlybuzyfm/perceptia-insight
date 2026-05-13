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
import { UserPlus, Trash2, Users, FolderKanban, Trophy, Plus, Network, Eye, Cpu, Brain, type LucideIcon } from "lucide-react";

const TEAM_ICONS: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  nexus: { icon: Network, color: "text-violet-600", bg: "bg-violet-100" },
  prisma: { icon: Eye, color: "text-sky-600", bg: "bg-sky-100" },
  vector: { icon: Cpu, color: "text-emerald-600", bg: "bg-emerald-100" },
  sinapsis: { icon: Brain, color: "text-amber-600", bg: "bg-amber-100" },
};

export const Route = createFileRoute("/_authenticated/dashboard/admin/teams")({
  component: () => <AdminShell><TeamsAdmin /></AdminShell>,
});

interface Team { id: string; name: string; slug: string; description: string; focus: string | null }
interface Project { id: string; title: string; slug: string }
interface Competition { id: string; name: string; event_date: string | null }
interface Member { id: string; team_id: string; user_id: string; role_in_team: string; full_name: string; username: string | null; avatar_url: string | null }
interface TeamProject { id: string; team_id: string; project_id: string }
interface TeamCompetition { id: string; team_id: string; competition_id: string; result: string | null }
interface Profile { id: string; full_name: string; username: string | null; avatar_url: string | null }

function TeamsAdmin() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tProjects, setTProjects] = useState<TeamProject[]>([]);
  const [tComps, setTComps] = useState<TeamCompetition[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [addingMemberTo, setAddingMemberTo] = useState<Team | null>(null);
  const [assignProjectTo, setAssignProjectTo] = useState<Team | null>(null);
  const [assignCompTo, setAssignCompTo] = useState<Team | null>(null);
  const [newCompOpen, setNewCompOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const [t, p, c, m, tp, tc, pr] = await Promise.all([
      supabase.from("teams").select("*").order("name"),
      supabase.from("projects").select("id, title, slug").order("title"),
      supabase.from("competitions").select("id, name, event_date").order("event_date", { ascending: false }),
      supabase.from("team_members").select("id, team_id, user_id, role_in_team"),
      supabase.from("team_projects").select("id, team_id, project_id"),
      supabase.from("team_competitions").select("id, team_id, competition_id, result"),
      supabase.from("profiles").select("id, full_name, username, avatar_url").eq("is_active", true),
    ]);
    const profMap = new Map((pr.data ?? []).map((x) => [x.id, x]));
    setTeams(t.data ?? []);
    setProjects(p.data ?? []);
    setCompetitions(c.data ?? []);
    setProfiles(pr.data ?? []);
    setTProjects(tp.data ?? []);
    setTComps(tc.data ?? []);
    setMembers((m.data ?? []).map((x) => {
      const prof = profMap.get(x.user_id);
      return {
        ...x,
        full_name: prof?.full_name || "(sin nombre)",
        username: prof?.username ?? null,
        avatar_url: prof?.avatar_url ?? null,
      };
    }));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const removeMember = async (id: string) => {
    if (!confirm("¿Quitar a este integrante?")) return;
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Integrante removido"); load();
  };

  const removeProject = async (id: string) => {
    const { error } = await supabase.from("team_projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Proyecto desasignado"); load();
  };

  const removeComp = async (id: string) => {
    const { error } = await supabase.from("team_competitions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Competencia desasignada"); load();
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Equipos del semillero</h2>
          </div>
          <Button size="sm" variant="outline" onClick={() => setNewCompOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Nueva competencia
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Asigna integrantes, proyectos y competencias a cada equipo.
        </p>
      </Card>

      {loading ? (
        <Card className="p-6 text-sm text-muted-foreground">Cargando...</Card>
      ) : (
        <div className="grid gap-3">
          {teams.map((team) => {
            const teamMembers = members.filter((x) => x.team_id === team.id);
            const teamProjs = tProjects.filter((x) => x.team_id === team.id)
              .map((x) => ({ link: x, project: projects.find((p) => p.id === x.project_id) }))
              .filter((x) => x.project);
            const teamCompsList = tComps.filter((x) => x.team_id === team.id)
              .map((x) => ({ link: x, comp: competitions.find((c) => c.id === x.competition_id) }))
              .filter((x) => x.comp);
            return (
              <Card key={team.id} className="border-border/70 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{team.name}</h3>
                    {team.focus && <p className="text-xs text-muted-foreground">{team.focus}</p>}
                  </div>
                </div>

                {/* Integrantes */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Integrantes</span>
                    <Button size="sm" variant="ghost" onClick={() => setAddingMemberTo(team)}>
                      <UserPlus className="mr-1 h-3.5 w-3.5" /> Añadir
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {teamMembers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin integrantes asignados.</p>
                    ) : teamMembers.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 py-1 pl-1 pr-2 text-sm">
                        <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-[10px] font-bold text-primary">
                          {m.avatar_url ? <img src={m.avatar_url} alt="" className="h-full w-full object-cover" /> : (m.full_name[0] || "?").toUpperCase()}
                        </div>
                        <span className="font-medium">{m.full_name}</span>
                        <Badge variant="outline" className="text-[10px]">{m.role_in_team}</Badge>
                        <button onClick={() => removeMember(m.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Proyectos */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proyectos</span>
                    <Button size="sm" variant="ghost" onClick={() => setAssignProjectTo(team)}>
                      <FolderKanban className="mr-1 h-3.5 w-3.5" /> Asignar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {teamProjs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin proyectos asignados.</p>
                    ) : teamProjs.map(({ link, project }) => (
                      <div key={link.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-primary-soft/40 px-2 py-1 text-xs">
                        <FolderKanban className="h-3 w-3 text-primary" />
                        <span className="font-medium">{project!.title}</span>
                        <button onClick={() => removeProject(link.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Competencias */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Competencias</span>
                    <Button size="sm" variant="ghost" onClick={() => setAssignCompTo(team)}>
                      <Trophy className="mr-1 h-3.5 w-3.5" /> Asignar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {teamCompsList.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin competencias asignadas.</p>
                    ) : teamCompsList.map(({ link, comp }) => (
                      <div key={link.id} className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs">
                        <Trophy className="h-3 w-3 text-amber-600" />
                        <span className="font-medium">{comp!.name}</span>
                        {link.result && <Badge variant="outline" className="text-[10px]">{link.result}</Badge>}
                        <button onClick={() => removeComp(link.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AddMemberDialog team={addingMemberTo} profiles={profiles} existing={members} onClose={() => setAddingMemberTo(null)} onSaved={() => { setAddingMemberTo(null); load(); }} />
      <AssignProjectDialog team={assignProjectTo} projects={projects} existing={tProjects} onClose={() => setAssignProjectTo(null)} onSaved={() => { setAssignProjectTo(null); load(); }} />
      <AssignCompetitionDialog team={assignCompTo} competitions={competitions} existing={tComps} onClose={() => setAssignCompTo(null)} onSaved={() => { setAssignCompTo(null); load(); }} />
      <NewCompetitionDialog open={newCompOpen} onClose={() => setNewCompOpen(false)} onSaved={() => { setNewCompOpen(false); load(); }} />
    </div>
  );
}

function AddMemberDialog({ team, profiles, existing, onClose, onSaved }: { team: Team | null; profiles: Profile[]; existing: Member[]; onClose: () => void; onSaved: () => void }) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("integrante");
  const [q, setQ] = useState("");
  useEffect(() => { setUserId(""); setRole("integrante"); setQ(""); }, [team]);

  const available = useMemo(() => {
    if (!team) return [];
    const taken = new Set(existing.filter((m) => m.team_id === team.id).map((m) => m.user_id));
    return profiles.filter((p) => !taken.has(p.id) && (q === "" || `${p.full_name} ${p.username ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  }, [team, profiles, existing, q]);

  if (!team) return null;
  const save = async () => {
    if (!userId) return toast.error("Selecciona un integrante");
    const { error } = await supabase.from("team_members").insert({ team_id: team.id, user_id: userId, role_in_team: role });
    if (error) return toast.error(error.message);
    toast.success("Integrante añadido"); onSaved();
  };

  return (
    <Dialog open={!!team} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader><DialogTitle>Añadir a {team.name}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label className="text-xs">Buscar</Label><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre o @username" className="mt-1" /></div>
          <div>
            <Label className="text-xs">Integrante</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
              <SelectContent className="max-h-72">
                {available.length === 0 ? <div className="px-2 py-3 text-xs text-muted-foreground">Sin resultados</div> : available.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name} {p.username ? `(@${p.username})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Rol en el equipo</Label>
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

function AssignProjectDialog({ team, projects, existing, onClose, onSaved }: { team: Team | null; projects: Project[]; existing: TeamProject[]; onClose: () => void; onSaved: () => void }) {
  const [projectId, setProjectId] = useState("");
  useEffect(() => { setProjectId(""); }, [team]);
  if (!team) return null;
  const taken = new Set(existing.filter((x) => x.team_id === team.id).map((x) => x.project_id));
  const available = projects.filter((p) => !taken.has(p.id));
  const save = async () => {
    if (!projectId) return toast.error("Selecciona un proyecto");
    const { error } = await supabase.from("team_projects").insert({ team_id: team.id, project_id: projectId });
    if (error) return toast.error(error.message);
    toast.success("Proyecto asignado"); onSaved();
  };
  return (
    <Dialog open={!!team} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader><DialogTitle>Asignar proyecto a {team.name}</DialogTitle></DialogHeader>
        <div>
          <Label className="text-xs">Proyecto</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona un proyecto..." /></SelectTrigger>
            <SelectContent className="max-h-72">
              {available.length === 0 ? <div className="px-2 py-3 text-xs text-muted-foreground">No hay proyectos disponibles</div> : available.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} className="bg-primary hover:bg-primary/90">Asignar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignCompetitionDialog({ team, competitions, existing, onClose, onSaved }: { team: Team | null; competitions: Competition[]; existing: TeamCompetition[]; onClose: () => void; onSaved: () => void }) {
  const [compId, setCompId] = useState("");
  const [result, setResult] = useState("");
  useEffect(() => { setCompId(""); setResult(""); }, [team]);
  if (!team) return null;
  const taken = new Set(existing.filter((x) => x.team_id === team.id).map((x) => x.competition_id));
  const available = competitions.filter((c) => !taken.has(c.id));
  const save = async () => {
    if (!compId) return toast.error("Selecciona una competencia");
    const { error } = await supabase.from("team_competitions").insert({ team_id: team.id, competition_id: compId, result: result || null });
    if (error) return toast.error(error.message);
    toast.success("Competencia asignada"); onSaved();
  };
  return (
    <Dialog open={!!team} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader><DialogTitle>Asignar competencia a {team.name}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label className="text-xs">Competencia</Label>
            <Select value={compId} onValueChange={setCompId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona una competencia..." /></SelectTrigger>
              <SelectContent className="max-h-72">
                {available.length === 0 ? <div className="px-2 py-3 text-xs text-muted-foreground">Crea una competencia primero</div> : available.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Resultado (opcional)</Label>
            <Input value={result} onChange={(e) => setResult(e.target.value)} placeholder="Ej. 1er lugar, finalista..." className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} className="bg-primary hover:bg-primary/90">Asignar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewCompetitionDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  useEffect(() => { if (open) { setName(""); setDescription(""); setUrl(""); setEventDate(""); setLocation(""); } }, [open]);
  const save = async () => {
    if (!name.trim()) return toast.error("Ingresa el nombre");
    const { error } = await supabase.from("competitions").insert({
      name: name.trim(), description, url: url || null, event_date: eventDate || null, location: location || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Competencia creada"); onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader><DialogTitle>Nueva competencia</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label className="text-xs">Nombre *</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
          <div><Label className="text-xs">Descripción</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Fecha</Label><Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Lugar</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1" /></div>
          </div>
          <div><Label className="text-xs">URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="mt-1" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} className="bg-primary hover:bg-primary/90">Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
