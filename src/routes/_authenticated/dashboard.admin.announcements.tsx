import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Megaphone, Archive, ArchiveRestore, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/announcements")({
  component: AdminAnnouncements,
});

interface Row {
  id: string;
  title: string;
  content: string;
  archived: boolean;
  created_at: string;
}

function AdminAnnouncements() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"active" | "archived" | "all">("active");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, content, archived, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!title.trim()) return toast.error("El título es obligatorio");
    setCreating(true);
    const { error } = await supabase.from("announcements").insert({
      title: title.trim(),
      content: content.trim(),
      audience: "estudiante",
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    setTitle(""); setContent("");
    toast.success("Anuncio publicado");
    load();
  };

  const toggleArchive = async (row: Row) => {
    const { error } = await supabase
      .from("announcements")
      .update({ archived: !row.archived })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success(row.archived ? "Restaurado" : "Archivado");
    load();
  };

  const remove = async (row: Row) => {
    if (!confirm(`¿Eliminar "${row.title}"?`)) return;
    const { error } = await supabase.from("announcements").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    load();
  };

  const now = Date.now();
  const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
  const filtered = items.filter((r) => {
    if (filter === "archived") return r.archived;
    if (filter === "active") return !r.archived;
    return true;
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-semibold">Anuncios</h1>
        </div>

        <Card className="border-border/70 p-6">
          <h2 className="font-display text-lg font-semibold">Nuevo anuncio</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Los anuncios aparecen en el dashboard de los estudiantes durante 10 días, luego se ocultan automáticamente. Puedes archivarlos antes para retirarlos manualmente.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <Label>Título</Label>
              <Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            </div>
            <div>
              <Label>Contenido</Label>
              <Textarea className="mt-1.5" rows={3} value={content} onChange={(e) => setContent(e.target.value)} maxLength={1000} />
            </div>
            <Button onClick={create} disabled={creating}>
              <Plus className="mr-1.5 h-4 w-4" /> {creating ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </Card>

        <Card className="border-border/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Historial</h2>
            <div className="flex gap-1 rounded-md border border-border/60 p-1">
              {(["active", "archived", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded px-3 py-1 text-xs font-medium ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {f === "active" ? "Activos" : f === "archived" ? "Archivados" : "Todos"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Sin anuncios.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {filtered.map((r) => {
                const age = now - new Date(r.created_at).getTime();
                const expired = age > tenDaysMs;
                return (
                  <li key={r.id} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">{r.title}</p>
                          {r.archived && <Badge variant="secondary">Archivado</Badge>}
                          {!r.archived && expired && <Badge variant="outline">Caducado (oculto)</Badge>}
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{r.content}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleArchive(r)}>
                          {r.archived ? <><ArchiveRestore className="mr-1 h-3.5 w-3.5" />Restaurar</> : <><Archive className="mr-1 h-3.5 w-3.5" />Archivar</>}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(r)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
