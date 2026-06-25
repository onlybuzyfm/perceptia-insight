import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Calendar as CalIcon, Users as UsersIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/activities")({
  component: () => <AdminShell><ActivitiesAdmin /></AdminShell>,
});

type Status = "pendiente" | "en_progreso" | "completada";

const STATUS_LABEL: Record<Status, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
};
const STATUS_STYLE: Record<Status, string> = {
  pendiente: "bg-amber-50 text-amber-700 border-amber-200",
  en_progreso: "bg-sky-50 text-sky-700 border-sky-200",
  completada: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

interface ProjectLite { id: string; title: string; status: string }
interface MemberLite { user_id: string; full_name: string; username: string | null }
interface Activity {
  id: string;
  project_id: string;
  project_title: string;
  title: string;
  description: string;
  deadline: string;
  status: Status;
  assignee_ids: string[];
  assignee_names: string[];
}

const ACTIVE_STATUSES = ["activo", "planificacion"] as const;

function ActivitiesAdmin() {
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Activity | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Activity | null>(null);

  const load = async () => {
    setLoading(true);
    const [pr, acts, ass, profs] = await Promise.all([
      supabase.from("projects").select("id, title, status").in("status", ACTIVE_STATUSES).order("title"),
      supabase.from("project_activities").select("id, project_id, title, description, deadline, status").order("deadline"),
      supabase.from("activity_assignees").select("activity_id, user_id"),
      supabase.from("profiles").select("id, full_name, username"),
    ]);

    const projMap = new Map((pr.data ?? []).map((p) => [p.id, p]));
    const profMap = new Map((profs.data ?? []).map((p) => [p.id, p]));
    const assByActivity = new Map<string, string[]>();
    ((ass.data ?? []) as { activity_id: string; user_id: string }[]).forEach((a) => {
      const arr = assByActivity.get(a.activity_id) ?? [];
      arr.push(a.user_id);
      assByActivity.set(a.activity_id, arr);
    });

    setProjects((pr.data ?? []) as ProjectLite[]);
    setActivities(
      ((acts.data ?? []) as Array<{ id: string; project_id: string; title: string; description: string; deadline: string; status: Status }>).map((a) => {
        const ids = assByActivity.get(a.id) ?? [];
        return {
          ...a,
          project_title: projMap.get(a.project_id)?.title ?? "—",
          assignee_ids: ids,
          assignee_names: ids.map((uid) => {
            const p = profMap.get(uid);
            return p?.full_name || p?.username || uid.slice(0, 6);
          }),
        };
      }),
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return projectFilter === "all" ? activities : activities.filter((a) => a.project_id === projectFilter);
  }, [activities, projectFilter]);

  const remove = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("project_activities").delete().eq("id", deleting.id);
    if (error) return toast.error("No se pudo eliminar");
    toast.success("Actividad eliminada");
    setDeleting(null);
    load();
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proyectos activos</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{filtered.length} actividades</span>
          <Button className="ml-auto" onClick={() => setCreating(true)} disabled={projects.length === 0}>
            <Plus className="mr-1.5 h-4 w-4" /> Nueva actividad
          </Button>
        </div>
        {projects.length === 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            No hay proyectos activos. Marca un proyecto como "Activo" o "En planificación" para crear actividades.
          </p>
        )}
      </Card>

      <Card className="border-border/70 bg-white p-0 overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Sin actividades.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((a) => {
              const overdue = a.status !== "completada" && new Date(a.deadline) < new Date();
              return (
                <li key={a.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{a.title}</p>
                        <Badge variant="outline" className={STATUS_STYLE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                        {overdue && <Badge variant="outline" className="border-destructive/40 text-destructive">Vencida</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{a.project_title}</p>
                      {a.description && <p className="mt-1 text-sm text-foreground/80">{a.description}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><CalIcon className="h-3.5 w-3.5" /> {new Date(a.deadline).toLocaleString("es-EC")}</span>
                        <span className="inline-flex items-center gap-1">
                          <UsersIcon className="h-3.5 w-3.5" />
                          {a.assignee_ids.length === 0 ? "Todo el equipo" : a.assignee_names.join(", ")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(a)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {(editing || creating) && (
        <ActivityDialog
          activity={editing}
          projects={projects}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar actividad?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ActivityDialog({
  activity, projects, onClose, onSaved,
}: { activity: Activity | null; projects: ProjectLite[]; onClose: () => void; onSaved: () => void }) {
  const isNew = !activity;
  const [projectId, setProjectId] = useState(activity?.project_id ?? projects[0]?.id ?? "");
  const [title, setTitle] = useState(activity?.title ?? "");
  const [description, setDescription] = useState(activity?.description ?? "");
  const [deadline, setDeadline] = useState(activity ? toLocalInput(activity.deadline) : "");
  const [status, setStatus] = useState<Status>(activity?.status ?? "pendiente");
  const [assignees, setAssignees] = useState<string[]>(activity?.assignee_ids ?? []);
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!projectId) { setMembers([]); return; }
    (async () => {
      const { data: pm } = await supabase.from("project_members").select("user_id").eq("project_id", projectId);
      const ids = (pm ?? []).map((r) => r.user_id);
      if (ids.length === 0) { setMembers([]); return; }
      const { data: profs } = await supabase.from("profiles").select("id, full_name, username").in("id", ids);
      setMembers((profs ?? []).map((p) => ({ user_id: p.id, full_name: p.full_name, username: p.username })));
    })();
  }, [projectId]);

  const toggle = (uid: string) => {
    setAssignees((cur) => cur.includes(uid) ? cur.filter((x) => x !== uid) : [...cur, uid]);
  };

  const save = async () => {
    if (!projectId) return toast.error("Selecciona un proyecto");
    if (!title.trim()) return toast.error("El título es obligatorio");
    if (!deadline) return toast.error("Define la fecha límite");
    setSaving(true);
    const payload = {
      project_id: projectId,
      title: title.trim(),
      description: description.trim(),
      deadline: new Date(deadline).toISOString(),
      status,
    };
    let activityId = activity?.id;
    if (isNew) {
      const { data, error } = await supabase.from("project_activities").insert(payload).select("id").single();
      if (error) { setSaving(false); return toast.error("No se pudo crear: " + error.message); }
      activityId = (data as { id: string }).id;
    } else {
      const { error } = await supabase.from("project_activities").update(payload).eq("id", activity!.id);
      if (error) { setSaving(false); return toast.error("No se pudo guardar: " + error.message); }
      await supabase.from("activity_assignees").delete().eq("activity_id", activity!.id);
    }
    if (activityId && assignees.length > 0) {
      const { error: assErr } = await supabase.from("activity_assignees")
        .insert(assignees.map((uid) => ({ activity_id: activityId!, user_id: uid })));
      if (assErr) { setSaving(false); return toast.error("Guardado pero falló asignación: " + assErr.message); }
    }

    // Notificación Telegram a los asignados + grupos (solo cuando hay asignados)
    if (activityId && assignees.length > 0 && isNew) {
      try {
        const { sendTelegramNotification, broadcastTelegramToGroups } = await import("@/lib/telegram.functions");
        const dlLabel = new Date(deadline).toLocaleString("es-CO", { dateStyle: "full", timeStyle: "short" });
        await Promise.allSettled([
          ...assignees.map((uid) =>
            sendTelegramNotification({
              data: {
                targetUserId: uid,
                kind: "activity_assigned",
                title: `📝 Nueva actividad: ${title.trim()}`,
                body: `Fecha límite: ${dlLabel}${description ? `\n\n${description}` : ""}`,
              },
            }),
          ),
          broadcastTelegramToGroups({
            data: {
              kind: "activity_created",
              title: `📝 Nueva actividad: ${title.trim()}`,
              body: `Fecha límite: ${dlLabel}${description ? `\n\n${description}` : ""}\n\nAsignados: ${assignees.length} estudiante(s).`,
            },
          }),
        ]);
      } catch { /* ignore */ }
    }

    setSaving(false);
    toast.success(isNew ? "Actividad creada" : "Cambios guardados");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isNew ? "Nueva actividad" : "Editar actividad"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 max-h-[70vh] overflow-y-auto">
          <div className="grid gap-1.5">
            <Label>Proyecto</Label>
            <Select value={projectId} onValueChange={(v) => { setProjectId(v); setAssignees([]); }} disabled={!isNew}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div className="grid gap-1.5">
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Fecha y hora límite</Label>
              <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_progreso">En progreso</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2 rounded-md border border-border/60 bg-secondary/30 p-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Asignar a integrantes específicos</Label>
              <span className="text-xs text-muted-foreground">
                {assignees.length === 0 ? "Visible para todo el equipo" : `${assignees.length} seleccionado(s)`}
              </span>
            </div>
            {members.length === 0 ? (
              <p className="text-xs text-muted-foreground">Este proyecto aún no tiene integrantes.</p>
            ) : (
              <ul className="grid gap-1.5 sm:grid-cols-2 max-h-48 overflow-y-auto">
                {members.map((m) => (
                  <li key={m.user_id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-background">
                    <Checkbox
                      id={`a-${m.user_id}`}
                      checked={assignees.includes(m.user_id)}
                      onCheckedChange={() => toggle(m.user_id)}
                    />
                    <label htmlFor={`a-${m.user_id}`} className="cursor-pointer text-sm">
                      {m.full_name || m.username || m.user_id.slice(0, 6)}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-muted-foreground">
              Si no seleccionas a nadie, la actividad se considera para todo el equipo del proyecto.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
