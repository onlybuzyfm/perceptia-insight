import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/resources")({
  component: () => <AdminShell><ResourcesAdmin /></AdminShell>,
});

type Category = "moodle" | "dataset" | "cvat" | "notion" | "github" | "drive" | "n8n" | "otro";
const CATEGORIES: Category[] = ["moodle", "dataset", "cvat", "notion", "github", "drive", "n8n", "otro"];

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: Category;
  project_id: string | null;
  display_order: number;
}

interface ProjectOpt { id: string; title: string }

function ResourcesAdmin() {
  const [items, setItems] = useState<Resource[]>([]);
  const [projects, setProjects] = useState<ProjectOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    category: "drive" as Category,
    project_id: "global" as string,
  });

  async function load() {
    setLoading(true);
    const [r, p] = await Promise.all([
      supabase.from("resources").select("*").order("display_order"),
      supabase.from("projects").select("id, title").order("title"),
    ]);
    setItems((r.data ?? []) as Resource[]);
    setProjects((p.data ?? []) as ProjectOpt[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error("Título y URL son obligatorios");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("resources").insert({
      title: form.title.trim(),
      description: form.description.trim(),
      url: form.url.trim(),
      category: form.category,
      project_id: form.project_id === "global" ? null : form.project_id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Recurso creado");
    setOpen(false);
    setForm({ title: "", description: "", url: "", category: "drive", project_id: "global" });
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este recurso?")) return;
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Eliminado");
    load();
  }

  const projectName = (id: string | null) =>
    id ? projects.find((p) => p.id === id)?.title ?? "—" : "Global";

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Recursos del semillero</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Enlaza datasets, carpetas en Drive, repos u otros recursos. Si asignas un proyecto, solo sus integrantes lo verán.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4" /> Nuevo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo recurso</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Título</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>URL</Label>
                  <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://drive.google.com/..." />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Categoría</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Proyecto</Label>
                    <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Global (todos)</SelectItem>
                        {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={create} disabled={saving}>{saving ? "Guardando..." : "Crear"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <Card className="border-border/70 bg-white">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Aún no hay recursos.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Enlace</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.title}</div>
                    {r.description && <div className="text-xs text-muted-foreground line-clamp-1">{r.description}</div>}
                  </TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{r.category}</Badge></TableCell>
                  <TableCell className="text-sm">{projectName(r.project_id)}</TableCell>
                  <TableCell>
                    <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      Abrir <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
