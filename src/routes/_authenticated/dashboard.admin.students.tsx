import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Pencil, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/students")({
  component: () => <AdminShell><StudentsAdmin /></AdminShell>,
});

interface Student {
  id: string;
  full_name: string;
  email: string | null;
  carrera: string | null;
  semestre: string | null;
  paralelo: string | null;
  codigo_estudiantil: string | null;
  is_active: boolean;
  interest_line_id: string | null;
  project_ids: string[];
  project_titles: string[];
}

interface ResearchLine { id: string; title: string }

function StudentsAdmin() {
  const [students, setStudents] = useState<Student[]>([]);
  const [lines, setLines] = useState<ResearchLine[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [carreraFilter, setCarreraFilter] = useState("all");
  const [semestreFilter, setSemestreFilter] = useState("all");
  const [paraleloFilter, setParaleloFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lineFilter, setLineFilter] = useState("all");

  const [editing, setEditing] = useState<Student | null>(null);

  const load = async () => {
    setLoading(true);
    // estudiantes = profiles cuyo user_id tiene rol estudiante
    const { data: roleRows } = await supabase.from("user_roles").select("user_id").eq("role", "estudiante");
    const ids = (roleRows ?? []).map((r) => r.user_id);
    if (ids.length === 0) {
      setStudents([]); setLoading(false); return;
    }
    const [profs, ls, members, projs] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, carrera, semestre, paralelo, codigo_estudiantil, is_active, interest_line_id").in("id", ids),
      supabase.from("research_lines").select("id, title").order("display_order"),
      supabase.from("project_members").select("user_id, project_id").in("user_id", ids),
      supabase.from("projects").select("id, title"),
    ]);
    const projMap = new Map<string, string>((projs.data ?? []).map((p) => [p.id, p.title]));
    const memberMap = new Map<string, string[]>();
    (members.data ?? []).forEach((m) => {
      const arr = memberMap.get(m.user_id) ?? [];
      arr.push(m.project_id);
      memberMap.set(m.user_id, arr);
    });

    setStudents((profs.data ?? []).map((p) => ({
      id: p.id,
      full_name: p.full_name || "(sin nombre)",
      email: p.email,
      carrera: p.carrera,
      semestre: p.semestre,
      paralelo: p.paralelo,
      codigo_estudiantil: p.codigo_estudiantil,
      is_active: p.is_active ?? true,
      interest_line_id: p.interest_line_id,
      project_ids: memberMap.get(p.id) ?? [],
      project_titles: (memberMap.get(p.id) ?? []).map((id) => projMap.get(id) ?? "—"),
    })));
    setLines(ls.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const carreras = useMemo(() => Array.from(new Set(students.map((s) => s.carrera).filter(Boolean) as string[])), [students]);
  const semestres = useMemo(() => Array.from(new Set(students.map((s) => s.semestre).filter(Boolean) as string[])), [students]);
  const paralelos = useMemo(() => Array.from(new Set(students.map((s) => s.paralelo).filter(Boolean) as string[])), [students]);

  const filtered = useMemo(() => students.filter((s) => {
    if (q && !`${s.full_name} ${s.email} ${s.codigo_estudiantil}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (carreraFilter !== "all" && s.carrera !== carreraFilter) return false;
    if (semestreFilter !== "all" && s.semestre !== semestreFilter) return false;
    if (paraleloFilter !== "all" && s.paralelo !== paraleloFilter) return false;
    if (statusFilter === "active" && !s.is_active) return false;
    if (statusFilter === "inactive" && s.is_active) return false;
    if (lineFilter !== "all" && s.interest_line_id !== lineFilter) return false;
    return true;
  }), [students, q, carreraFilter, semestreFilter, paraleloFilter, statusFilter, lineFilter]);

  const exportCSV = () => {
    const headers = ["Nombre", "Correo", "Carrera", "Semestre", "Paralelo", "Código", "Estado", "Línea", "Proyectos"];
    const rows = filtered.map((s) => [
      s.full_name,
      s.email ?? "",
      s.carrera ?? "",
      s.semestre ?? "",
      s.paralelo ?? "",
      s.codigo_estudiantil ?? "",
      s.is_active ? "Activo" : "Inactivo",
      lines.find((l) => l.id === s.interest_line_id)?.title ?? "",
      s.project_titles.join(" | "),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `estudiantes-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar nombre, correo o código..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <FilterSelect value={carreraFilter} onChange={setCarreraFilter} placeholder="Carrera" all="Todas las carreras" options={carreras} />
          <FilterSelect value={semestreFilter} onChange={setSemestreFilter} placeholder="Semestre" all="Todos" options={semestres} />
          <FilterSelect value={paraleloFilter} onChange={setParaleloFilter} placeholder="Paralelo" all="Todos" options={paralelos} />
          <Select value={lineFilter} onValueChange={setLineFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las líneas</SelectItem>
              {lines.map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{filtered.length} estudiantes</p>
      </Card>

      <Card className="border-border/70 bg-white p-0 overflow-x-auto">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Sin estudiantes.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Estudiante</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Carrera</th>
                <th className="px-4 py-3">Sem.</th>
                <th className="px-4 py-3">Par.</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Línea</th>
                <th className="px-4 py-3">Proyectos</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-2.5 font-medium text-foreground">{s.full_name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{s.email ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{s.carrera ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{s.semestre ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{s.paralelo ?? "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{s.codigo_estudiantil ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {lines.find((l) => l.id === s.interest_line_id)?.title ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {s.project_titles.length === 0 ? "—" : s.project_titles.join(", ")}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={s.is_active ? "border-primary/40 text-primary" : "border-destructive/40 text-destructive"}>
                      {s.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <EditDialog student={editing} lines={lines} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
    </div>
  );
}

function FilterSelect({ value, onChange, placeholder, all, options }: { value: string; onChange: (v: string) => void; placeholder: string; all: string; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[140px]"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{all}</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function EditDialog({ student, lines, onClose, onSaved }: { student: Student | null; lines: ResearchLine[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<Student>>({});
  useEffect(() => { setForm(student ?? {}); }, [student]);

  if (!student) return null;

  const save = async () => {
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name ?? "",
      carrera: form.carrera || null,
      semestre: form.semestre || null,
      paralelo: form.paralelo || null,
      codigo_estudiantil: form.codigo_estudiantil || null,
      interest_line_id: form.interest_line_id || null,
      is_active: form.is_active ?? true,
    }).eq("id", student.id);
    if (error) return toast.error(error.message);
    toast.success("Estudiante actualizado");
    onSaved();
  };

  return (
    <Dialog open={!!student} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar estudiante</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Nombre completo">
            <Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Carrera">
              <Input value={form.carrera ?? ""} onChange={(e) => setForm({ ...form, carrera: e.target.value })} />
            </Field>
            <Field label="Semestre">
              <Input value={form.semestre ?? ""} onChange={(e) => setForm({ ...form, semestre: e.target.value })} />
            </Field>
            <Field label="Paralelo">
              <Input value={form.paralelo ?? ""} onChange={(e) => setForm({ ...form, paralelo: e.target.value })} />
            </Field>
            <Field label="Código estudiantil">
              <Input value={form.codigo_estudiantil ?? ""} onChange={(e) => setForm({ ...form, codigo_estudiantil: e.target.value })} />
            </Field>
          </div>
          <Field label="Línea de interés">
            <Select value={form.interest_line_id ?? "none"} onValueChange={(v) => setForm({ ...form, interest_line_id: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin línea</SelectItem>
                {lines.map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Estado">
            <Select value={form.is_active ? "active" : "inactive"} onValueChange={(v) => setForm({ ...form, is_active: v === "active" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} className="bg-primary hover:bg-primary/90">Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
