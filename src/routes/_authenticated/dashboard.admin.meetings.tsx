import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminShell } from "@/components/AdminShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Video, Trash2, ChevronLeft, Users as UsersIcon, CheckCircle2, XCircle, Clock, FileText, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/meetings")({
  component: () => <AdminShell><MeetingsAdmin /></AdminShell>,
});

type AttendanceStatus = "presente" | "ausente" | "tardanza" | "justificado";

interface Meeting {
  id: string;
  title: string;
  description: string;
  meeting_date: string;
  location: string | null;
  research_line_id: string | null;
  created_at: string;
}

interface Student {
  id: string;
  full_name: string;
  username: string;
}

interface AttendanceRow {
  id?: string;
  user_id: string;
  status: AttendanceStatus;
  notes: string | null;
}

const meetingSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000),
  meeting_date: z.string().min(1),
  location: z.string().url("Debe ser un enlace válido").max(500).optional().or(z.literal("")),
});

function MeetingsAdmin() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Meeting | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("meetings").select("*").order("meeting_date", { ascending: false });
    setMeetings(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (selected) {
    return <AttendanceView meeting={selected} onBack={() => { setSelected(null); load(); }} />;
  }

  return (
    <div className="space-y-4">
      <CreateMeetingCard onCreated={load} />

      <Card className="border-border/70 bg-white p-0 overflow-x-auto">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Reuniones</h2>
          <span className="text-xs text-muted-foreground">{meetings.length} reuniones</span>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
        ) : meetings.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Aún no hay reuniones programadas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Enlace Zoom</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {meetings.map((m) => {
                const date = new Date(m.meeting_date);
                const past = date.getTime() < Date.now();
                return (
                  <tr key={m.id} className="hover:bg-secondary/30">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                      {date.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{m.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.location ? (
                        <a href={m.location} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <Video className="h-3.5 w-3.5" /> Abrir <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {past ? (
                        <Badge variant="outline" className="border-primary/40 text-primary">Realizada</Badge>
                      ) : (
                        <Badge variant="outline">Programada</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelected(m)}
                          title="Pasar asistencia"
                          className="h-7 px-2"
                        >
                          <UsersIcon className="mr-1 h-3.5 w-3.5" /> Asistencia
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (!confirm(`¿Eliminar la reunión "${m.title}"? Se borrará también la asistencia.`)) return;
                            const { error } = await supabase.from("meetings").delete().eq("id", m.id);
                            if (error) { toast.error(error.message); return; }
                            toast.success("Reunión eliminada");
                            load();
                          }}
                          className="h-7 border-destructive/40 px-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function CreateMeetingCard({ onCreated }: { onCreated: () => void }) {
  const auth = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth.user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = meetingSchema.safeParse({
      title: fd.get("title"),
      description: fd.get("description") || "",
      meeting_date: fd.get("meeting_date"),
      location: fd.get("location") || undefined,
    });
    if (!parsed.success) { toast.error("Revisa los campos."); return; }
    setSubmitting(true);
    const meetingDate = new Date(parsed.data.meeting_date);
    const { error } = await supabase.from("meetings").insert({
      title: parsed.data.title,
      description: parsed.data.description,
      meeting_date: meetingDate.toISOString(),
      location: parsed.data.location ?? null,
      created_by: auth.user.id,
    });
    if (error) { setSubmitting(false); toast.error(error.message); return; }

    // Anuncio automático para TODOS los estudiantes
    const dateLabel = meetingDate.toLocaleString("es-CO", { dateStyle: "full", timeStyle: "short" });
    const content = [
      `📅 ${dateLabel}`,
      parsed.data.location ? `🔗 Zoom: ${parsed.data.location}` : null,
      parsed.data.description ? `\n${parsed.data.description}` : null,
    ].filter(Boolean).join("\n");
    const { error: annErr } = await supabase.from("announcements").insert({
      title: `Nueva reunión: ${parsed.data.title}`,
      content,
      audience: "estudiante",
      created_by: auth.user.id,
    });
    // Notificación por Telegram a todos los estudiantes vinculados
    try {
      const { broadcastTelegram } = await import("@/lib/telegram.functions");
      await broadcastTelegram({
        data: {
          kind: "meeting_created",
          title: `📅 Nueva reunión: ${parsed.data.title}`,
          body: `${dateLabel}${parsed.data.location ? `\n\nZoom: ${parsed.data.location}` : ""}${parsed.data.description ? `\n\n${parsed.data.description}` : ""}`,
          url: parsed.data.location ?? undefined,
          onlyRole: "estudiante",
        },
      });
    } catch { /* no romper flujo */ }

    setSubmitting(false);
    if (annErr) { toast.warning(`Reunión creada, pero falló el anuncio: ${annErr.message}`); }
    else { toast.success("Reunión creada y anunciada a los estudiantes"); }
    (e.currentTarget as HTMLFormElement).reset();
    onCreated();
  };

  return (
    <Card className="border-border/70 bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-foreground">Programar reunión</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Después de la fecha, podrás pasar asistencia a los estudiantes.
      </p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" name="title" required maxLength={200} className="mt-1.5" placeholder="Ej: Reunión semanal del semillero" />
        </div>
        <div>
          <Label htmlFor="meeting_date">Fecha y hora</Label>
          <Input id="meeting_date" name="meeting_date" type="datetime-local" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="location"><Video className="mr-1 inline h-3.5 w-3.5" /> Enlace de Zoom</Label>
          <Input id="location" name="location" type="url" maxLength={500} className="mt-1.5" placeholder="https://zoom.us/j/..." />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description"><FileText className="mr-1 inline h-3.5 w-3.5" /> Descripción / agenda</Label>
          <Textarea id="description" name="description" rows={2} maxLength={2000} className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90">
            <Calendar className="mr-1.5 h-4 w-4" />
            {submitting ? "Creando..." : "Crear reunión"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function AttendanceView({ meeting, onBack }: { meeting: Meeting; onBack: () => void }) {
  const auth = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const roles = await supabase.from("user_roles").select("user_id").eq("role", "estudiante");
      const ids = (roles.data ?? []).map((r) => r.user_id);
      if (ids.length === 0) { setStudents([]); setLoading(false); return; }
      const [profs, att] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username").in("id", ids).eq("is_active", true).order("full_name"),
        supabase.from("meeting_attendance").select("*").eq("meeting_id", meeting.id),
      ]);
      setStudents((profs.data ?? []) as Student[]);
      const map: Record<string, AttendanceRow> = {};
      (profs.data ?? []).forEach((p) => {
        map[p.id] = { user_id: p.id, status: "ausente", notes: null };
      });
      (att.data ?? []).forEach((a) => {
        map[a.user_id] = { id: a.id, user_id: a.user_id, status: a.status as AttendanceStatus, notes: a.notes };
      });
      setAttendance(map);
      setLoading(false);
    })();
  }, [meeting.id]);

  const counts = useMemo(() => {
    const c = { presente: 0, ausente: 0, tardanza: 0, justificado: 0 };
    Object.values(attendance).forEach((a) => { c[a.status]++; });
    return c;
  }, [attendance]);

  const markAll = (status: AttendanceStatus) => {
    setAttendance((prev) => {
      const next: Record<string, AttendanceRow> = {};
      Object.entries(prev).forEach(([id, row]) => { next[id] = { ...row, status }; });
      return next;
    });
  };

  const saveAll = async () => {
    if (!auth.user) return;
    setSaving(true);
    const rows = Object.values(attendance).map((a) => ({
      meeting_id: meeting.id,
      user_id: a.user_id,
      status: a.status,
      notes: a.notes,
      marked_by: auth.user!.id,
      marked_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("meeting_attendance").upsert(rows, { onConflict: "meeting_id,user_id" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Asistencia guardada (${rows.length} estudiantes)`);
  };

  const date = new Date(meeting.meeting_date);

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 mb-2 h-7 text-muted-foreground">
              <ChevronLeft className="mr-1 h-4 w-4" /> Volver
            </Button>
            <h2 className="font-display text-xl font-semibold text-foreground">{meeting.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {date.toLocaleString("es-CO", { dateStyle: "full", timeStyle: "short" })}
            </p>
            {meeting.location && (
              <a href={meeting.location} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <Video className="h-3.5 w-3.5" /> Abrir Zoom <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {meeting.description && (
              <p className="mt-2 max-w-2xl text-sm text-foreground/80">{meeting.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3" /> {counts.presente}</Badge>
            <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"><Clock className="mr-1 h-3 w-3" /> {counts.tardanza}</Badge>
            <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20">J {counts.justificado}</Badge>
            <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20"><XCircle className="mr-1 h-3 w-3" /> {counts.ausente}</Badge>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
          <span className="text-xs font-medium text-muted-foreground">Marcar a todos:</span>
          <Button variant="outline" size="sm" className="h-7" onClick={() => markAll("presente")}>Presente</Button>
          <Button variant="outline" size="sm" className="h-7" onClick={() => markAll("ausente")}>Ausente</Button>
          <div className="ml-auto">
            <Button onClick={saveAll} disabled={saving || loading} className="h-8 bg-primary hover:bg-primary/90">
              {saving ? "Guardando..." : "Guardar asistencia"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-border/70 bg-white p-0 overflow-x-auto">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Cargando estudiantes...</p>
        ) : students.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No hay estudiantes activos.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Estudiante</th>
                <th className="px-4 py-3 w-[180px]">Estado</th>
                <th className="px-4 py-3">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {students.map((s) => {
                const row = attendance[s.id];
                return (
                  <tr key={s.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-foreground">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">@{s.username}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <Select
                        value={row?.status ?? "ausente"}
                        onValueChange={(v) => setAttendance((prev) => ({ ...prev, [s.id]: { ...prev[s.id], status: v as AttendanceStatus } }))}
                      >
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="presente">Presente</SelectItem>
                          <SelectItem value="tardanza">Tardanza</SelectItem>
                          <SelectItem value="justificado">Justificado</SelectItem>
                          <SelectItem value="ausente">Ausente</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2.5">
                      <Input
                        value={row?.notes ?? ""}
                        onChange={(e) => setAttendance((prev) => ({ ...prev, [s.id]: { ...prev[s.id], notes: e.target.value || null } }))}
                        placeholder="(opcional)"
                        maxLength={500}
                        className="h-8"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
