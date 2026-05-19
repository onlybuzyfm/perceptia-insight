import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Search, Download, FileCheck2, Trash2, Eye, ExternalLink, Github, Paperclip } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/updates")({
  component: () => <AdminShell><UpdatesAdmin /></AdminShell>,
});

interface Update {
  id: string;
  user_id: string;
  project_id: string | null;
  week_start: string;
  summary: string;
  achievements: string | null;
  blockers: string | null;
  hours_spent: number | null;
  repo_url: string | null;
  evidence_url: string | null;
  created_at: string;
  full_name: string;
  username: string | null;
  project_title: string | null;
}

function UpdatesAdmin() {
  const [rows, setRows] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [detail, setDetail] = useState<Update | null>(null);

  const load = async () => {
    setLoading(true);
    const [ups, profs, projs] = await Promise.all([
      supabase.from("weekly_updates").select("*").order("week_start", { ascending: false }).limit(500),
      supabase.from("profiles").select("id, full_name, username"),
      supabase.from("projects").select("id, title"),
    ]);
    const profMap = new Map((profs.data ?? []).map((p) => [p.id, p]));
    const projMap = new Map((projs.data ?? []).map((p) => [p.id, p.title]));
    setRows((ups.data ?? []).map((u) => {
      const p = profMap.get(u.user_id);
      return {
        ...u,
        full_name: p?.full_name || "(sin nombre)",
        username: p?.username ?? null,
        project_title: u.project_id ? projMap.get(u.project_id) ?? null : null,
      };
    }));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const users = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.user_id, r.full_name));
    return Array.from(map.entries());
  }, [rows]);
  const projectsList = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => { if (r.project_id && r.project_title) map.set(r.project_id, r.project_title); });
    return Array.from(map.entries());
  }, [rows]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (userFilter !== "all" && r.user_id !== userFilter) return false;
    if (projectFilter !== "all" && r.project_id !== projectFilter) return false;
    if (q && !`${r.full_name} ${r.summary} ${r.achievements ?? ""} ${r.blockers ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [rows, q, userFilter, projectFilter]);

  const totalHours = useMemo(() => filtered.reduce((sum, r) => sum + Number(r.hours_spent ?? 0), 0), [filtered]);

  const deleteUpdate = async (id: string, name: string, week: string) => {
    if (!confirm(`¿Eliminar el avance de ${name} (semana ${week})? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from("weekly_updates").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Avance eliminado");
    setRows((prev) => prev.filter((r) => r.id !== id));
    setDetail(null);
  };

  const downloadEvidence = async (path: string) => {
    const { data, error } = await supabase.storage.from("update-evidences").createSignedUrl(path, 600, { download: true });
    if (error || !data) { toast.error("No se pudo generar el enlace de descarga"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const openEvidence = async (path: string) => {
    const { data, error } = await supabase.storage.from("update-evidences").createSignedUrl(path, 600);
    if (error || !data) { toast.error("No se pudo abrir la evidencia"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const exportCSV = () => {
    const headers = ["Semana", "Estudiante", "Proyecto", "Resumen", "Logros", "Bloqueos", "Horas", "Repositorio", "Evidencia"];
    const data = filtered.map((r) => [
      r.week_start, r.full_name, r.project_title ?? "—",
      r.summary, r.achievements ?? "", r.blockers ?? "", String(r.hours_spent ?? 0),
      r.repo_url ?? "", r.evidence_url ?? "",
    ]);
    const csv = [headers, ...data].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `avances-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por estudiante o contenido..." className="pl-9" />
          </div>
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estudiantes</SelectItem>
              {users.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proyectos</SelectItem>
              {projectsList.map(([id, title]) => <SelectItem key={id} value={id}>{title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><FileCheck2 className="h-3.5 w-3.5" /> {filtered.length} avances</span>
          <span>· {totalHours.toFixed(1)} horas reportadas</span>
        </div>
      </Card>

      <Card className="border-border/70 bg-white p-0 overflow-x-auto">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Sin avances registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Semana</th>
                <th className="px-4 py-3">Estudiante</th>
                <th className="px-4 py-3">Proyecto</th>
                <th className="px-4 py-3">Resumen</th>
                <th className="px-4 py-3">Adjuntos</th>
                <th className="px-4 py-3 text-right">Horas</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((r) => (
                <tr key={r.id} className="align-top hover:bg-secondary/30">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.week_start}</td>
                  <td className="px-4 py-2.5 font-medium text-foreground">{r.full_name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {r.project_title ? <Badge variant="outline">{r.project_title}</Badge> : "—"}
                  </td>
                  <td className="max-w-[320px] px-4 py-2.5 text-foreground/80">
                    <p className="line-clamp-2">{r.summary}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col gap-1 text-xs">
                      {r.repo_url && (
                        <a href={r.repo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <Github className="h-3 w-3" /> Repo
                        </a>
                      )}
                      {r.evidence_url && (
                        <button type="button" onClick={() => openEvidence(r.evidence_url!)} className="inline-flex items-center gap-1 text-primary hover:underline">
                          <Paperclip className="h-3 w-3" /> Evidencia
                        </button>
                      )}
                      {!r.repo_url && !r.evidence_url && <span className="text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{Number(r.hours_spent ?? 0).toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => setDetail(r)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUpdate(r.id, r.full_name, r.week_start)}
                        className="h-7 border-destructive/40 px-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>Avance — semana del {detail.week_start}</DialogTitle>
                <DialogDescription>
                  {detail.full_name}{detail.username ? ` · @${detail.username}` : ""}
                  {detail.project_title ? ` · ${detail.project_title}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <Badge variant="outline">{Number(detail.hours_spent ?? 0).toFixed(1)} h dedicadas</Badge>
                  <span>Registrado: {new Date(detail.created_at).toLocaleString()}</span>
                </div>

                <Section title="Resumen">{detail.summary}</Section>
                <Section title="Logros">{detail.achievements || "—"}</Section>
                <Section title="Bloqueos">{detail.blockers || "—"}</Section>

                <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border/60">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Repositorio</p>
                    {detail.repo_url ? (
                      <a href={detail.repo_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline break-all">
                        <Github className="h-3.5 w-3.5 shrink-0" /> {detail.repo_url}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">No adjuntó repositorio.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidencia</p>
                    {detail.evidence_url ? (
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEvidence(detail.evidence_url!)}>
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Ver
                        </Button>
                        <Button size="sm" onClick={() => downloadEvidence(detail.evidence_url!)}>
                          <Download className="mr-1.5 h-3.5 w-3.5" /> Descargar
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">No adjuntó evidencia.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1 whitespace-pre-wrap text-foreground">{children}</p>
    </div>
  );
}
