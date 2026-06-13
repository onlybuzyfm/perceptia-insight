import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Plus, FolderKanban, Users, FileCheck2, Star, ArrowLeft, Briefcase } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/teacher")({
  component: TeacherDashboard,
});

type ProjectStatus = "propuesto" | "planificacion" | "activo" | "pausado" | "finalizado" | "publicado" | "archivado";

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "propuesto", label: "Propuesto" },
  { value: "planificacion", label: "En planificación" },
  { value: "activo", label: "Activo" },
  { value: "pausado", label: "Pausado" },
  { value: "finalizado", label: "Finalizado" },
];

interface ProjectCard {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  is_published: boolean;
  line: string | null;
  members_count: number;
  updates_count: number;
  pending_evals: number;
}

interface MemberRow {
  user_id: string;
  role_in_project: string;
  full_name: string;
  email: string | null;
  username: string | null;
}

interface UpdateRow {
  id: string;
  user_id: string;
  week_start: string;
  summary: string;
  achievements: string | null;
  blockers: string | null;
  hours_spent: number | null;
  repo_url: string | null;
  evidence_url: string | null;
  author_name?: string;
  my_eval?: { id: string; score: number; comment: string | null } | null;
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

function TeacherDashboard() {
  const auth = useAuth();
  const isTeacher = auth.hasRole("docente_asociado") || auth.hasRole("admin");

  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<ProjectCard | null>(null);

  const load = async () => {
    if (!auth.user) return;
    setLoading(true);
    // Mis proyectos = donde soy 'docente' en project_members
    const { data: mine } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", auth.user.id)
      .eq("role_in_project", "docente");
    const ids = (mine ?? []).map((m) => m.project_id);
    if (ids.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }
    const [{ data: projs }, { data: members }, { data: updates }, { data: myEvals }] = await Promise.all([
      supabase.from("projects").select("id, title, slug, description, status, is_published, line").in("id", ids),
      supabase.from("project_members").select("project_id").in("project_id", ids),
      supabase.from("weekly_updates").select("id, project_id").in("project_id", ids),
      supabase.from("evaluations").select("weekly_update_id").eq("evaluator_id", auth.user.id),
    ]);

    const updateIdsByProject = new Map<string, string[]>();
    (updates ?? []).forEach((u) => {
      if (!u.project_id) return;
      const arr = updateIdsByProject.get(u.project_id) ?? [];
      arr.push(u.id);
      updateIdsByProject.set(u.project_id, arr);
    });
    const evaluatedIds = new Set((myEvals ?? []).map((e) => e.weekly_update_id));

    const membersCount = new Map<string, number>();
    (members ?? []).forEach((m) => membersCount.set(m.project_id, (membersCount.get(m.project_id) ?? 0) + 1));

    setProjects(
      (projs ?? []).map((p) => {
        const upIds = updateIdsByProject.get(p.id) ?? [];
        const pending = upIds.filter((id) => !evaluatedIds.has(id)).length;
        return {
          ...(p as Omit<ProjectCard, "members_count" | "updates_count" | "pending_evals">),
          members_count: membersCount.get(p.id) ?? 0,
          updates_count: upIds.length,
          pending_evals: pending,
        };
      }),
    );
    setLoading(false);
  };

  useEffect(() => { if (isTeacher) load(); }, [auth.user]);

  if (!auth.isLoading && !isTeacher) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardShell title="Panel docente">
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white">
          <Briefcase className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">Docente asociado</p>
          <p className="text-xs text-amber-800/80">
            Plantea proyectos, registra avances en tus proyectos y evalúa el progreso de tu equipo.
          </p>
        </div>
        {!selected && (
          <Button onClick={() => setCreating(true)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="mr-1.5 h-4 w-4" /> Nuevo proyecto
          </Button>
        )}
      </div>

      {selected ? (
        <ProjectDetail
          project={selected}
          onBack={() => { setSelected(null); load(); }}
        />
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : projects.length === 0 ? (
        <Card className="border-dashed border-amber-300 bg-amber-50/40 p-10 text-center">
          <FolderKanban className="mx-auto h-10 w-10 text-amber-500" />
          <h3 className="mt-3 font-display text-lg font-semibold text-foreground">Aún no tienes proyectos</h3>
          <p className="mt-1 text-sm text-muted-foreground">Crea tu primer proyecto para comenzar a registrar avances.</p>
          <Button onClick={() => setCreating(true)} className="mt-4 bg-amber-600 hover:bg-amber-700">
            <Plus className="mr-1.5 h-4 w-4" /> Nuevo proyecto
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="group text-left"
            >
              <Card className="h-full border-border/70 p-5 transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <FolderKanban className="h-5 w-5 text-amber-600" />
                  <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                </div>
                <h3 className="mt-3 font-display text-base font-semibold text-foreground">{p.title}</h3>
                {p.line && <p className="mt-0.5 text-xs text-muted-foreground">{p.line}</p>}
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.description || "Sin descripción."}</p>
                <div className="mt-4 flex items-center gap-3 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {p.members_count}</span>
                  <span className="flex items-center gap-1"><FileCheck2 className="h-3 w-3" /> {p.updates_count}</span>
                  {p.pending_evals > 0 && (
                    <Badge className="ml-auto bg-amber-500 hover:bg-amber-500 text-white text-[10px]">
                      {p.pending_evals} por evaluar
                    </Badge>
                  )}
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      {creating && <NewProjectDialog onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}
    </DashboardShell>
  );
}

function NewProjectDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const auth = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [line, setLine] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("propuesto");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!auth.user) return;
    if (!title.trim()) return toast.error("El título es obligatorio");
    setSaving(true);
    const slug = slugify(title);
    const { data: proj, error } = await supabase
      .from("projects")
      .insert({
        title: title.trim(),
        slug,
        description: description.trim(),
        status,
        line: line.trim() || null,
        is_published: false,
      })
      .select("id")
      .single();
    if (error || !proj) {
      setSaving(false);
      return toast.error(error?.message || "No se pudo crear");
    }
    // Auto-asignar al docente como miembro 'docente'
    const { error: memErr } = await supabase
      .from("project_members")
      .insert({ project_id: proj.id, user_id: auth.user.id, role_in_project: "docente" });
    setSaving(false);
    if (memErr) return toast.error("Proyecto creado, pero no se pudo asignarte como docente: " + memErr.message);
    toast.success("Proyecto creado");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo proyecto</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Detección de plagas con CV" />
          </div>
          <div className="grid gap-1.5">
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Línea</Label>
              <Input value={line} onChange={(e) => setLine(e.target.value)} placeholder="Ej. Visión artificial" />
            </div>
            <div className="grid gap-1.5">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
            {saving ? "Creando…" : "Crear proyecto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProjectDetail({ project, onBack }: { project: ProjectCard; onBack: () => void }) {
  const auth = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [updates, setUpdates] = useState<UpdateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: mems }, { data: ups }] = await Promise.all([
      supabase.from("project_members").select("user_id, role_in_project").eq("project_id", project.id),
      supabase.from("weekly_updates").select("*").eq("project_id", project.id).order("week_start", { ascending: false }),
    ]);

    const userIds = Array.from(new Set([...(mems ?? []).map((m) => m.user_id), ...(ups ?? []).map((u) => u.user_id)]));
    const profMap = new Map<string, { full_name: string; email: string | null; username: string | null }>();
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email, username")
        .in("id", userIds);
      (profs ?? []).forEach((p) => profMap.set(p.id, { full_name: p.full_name ?? "", email: p.email, username: p.username }));
    }

    let evalMap = new Map<string, { id: string; score: number; comment: string | null }>();
    if ((ups ?? []).length > 0 && auth.user) {
      const { data: evs } = await supabase
        .from("evaluations")
        .select("id, weekly_update_id, score, comment")
        .in("weekly_update_id", (ups ?? []).map((u) => u.id))
        .eq("evaluator_id", auth.user.id);
      (evs ?? []).forEach((e) => evalMap.set(e.weekly_update_id, { id: e.id, score: e.score, comment: e.comment }));
    }

    setMembers(
      (mems ?? []).map((m) => ({
        user_id: m.user_id,
        role_in_project: m.role_in_project,
        full_name: profMap.get(m.user_id)?.full_name || "(sin nombre)",
        email: profMap.get(m.user_id)?.email ?? null,
        username: profMap.get(m.user_id)?.username ?? null,
      })),
    );
    setUpdates(
      (ups ?? []).map((u) => ({
        ...u,
        author_name: profMap.get(u.user_id)?.full_name || "Estudiante",
        my_eval: evalMap.get(u.id) ?? null,
      })),
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, [project.id]);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a mis proyectos
      </button>

      <Card className="border-border/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{project.title}</h2>
            <p className="text-xs text-muted-foreground">/{project.slug} · {project.line ?? "Sin línea"}</p>
            <p className="mt-2 text-sm text-muted-foreground">{project.description || "Sin descripción."}</p>
          </div>
          <Badge variant="outline">{project.status}</Badge>
        </div>
      </Card>

      <Tabs defaultValue="updates">
        <TabsList>
          <TabsTrigger value="updates">Avances ({updates.length})</TabsTrigger>
          <TabsTrigger value="team">Equipo ({members.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="updates" className="mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : updates.length === 0 ? (
            <Card className="border-dashed p-8 text-center">
              <FileCheck2 className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Aún no hay avances en este proyecto.</p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {updates.map((u) => (
                <UpdateItem key={u.id} update={u} onSaved={load} />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="team" className="mt-4 space-y-3">
          <AddMember projectId={project.id} existingIds={members.map((m) => m.user_id)} open={addingMember} setOpen={setAddingMember} onAdded={load} />
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin integrantes aún.</p>
          ) : (
            <ul className="divide-y divide-border/60 rounded-lg border border-border/70 bg-white">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between p-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.username ? <span className="font-mono text-primary">@{m.username}</span> : null}
                      {m.email && <span className="ml-2">{m.email}</span>}
                    </p>
                  </div>
                  <Badge variant={m.role_in_project === "docente" ? "default" : "outline"}>{m.role_in_project}</Badge>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UpdateItem({ update, onSaved }: { update: UpdateRow; onSaved: () => void }) {
  const auth = useAuth();
  const [score, setScore] = useState<number>(update.my_eval?.score ?? 0);
  const [comment, setComment] = useState(update.my_eval?.comment ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!auth.user) return;
    if (score < 1 || score > 5) return toast.error("Calificación entre 1 y 5");
    setSaving(true);
    const payload = {
      weekly_update_id: update.id,
      evaluator_id: auth.user.id,
      score,
      comment: comment.trim() || null,
    };
    const { error } = update.my_eval
      ? await supabase.from("evaluations").update({ score, comment: comment.trim() || null }).eq("id", update.my_eval.id)
      : await supabase.from("evaluations").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Evaluación guardada");
    onSaved();
  };

  return (
    <li className="rounded-lg border border-border/70 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{update.author_name}</p>
          <p className="text-xs text-muted-foreground">Semana del {update.week_start} · {update.hours_spent ?? 0} h</p>
        </div>
        {update.my_eval && (
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3 fill-current" /> Evaluado {update.my_eval.score}/5
          </Badge>
        )}
      </div>
      <p className="mt-2 text-sm text-foreground">{update.summary}</p>
      {update.achievements && <p className="mt-1.5 text-xs text-muted-foreground"><b className="text-foreground">Logros:</b> {update.achievements}</p>}
      {update.blockers && <p className="mt-1 text-xs text-muted-foreground"><b className="text-foreground">Bloqueos:</b> {update.blockers}</p>}
      {update.repo_url && (
        <a href={update.repo_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">
          ↗ Repositorio
        </a>
      )}

      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50/40 p-3">
        <p className="text-xs font-semibold text-amber-900">Tu evaluación</p>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              className="rounded p-0.5 transition-colors hover:bg-amber-100"
              aria-label={`${n} estrellas`}
            >
              <Star className={`h-5 w-5 ${n <= score ? "fill-amber-500 text-amber-500" : "text-amber-300"}`} />
            </button>
          ))}
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Retroalimentación para el estudiante…"
          rows={2}
          className="mt-2 text-sm"
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={save} disabled={saving || score === 0} className="bg-amber-600 hover:bg-amber-700">
            {saving ? "Guardando…" : update.my_eval ? "Actualizar" : "Enviar evaluación"}
          </Button>
        </div>
      </div>
    </li>
  );
}

function AddMember({
  projectId,
  existingIds,
  open,
  setOpen,
  onAdded,
}: {
  projectId: string;
  existingIds: string[];
  open: boolean;
  setOpen: (v: boolean) => void;
  onAdded: () => void;
}) {
  const [students, setStudents] = useState<Array<{ id: string; full_name: string; username: string | null }>>([]);
  const [selected, setSelectedId] = useState<string>("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username")
        .eq("is_active", true)
        .order("full_name");
      setStudents((data ?? []).filter((p) => !existingIds.includes(p.id)));
    })();
  }, [open, existingIds]);

  const candidates = useMemo(() => students, [students]);

  const add = async () => {
    if (!selected) return;
    setAdding(true);
    const { error } = await supabase
      .from("project_members")
      .insert({ project_id: projectId, user_id: selected, role_in_project: "integrante" });
    setAdding(false);
    if (error) return toast.error(error.message);
    toast.success("Integrante agregado");
    setOpen(false);
    setSelectedId("");
    onAdded();
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-dashed border-border/70 p-3">
      <p className="text-xs text-muted-foreground">Suma estudiantes para que puedan registrar avances aquí.</p>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Agregar integrante
      </Button>
      {open && (
        <Dialog open onOpenChange={(o) => !o && setOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Agregar integrante</DialogTitle></DialogHeader>
            <div className="py-2">
              <Label>Estudiante</Label>
              <Select value={selected} onValueChange={setSelectedId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>
                  {candidates.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name}{s.username ? ` · @${s.username}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={add} disabled={adding || !selected} className="bg-amber-600 hover:bg-amber-700">
                {adding ? "Agregando…" : "Agregar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
