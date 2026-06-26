import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Pencil, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { IconPicker } from "@/components/IconPicker";

export const Route = createFileRoute("/_authenticated/dashboard/admin/projects")({
  component: () => <AdminShell><ProjectsAdmin /></AdminShell>,
});

type ProjectStatus = "propuesto" | "planificacion" | "activo" | "pausado" | "finalizado" | "publicado" | "archivado";

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "propuesto", label: "Propuesto" },
  { value: "planificacion", label: "En planificación" },
  { value: "activo", label: "Activo" },
  { value: "pausado", label: "Pausado" },
  { value: "finalizado", label: "Finalizado" },
  { value: "publicado", label: "Publicado" },
  { value: "archivado", label: "Archivado" },
];

const STATUS_STYLES: Record<ProjectStatus, string> = {
  propuesto: "bg-muted text-muted-foreground border-border",
  planificacion: "bg-amber-50 text-amber-700 border-amber-200",
  activo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pausado: "bg-orange-50 text-orange-700 border-orange-200",
  finalizado: "bg-sky-50 text-sky-700 border-sky-200",
  publicado: "bg-primary-soft text-primary border-primary/20",
  archivado: "bg-zinc-100 text-zinc-600 border-zinc-200",
};


interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  is_published: boolean;
  icon: string | null;
  line: string | null;
  created_at: string;
}

interface ResearchLine {
  id: string;
  title: string;
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

function ProjectsAdmin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [lines, setLines] = useState<ResearchLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const load = async () => {
    setLoading(true);
    const [projRes, linesRes] = await Promise.all([
      supabase
        .from("projects")
        .select("id, title, slug, description, status, is_published, icon, line, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("research_lines")
        .select("id, title")
        .order("display_order", { ascending: true }),
    ]);
    if (projRes.error) toast.error("Error al cargar proyectos");
    if (linesRes.error) toast.error("Error al cargar líneas");
    setProjects((projRes.data ?? []) as Project[]);
    setLines((linesRes.data ?? []) as ResearchLine[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (q) {
        const t = q.toLowerCase();
        if (!p.title.toLowerCase().includes(t) && !(p.line ?? "").toLowerCase().includes(t)) return false;
      }
      return true;
    });
  }, [projects, q, statusFilter]);

  const togglePublished = async (p: Project) => {
    const { error } = await supabase.from("projects").update({ is_published: !p.is_published }).eq("id", p.id);
    if (error) return toast.error("No se pudo actualizar");
    toast.success(p.is_published ? "Despublicado" : "Publicado");
    load();
  };

  const quickStatus = async (p: Project, status: ProjectStatus) => {
    const { error } = await supabase.from("projects").update({ status }).eq("id", p.id);
    if (error) return toast.error("No se pudo cambiar el estado");
    toast.success("Estado actualizado");
    load();
  };

  const remove = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("projects").delete().eq("id", deleting.id);
    if (error) return toast.error("No se pudo eliminar");
    toast.success("Proyecto eliminado");
    setDeleting(null);
    load();
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título o línea…" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Nuevo proyecto
          </Button>
        </div>
      </Card>

      <Card className="border-border/70 bg-white p-0 overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Sin proyectos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Proyecto</th>
                  <th className="px-4 py-2.5 text-left font-medium">Línea</th>
                  <th className="px-4 py-2.5 text-left font-medium">Estado</th>
                  <th className="px-4 py-2.5 text-left font-medium">Público</th>
                  <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{p.title}</div>
                      <div className="text-xs text-muted-foreground">/{p.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.line ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Select value={p.status} onValueChange={(v) => quickStatus(p, v as ProjectStatus)}>
                        <SelectTrigger className={`h-8 w-[150px] ${STATUS_STYLES[p.status]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublished(p)}
                        className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium ${p.is_published ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}
                      >
                        {p.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {p.is_published ? "Visible" : "Oculto"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(p)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {(editing || creating) && (
        <ProjectDialog
          project={editing}
          lines={lines}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará "{deleting?.title}".
            </AlertDialogDescription>
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

function ProjectDialog({ project, lines, onClose, onSaved }: { project: Project | null; lines: ResearchLine[]; onClose: () => void; onSaved: () => void }) {
  const isNew = !project;
  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "propuesto");
  const [isPublished, setIsPublished] = useState(project?.is_published ?? true);
  const [icon, setIcon] = useState(project?.icon ?? "globe");
  const [line, setLine] = useState(project?.line ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slugTouched && isNew) setSlug(slugify(title));
  }, [title, slugTouched, isNew]);

  const save = async () => {
    if (!title.trim()) return toast.error("El título es obligatorio");
    if (!slug.trim()) return toast.error("El slug es obligatorio");
    setSaving(true);
    const payload = {
      title: title.trim(), slug: slug.trim(), description: description.trim(),
      status, is_published: isPublished, icon, line: line || null,
    };
    const { error } = isNew
      ? await supabase.from("projects").insert(payload)
      : await supabase.from("projects").update(payload).eq("id", project!.id);
    setSaving(false);
    if (error) {
      if (error.code === "23505") return toast.error("Ya existe un proyecto con ese slug");
      return toast.error("No se pudo guardar");
    }
    toast.success(isNew ? "Proyecto creado" : "Cambios guardados");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isNew ? "Nuevo proyecto" : "Editar proyecto"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Slug (URL)</Label>
            <Input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} />
          </div>
          <div className="grid gap-1.5">
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Línea del semillero</Label>
              {lines.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-md border border-dashed border-border/60 px-3 py-2">
                  No hay líneas del semillero disponibles.
                </p>
              ) : (
                <Select value={line || undefined} onValueChange={setLine}>
                  <SelectTrigger><SelectValue placeholder="Selecciona una línea del semillero" /></SelectTrigger>
                  <SelectContent>
                    {lines.map((l) => <SelectItem key={l.id} value={l.title}>{l.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Ícono</Label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>
            <div className="flex items-end gap-3 pb-1">
              <div className="flex items-center gap-2">
                <Switch checked={isPublished} onCheckedChange={setIsPublished} id="pub" />
                <Label htmlFor="pub" className="cursor-pointer">Visible al público</Label>
              </div>
            </div>
          </div>
          <div className="rounded-md border border-border/60 bg-secondary/30 p-3">
            <Badge variant="outline" className={STATUS_STYLES[status]}>{STATUS_OPTIONS.find((s) => s.value === status)?.label}</Badge>
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
