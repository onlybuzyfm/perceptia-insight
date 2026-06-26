import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashboardShell } from "@/components/DashboardShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Save, X, Network, Eye, Cpu, Brain, Users, Trophy, Tag, Upload, ExternalLink, Calendar, MapPin, Plus, ChevronUp, Megaphone, Video, BookOpen, Database, Github, FileText, Cloud, Workflow, Folder, ListChecks, Clock, type LucideIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/student")({
  component: StudentDashboard,
});

const TEAM_ICONS: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  nexus: { icon: Network, color: "text-violet-600", bg: "bg-violet-100" },
  prisma: { icon: Eye, color: "text-sky-600", bg: "bg-sky-100" },
  vector: { icon: Cpu, color: "text-emerald-600", bg: "bg-emerald-100" },
  sinapsis: { icon: Brain, color: "text-amber-600", bg: "bg-amber-100" },
};

const TOOLS = [
  { name: "Etiquetador", description: "CVAT — anotación de imágenes y video.", url: "https://cvat.perceptia.dev/auth/login", icon: Tag, active: true },
  { name: "Uploader", description: "Carga masiva de datasets.", url: null as string | null, icon: Upload, active: false },
];

interface ProjectRow {
  id: string;
  title: string;
  description: string;
  status: string;
}

interface TeamInfo {
  id: string;
  name: string;
  slug: string;
  focus: string | null;
  description: string;
}

interface Mate { user_id: string; full_name: string; username: string | null; avatar_url: string | null; role_in_team: string }
interface CompetitionRow { id: string; name: string; description: string; url: string | null; event_date: string | null; location: string | null; result: string | null }

interface ProfileData {
  full_name: string;
  username: string;
  carrera: string | null;
  semestre: string | null;
  phone: string | null;
  bio: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  interest_line_id: string | null;
}

const EMPTY_PROFILE: ProfileData = {
  full_name: "",
  username: "",
  carrera: "",
  semestre: "",
  phone: "",
  bio: "",
  github_url: "",
  linkedin_url: "",
  avatar_url: null,
  interest_line_id: null,
};


const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

function StudentDashboard() {
  const auth = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [mates, setMates] = useState<Mate[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionRow[]>([]);
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [draft, setDraft] = useState<ProfileData>(EMPTY_PROFILE);
  const [lines, setLines] = useState<{ id: string; title: string }[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!auth.user) return;
    (async () => {
      const uid = auth.user!.id;
      const [pm, prof, tm, rl] = await Promise.all([
        supabase
          .from("project_members")
          .select("project_id, projects(id, title, description, status)")
          .eq("user_id", uid),
        supabase
          .from("profiles")
          .select("full_name, username, carrera, semestre, phone, bio, github_url, linkedin_url, avatar_url, interest_line_id")
          .eq("id", uid)
          .maybeSingle(),
        supabase
          .from("team_members")
          .select("team_id, teams(id, name, slug, focus, description)")
          .eq("user_id", uid)
          .maybeSingle(),
        supabase.from("research_lines").select("id, title").order("display_order"),
      ]);
      setLines(rl.data ?? []);


      const projMap = new Map<string, ProjectRow>();
      (pm.data ?? []).forEach((r) => {
        const p = r.projects as ProjectRow | null;
        if (p) projMap.set(p.id, p);
      });

      const teamData = (tm.data?.teams ?? null) as TeamInfo | null;
      setTeam(teamData);

      if (teamData) {
        const [tMembers, tProj, tComp] = await Promise.all([
          supabase
            .from("team_members")
            .select("user_id, role_in_team")
            .eq("team_id", teamData.id),
          supabase
            .from("team_projects")
            .select("projects(id, title, description, status)")
            .eq("team_id", teamData.id),
          supabase
            .from("team_competitions")
            .select("result, competitions(id, name, description, url, event_date, location)")
            .eq("team_id", teamData.id),
        ]);
        const otherIds = (tMembers.data ?? []).filter((r) => r.user_id !== uid).map((r) => r.user_id);
        let profMap = new Map<string, { full_name?: string; username?: string | null; avatar_url?: string | null }>();
        if (otherIds.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", otherIds);
          profMap = new Map((profs ?? []).map((p) => [p.id, p]));
        }
        setMates(
          (tMembers.data ?? [])
            .filter((r) => r.user_id !== uid)
            .map((r) => {
              const p = profMap.get(r.user_id) ?? {};
              return {
                user_id: r.user_id,
                full_name: p.full_name ?? "",
                username: p.username ?? null,
                avatar_url: p.avatar_url ?? null,
                role_in_team: r.role_in_team,
              };
            }),
        );
        (tProj.data ?? []).forEach((r) => {
          const p = r.projects as ProjectRow | null;
          if (p) projMap.set(p.id, p);
        });
        setCompetitions(
          (tComp.data ?? [])
            .map((r) => {
              const c = r.competitions as Omit<CompetitionRow, "result"> | null;
              return c ? { ...c, result: r.result } : null;
            })
            .filter((c): c is CompetitionRow => !!c),
        );
      }

      setProjects(Array.from(projMap.values()));
      const data: ProfileData = {
        full_name: prof.data?.full_name ?? "",
        username: prof.data?.username ?? "",
        carrera: prof.data?.carrera ?? "",
        semestre: prof.data?.semestre ?? "",
        phone: prof.data?.phone ?? "",
        bio: prof.data?.bio ?? "",
        github_url: prof.data?.github_url ?? "",
        linkedin_url: prof.data?.linkedin_url ?? "",
        avatar_url: prof.data?.avatar_url ?? null,
        interest_line_id: prof.data?.interest_line_id ?? null,
      };

      setProfile(data);
      setDraft(data);
      setLoading(false);
    })();
  }, [auth.user]);

  const startEdit = () => {
    setDraft(profile);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setEditing(false);
  };

  const saveProfile = async () => {
    if (!auth.user) return;
    if (!draft.full_name.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    const uname = draft.username.trim().toLowerCase();
    if (!USERNAME_RE.test(uname)) {
      toast.error("Username inválido: 3-30 caracteres a-z, 0-9, _ o .");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: draft.full_name.trim(),
        username: uname,
        carrera: "Ciencia de Datos e Inteligencia Artificial",
        semestre: draft.semestre?.trim() || null,
        phone: draft.phone?.trim() || null,
        bio: draft.bio?.trim() || null,
        github_url: draft.github_url?.trim() || null,
        linkedin_url: draft.linkedin_url?.trim() || null,
        interest_line_id: draft.interest_line_id || null,
      })
      .eq("id", auth.user.id);

    setSaving(false);
    if (error) {
      const msg = error.message.includes("profiles_username_key") || error.code === "23505"
        ? "Ese username ya está en uso"
        : error.message.includes("profiles_username_format_chk")
        ? "Username inválido: 3-30 caracteres a-z, 0-9, _ o ."
        : error.message;
      toast.error("No se pudo guardar el perfil: " + msg);
      return;
    }
    setProfile({ ...draft, username: uname });
    setEditing(false);
    toast.success("Perfil actualizado");
  };

  const set = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <DashboardShell title="Mi espacio">
      <Tabs defaultValue="inicio" className="w-full">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
          <TabsTrigger value="inicio">Inicio</TabsTrigger>
          <TabsTrigger value="perfil">Mi perfil</TabsTrigger>
          <TabsTrigger value="equipo">Mi equipo</TabsTrigger>
          <TabsTrigger value="proyectos">Proyectos</TabsTrigger>
          <TabsTrigger value="actividades">Actividades</TabsTrigger>
          <TabsTrigger value="competencias">Competencias</TabsTrigger>
          <TabsTrigger value="recursos">Recursos</TabsTrigger>
          <TabsTrigger value="herramientas">Herramientas</TabsTrigger>
        </TabsList>

        <TabsContent value="inicio" className="mt-5 space-y-0">
          <AnnouncementsCard />
          <UpcomingMeetingsCard />
        </TabsContent>

        <TabsContent value="perfil" className="mt-5">
          <Card className="border-border/70 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-foreground">Mi perfil</h2>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={startEdit} disabled={loading}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>
                    <X className="mr-1.5 h-3.5 w-3.5" /> Cancelar
                  </Button>
                  <Button size="sm" onClick={saveProfile} disabled={saving}>
                    <Save className="mr-1.5 h-3.5 w-3.5" /> {saving ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              )}
            </div>

            {loading ? (
              <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
            ) : (
              <>
                <div className="mt-5 flex items-center gap-4 border-y border-border/60 py-5">
                  <Avatar className="h-20 w-20">
                    {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
                    <AvatarFallback className="bg-primary-soft text-lg font-semibold text-primary">
                      {(profile.full_name || profile.username || "?").split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold text-foreground">{profile.full_name || "—"}</p>
                    {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
                    <p className="mt-0.5 text-xs text-muted-foreground">Cambia tu foto desde Ajustes.</p>
                  </div>
                </div>
                {!editing ? (
              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Field label="Nombre" value={profile.full_name} />
                <Field label="Username" value={profile.username ? "@" + profile.username : null} />
                <Field label="Correo" value={auth.user?.email ?? "—"} />
                <Field label="Carrera" value={profile.carrera} />
                <Field label="Semestre" value={profile.semestre} />
                <Field label="Línea de interés" value={lines.find((l) => l.id === profile.interest_line_id)?.title ?? null} />

                <Field label="Teléfono" value={profile.phone} />
                <Field label="GitHub" value={profile.github_url} />

                <Field label="LinkedIn" value={profile.linkedin_url} />
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Bio</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-foreground">{profile.bio || "—"}</dd>
                </div>
              </dl>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldInput label="Nombre completo" value={draft.full_name} onChange={(v) => set("full_name", v)} required maxLength={120} />
                <FieldInput label="Username" value={draft.username} onChange={(v) => set("username", v.toLowerCase())} required maxLength={30} placeholder="ej: juan.perez" />
                <div>
                  <Label className="text-muted-foreground">Correo</Label>
                  <Input value={auth.user?.email ?? ""} disabled className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Carrera</Label>
                  <Input value="Ciencia de Datos e Inteligencia Artificial" disabled className="mt-1.5" />
                </div>
                <FieldInput label="Semestre" value={draft.semestre ?? ""} onChange={(v) => set("semestre", v.replace(/[^0-9]/g, ""))} maxLength={2} placeholder="Ej: 5" />
                <div>
                  <Label className="text-muted-foreground">Línea de interés</Label>
                  <select
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={draft.interest_line_id ?? ""}
                    onChange={(e) => set("interest_line_id", e.target.value || null)}
                  >
                    <option value="">— Selecciona una línea —</option>
                    {lines.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                </div>

                <FieldInput label="Teléfono" value={draft.phone ?? ""} onChange={(v) => set("phone", v)} maxLength={30} />
                <FieldInput label="GitHub URL" value={draft.github_url ?? ""} onChange={(v) => set("github_url", v)} placeholder="https://github.com/usuario" />
                <FieldInput label="LinkedIn URL" value={draft.linkedin_url ?? ""} onChange={(v) => set("linkedin_url", v)} placeholder="https://linkedin.com/in/usuario" />
                <div className="sm:col-span-2">
                  <Label className="text-muted-foreground">Bio</Label>
                  <Textarea
                    className="mt-1.5"
                    value={draft.bio ?? ""}
                    onChange={(e) => set("bio", e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="Cuéntanos sobre ti, tus intereses..."
                  />
                </div>
              </div>
                )}
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="equipo" className="mt-5">
          <TeamCard team={team} mates={mates} loading={loading} />
        </TabsContent>

        <TabsContent value="proyectos" className="mt-5">
          <ProjectsCard projects={projects} loading={loading} userId={auth.user?.id ?? null} />
        </TabsContent>

        <TabsContent value="actividades" className="mt-5">
          <ActivitiesCard userId={auth.user?.id ?? null} />
        </TabsContent>

        <TabsContent value="competencias" className="mt-5">
          <CompetitionsCard competitions={competitions} loading={loading} hasTeam={!!team} />
        </TabsContent>

        <TabsContent value="recursos" className="mt-5">
          <ResourcesCard />
        </TabsContent>

        <TabsContent value="herramientas" className="mt-5">
          <ToolsCard />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}


function TeamCard({ team, mates, loading }: { team: TeamInfo | null; mates: Mate[]; loading: boolean }) {
  const meta = team ? TEAM_ICONS[team.slug] ?? { icon: Users, color: "text-primary", bg: "bg-primary-soft" } : null;
  const Icon = meta?.icon ?? Users;
  return (
    <Card className="mt-6 border-border/70 p-6">
      <h2 className="font-display text-lg font-semibold text-foreground">Mi equipo</h2>
      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Cargando...</p>
      ) : !team ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Aún no estás asignado a un equipo. El administrador te asignará pronto.
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-start gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${meta?.bg ?? "bg-primary-soft"} ${meta?.color ?? "text-primary"}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-xl font-semibold text-foreground">{team.name}</h3>
              {team.focus && <p className="text-sm text-muted-foreground">{team.focus}</p>}
              {team.description && <p className="mt-1 text-sm text-muted-foreground">{team.description}</p>}
            </div>
          </div>
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Compañeros</p>
            {mates.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Eres el único miembro por ahora.</p>
            ) : (
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {mates.map((m) => {
                  const initials = (m.full_name || m.username || "?").split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
                  return (
                    <li key={m.user_id} className="flex items-center gap-2.5 rounded-lg border border-border/60 p-2.5">
                      <Avatar className="h-8 w-8">
                        {m.avatar_url && <AvatarImage src={m.avatar_url} alt={m.full_name} />}
                        <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">{initials || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{m.full_name || m.username}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.role_in_team}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

function CompetitionsCard({ competitions, loading, hasTeam }: { competitions: CompetitionRow[]; loading: boolean; hasTeam: boolean }) {
  return (
    <Card className="mt-6 border-border/70 p-6">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-600" />
        <h2 className="font-display text-lg font-semibold text-foreground">Competencias del equipo</h2>
      </div>
      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Cargando...</p>
      ) : !hasTeam ? (
        <p className="mt-3 text-sm text-muted-foreground">Te aparecerán cuando seas asignado a un equipo.</p>
      ) : competitions.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Tu equipo aún no tiene competencias asignadas.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {competitions.map((c) => (
            <li key={c.id} className="rounded-lg border border-border/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{c.name}</h3>
                  {c.description && <p className="mt-0.5 text-sm text-muted-foreground">{c.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {c.event_date && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(c.event_date).toLocaleDateString()}</span>}
                    {c.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.location}</span>}
                    {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3.5 w-3.5" />Sitio</a>}
                  </div>
                </div>
                {c.result && <Badge variant="outline" className="border-amber-300 text-amber-700">{c.result}</Badge>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ToolsCard() {
  return (
    <Card className="mt-6 border-border/70 p-6">
      <h2 className="font-display text-lg font-semibold text-foreground">Herramientas</h2>
      <p className="mt-1 text-xs text-muted-foreground">Accesos a las plataformas internas del laboratorio.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const inner = (
            <div className={`group rounded-lg border border-border/60 p-4 transition-all ${t.active ? "hover:border-primary/40 hover:shadow-sm" : "opacity-60"}`}>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                {t.active ? (
                  <Badge variant="outline" className="border-primary/40 text-primary">Activo</Badge>
                ) : (
                  <Badge variant="outline" className="border-border text-muted-foreground">Próximamente</Badge>
                )}
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <h3 className="font-semibold text-foreground">{t.name}</h3>
                {t.active && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
            </div>
          );
          return t.active && t.url ? (
            <a key={t.name} href={t.url} target="_blank" rel="noopener noreferrer">{inner}</a>
          ) : (
            <div key={t.name}>{inner}</div>
          );
        })}
      </div>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value || "—"}</dd>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  required,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        className="mt-1.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
      />
    </div>
  );
}

interface UpdateRow {
  id: string;
  week_start: string;
  summary: string;
  achievements: string | null;
  blockers: string | null;
  hours_spent: number | null;
  repo_url: string | null;
  evidence_url: string | null;
}

const EMPTY_FORM = { week_start: "", summary: "", achievements: "", blockers: "", hours_spent: "0", repo_url: "" };
const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

function isWeekEditable(weekStart: string): boolean {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return new Date() < end;
}

function ProjectsCard({ projects, loading, userId }: { projects: ProjectRow[]; loading: boolean; userId: string | null }) {
  const [updatesByProject, setUpdatesByProject] = useState<Record<string, UpdateRow[]>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [evidence, setEvidence] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [existingEvidence, setExistingEvidence] = useState<string | null>(null);

  const loadUpdates = async (projectId: string) => {
    if (!userId) return;
    const { data } = await supabase
      .from("weekly_updates")
      .select("id, week_start, summary, achievements, blockers, hours_spent, repo_url, evidence_url")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .order("week_start", { ascending: false })
      .limit(5);
    setUpdatesByProject((m) => ({ ...m, [projectId]: data ?? [] }));
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, week_start: new Date().toISOString().slice(0, 10) });
    setEvidence(null);
    setEditingId(null);
    setExistingEvidence(null);
  };

  const toggleOpen = (id: string) => {
    if (openId === id) {
      setOpenId(null);
      resetForm();
      return;
    }
    setOpenId(id);
    resetForm();
    if (!updatesByProject[id]) loadUpdates(id);
  };

  const startEditUpdate = (u: UpdateRow) => {
    setEditingId(u.id);
    setForm({
      week_start: u.week_start,
      summary: u.summary,
      achievements: u.achievements ?? "",
      blockers: u.blockers ?? "",
      hours_spent: String(u.hours_spent ?? 0),
      repo_url: u.repo_url ?? "",
    });
    setEvidence(null);
    setExistingEvidence(u.evidence_url);
  };

  const onPickEvidence = (file: File | null) => {
    if (!file) { setEvidence(null); return; }
    if (file.size > MAX_EVIDENCE_BYTES) {
      toast.error("La evidencia debe pesar menos de 5 MB");
      return;
    }
    setEvidence(file);
  };

  const uploadEvidence = async (projectId: string): Promise<string | null> => {
    if (!evidence || !userId) return null;
    const ext = evidence.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${userId}/${projectId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("update-evidences").upload(path, evidence, {
      contentType: evidence.type || undefined,
      upsert: false,
    });
    if (error) { toast.error("No se pudo subir evidencia: " + error.message); return null; }
    return path;
  };

  const submitUpdate = async (projectId: string) => {
    if (!userId) return;
    if (!form.week_start) return toast.error("Indica la semana");
    if (form.summary.trim().length < 5) return toast.error("El resumen debe tener al menos 5 caracteres");
    const hours = Number(form.hours_spent || 0);
    if (Number.isNaN(hours) || hours < 0 || hours > 168) return toast.error("Horas inválidas");
    if (form.repo_url && !/^https?:\/\//i.test(form.repo_url)) return toast.error("URL de repositorio inválida");
    if (editingId && !isWeekEditable(form.week_start)) return toast.error("Ya no puedes editar: la semana terminó");

    setSubmitting(true);
    let evidencePath: string | null = existingEvidence;
    if (evidence) {
      const uploaded = await uploadEvidence(projectId);
      if (!uploaded) { setSubmitting(false); return; }
      evidencePath = uploaded;
    }

    const payload = {
      week_start: form.week_start,
      summary: form.summary.trim(),
      achievements: form.achievements.trim() || null,
      blockers: form.blockers.trim() || null,
      hours_spent: hours,
      repo_url: form.repo_url.trim() || null,
      evidence_url: evidencePath,
    };

    const { error } = editingId
      ? await supabase.from("weekly_updates").update(payload).eq("id", editingId)
      : await supabase.from("weekly_updates").insert({ ...payload, user_id: userId, project_id: projectId });

    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Avance actualizado" : "Avance registrado");
    resetForm();
    loadUpdates(projectId);
  };

  const openEvidence = async (path: string) => {
    const { data, error } = await supabase.storage.from("update-evidences").createSignedUrl(path, 600);
    if (error || !data) { toast.error("No se pudo abrir la evidencia"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="mt-6 border-border/70 p-6">
      <h2 className="font-display text-lg font-semibold text-foreground">Proyectos</h2>
      <p className="mt-1 text-xs text-muted-foreground">Registra tus avances semanales en cada proyecto asignado.</p>
      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Cargando...</p>
      ) : projects.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Aún no tienes proyectos asignados. Contacta a tu coordinador.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {projects.map((p) => {
            const isOpen = openId === p.id;
            const ups = updatesByProject[p.id] ?? [];
            return (
              <li key={p.id} className="rounded-lg border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{p.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                  </div>
                  <Badge variant="outline">{p.status}</Badge>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => toggleOpen(p.id)}>
                    {isOpen ? <ChevronUp className="mr-1.5 h-3.5 w-3.5" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
                    {isOpen ? "Cerrar" : "Registrar avance"}
                  </Button>
                </div>
                {isOpen && (
                  <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
                    {editingId && (
                      <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary-soft px-3 py-2 text-xs text-foreground">
                        <span>Editando avance del {form.week_start}</span>
                        <button type="button" className="text-primary hover:underline" onClick={resetForm}>Cancelar edición</button>
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-muted-foreground">Semana del</Label>
                        <Input type="date" className="mt-1.5" value={form.week_start} onChange={(e) => setForm((f) => ({ ...f, week_start: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Horas dedicadas</Label>
                        <Input type="number" min={0} max={168} step="0.5" className="mt-1.5" value={form.hours_spent} onChange={(e) => setForm((f) => ({ ...f, hours_spent: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-muted-foreground">Resumen *</Label>
                        <Textarea rows={3} className="mt-1.5" value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} placeholder="¿Qué hiciste esta semana?" maxLength={2000} />
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Logros</Label>
                        <Textarea rows={2} className="mt-1.5" value={form.achievements} onChange={(e) => setForm((f) => ({ ...f, achievements: e.target.value }))} maxLength={2000} />
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Bloqueos</Label>
                        <Textarea rows={2} className="mt-1.5" value={form.blockers} onChange={(e) => setForm((f) => ({ ...f, blockers: e.target.value }))} maxLength={2000} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-muted-foreground">Repositorio de GitHub</Label>
                        <Input type="url" className="mt-1.5" value={form.repo_url} onChange={(e) => setForm((f) => ({ ...f, repo_url: e.target.value }))} placeholder="https://github.com/usuario/repo" maxLength={500} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-muted-foreground">Evidencia (máx. 5 MB)</Label>
                        <Input
                          type="file"
                          className="mt-1.5"
                          accept="image/*,.pdf,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                          onChange={(e) => onPickEvidence(e.target.files?.[0] ?? null)}
                        />
                        {existingEvidence && !evidence && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Evidencia actual:{" "}
                            <button type="button" onClick={() => openEvidence(existingEvidence)} className="text-primary hover:underline">
                              ver archivo
                            </button>
                          </p>
                        )}
                        {evidence && (
                          <p className="mt-1 text-xs text-muted-foreground">Nuevo archivo: {evidence.name} ({(evidence.size / 1024 / 1024).toFixed(2)} MB)</p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => submitUpdate(p.id)} disabled={submitting}>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        {submitting ? "Guardando..." : editingId ? "Actualizar avance" : "Guardar avance"}
                      </Button>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avances recientes</p>
                      {ups.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">Aún no has registrado avances en este proyecto.</p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {ups.map((u) => {
                            const canEdit = isWeekEditable(u.week_start);
                            return (
                              <li key={u.id} className="rounded-md border border-border/60 p-3">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>Semana del {u.week_start}</span>
                                  <div className="flex items-center gap-2">
                                    <span>{u.hours_spent ?? 0} h</span>
                                    {canEdit ? (
                                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => startEditUpdate(u)}>
                                        <Pencil className="mr-1 h-3 w-3" /> Editar
                                      </Button>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px]">Cerrado</Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="mt-1.5 text-sm text-foreground">{u.summary}</p>
                                {u.achievements && <p className="mt-1 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Logros:</span> {u.achievements}</p>}
                                {u.blockers && <p className="mt-0.5 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Bloqueos:</span> {u.blockers}</p>}
                                <div className="mt-1.5 flex flex-wrap gap-3 text-xs">
                                  {u.repo_url && (
                                    <a href={u.repo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                      <ExternalLink className="h-3 w-3" /> Repositorio
                                    </a>
                                  )}
                                  {u.evidence_url && (
                                    <button type="button" onClick={() => openEvidence(u.evidence_url!)} className="inline-flex items-center gap-1 text-primary hover:underline">
                                      <ExternalLink className="h-3 w-3" /> Evidencia
                                    </button>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

interface AnnouncementRow { id: string; title: string; content: string; created_at: string; }

function AnnouncementsCard() {
  const [items, setItems] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, title, content, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      setItems((data ?? []) as AnnouncementRow[]);
      setLoading(false);
    })();
  }, []);
  return (
    <Card className="mt-6 border-border/70 p-6">
      <div className="flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg font-semibold text-foreground">Anuncios</h2>
      </div>
      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No hay anuncios por ahora.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((a) => (
            <li key={a.id} className="rounded-lg border border-border/60 bg-secondary/30 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-foreground">{a.title}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString("es-CO", { dateStyle: "medium" })}
                </span>
              </div>
              {a.content && (
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground/80">{a.content}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

interface MeetingRow { id: string; title: string; description: string; meeting_date: string; location: string | null; }

function UpcomingMeetingsCard() {
  const [items, setItems] = useState<MeetingRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("meetings")
        .select("id, title, description, meeting_date, location")
        .gte("meeting_date", new Date().toISOString())
        .order("meeting_date", { ascending: true })
        .limit(10);
      setItems((data ?? []) as MeetingRow[]);
      setLoading(false);
    })();
  }, []);
  return (
    <Card className="mt-6 border-border/70 p-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg font-semibold text-foreground">Próximas reuniones</h2>
      </div>
      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No hay reuniones programadas.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((m) => {
            const d = new Date(m.meeting_date);
            return (
              <li key={m.id} className="rounded-lg border border-border/60 bg-secondary/30 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{m.title}</p>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {d.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
                {m.description && (
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground/80">{m.description}</p>
                )}
                {m.location && (
                  <a
                    href={m.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Video className="h-3.5 w-3.5" /> Unirse por Zoom <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

const RESOURCE_ICONS: Record<string, LucideIcon> = {
  moodle: BookOpen,
  dataset: Database,
  cvat: FileText,
  notion: FileText,
  github: Github,
  drive: Cloud,
  n8n: Workflow,
  otro: Folder,
};

interface ResourceRow {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  project_id: string | null;
}

function ResourcesCard() {
  const [items, setItems] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("resources")
      .select("id, title, description, url, category, project_id")
      .order("display_order", { ascending: true })
      .then(({ data }) => {
        setItems((data ?? []) as ResourceRow[]);
        setLoading(false);
      });
  }, []);

  return (
    <Card className="mt-6 border-border/70 p-6">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold text-foreground">Recursos</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Datasets, carpetas en la nube y enlaces de tus proyectos.
      </p>
      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Aún no hay recursos disponibles para ti.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map((r) => {
            const Icon = RESOURCE_ICONS[r.category] ?? Folder;
            return (
              <li key={r.id}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full items-start gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:border-primary/40 hover:bg-primary-soft/30"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                      <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    {r.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                    )}
                    <Badge variant="outline" className="mt-1.5 text-[10px] capitalize">{r.category}</Badge>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

interface ActivityRow {
  id: string;
  project_id: string;
  project_title: string;
  title: string;
  description: string;
  deadline: string;
  status: "pendiente" | "en_progreso" | "completada";
  is_assigned: boolean;
  assignee_count: number;
}

function ActivitiesCard({ userId }: { userId: string | null }) {
  const [items, setItems] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!userId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data: acts } = await supabase
      .from("project_activities")
      .select("id, project_id, title, description, deadline, status, projects(title)")
      .order("deadline");
    const ids = (acts ?? []).map((a) => a.id);
    let assigneesByActivity = new Map<string, string[]>();
    if (ids.length > 0) {
      const { data: ass } = await supabase
        .from("activity_assignees")
        .select("activity_id, user_id")
        .in("activity_id", ids);
      (ass ?? []).forEach((a) => {
        const arr = assigneesByActivity.get(a.activity_id) ?? [];
        arr.push(a.user_id);
        assigneesByActivity.set(a.activity_id, arr);
      });
    }
    setItems(
      (acts ?? []).map((a) => {
        const assignees = assigneesByActivity.get(a.id) ?? [];
        const proj = a.projects as { title: string } | null;
        return {
          id: a.id,
          project_id: a.project_id,
          project_title: proj?.title ?? "—",
          title: a.title,
          description: a.description,
          deadline: a.deadline,
          status: a.status,
          is_assigned: assignees.length === 0 || assignees.includes(userId),
          assignee_count: assignees.length,
        };
      }),
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const setStatus = async (id: string, status: ActivityRow["status"]) => {
    const { error } = await supabase.from("project_activities").update({ status }).eq("id", id);
    if (error) return toast.error("No se pudo actualizar: " + error.message);
    toast.success("Estado actualizado");
    load();
  };

  const visible = items.filter((i) => i.is_assigned);

  return (
    <Card className="mt-6 border-border/70 p-6">
      <div className="flex items-center gap-2">
        <ListChecks className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold text-foreground">Mis actividades</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Tareas con fecha límite asignadas a ti o a todo tu equipo.</p>
      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Cargando…</p>
      ) : visible.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No tienes actividades pendientes.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((a) => {
            const overdue = a.status !== "completada" && new Date(a.deadline) < new Date();
            const styleByStatus: Record<ActivityRow["status"], string> = {
              pendiente: "bg-amber-50 text-amber-700 border-amber-200",
              en_progreso: "bg-sky-50 text-sky-700 border-sky-200",
              completada: "bg-emerald-50 text-emerald-700 border-emerald-200",
            };
            const labelByStatus: Record<ActivityRow["status"], string> = {
              pendiente: "Pendiente",
              en_progreso: "En progreso",
              completada: "Completada",
            };
            return (
              <li key={a.id} className="rounded-lg border border-border/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{a.title}</h3>
                      <Badge variant="outline" className={styleByStatus[a.status]}>{labelByStatus[a.status]}</Badge>
                      {overdue && <Badge variant="outline" className="border-destructive/40 text-destructive">Vencida</Badge>}
                      {a.assignee_count === 0 && <Badge variant="outline" className="text-[10px]">Equipo</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{a.project_title}</p>
                    {a.description && <p className="mt-1 text-sm text-foreground/80">{a.description}</p>}
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(a.deadline).toLocaleString("es-EC")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(["pendiente", "en_progreso", "completada"] as const).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={a.status === s ? "default" : "outline"}
                        className={`h-7 px-2 text-xs ${a.status === s ? "bg-primary hover:bg-primary/90" : ""}`}
                        onClick={() => setStatus(a.id, s)}
                      >
                        {labelByStatus[s]}
                      </Button>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
