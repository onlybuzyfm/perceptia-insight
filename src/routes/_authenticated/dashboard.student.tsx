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
import { Pencil, Save, X, Network, Eye, Cpu, Brain, Users, Trophy, Tag, Upload, ExternalLink, Calendar, MapPin, type LucideIcon } from "lucide-react";

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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.user) return;
    (async () => {
      const uid = auth.user!.id;
      const [pm, prof, tm] = await Promise.all([
        supabase
          .from("project_members")
          .select("project_id, projects(id, title, description, status)")
          .eq("user_id", uid),
        supabase
          .from("profiles")
          .select("full_name, username, carrera, semestre, phone, bio, github_url, linkedin_url, avatar_url")
          .eq("id", uid)
          .maybeSingle(),
        supabase
          .from("team_members")
          .select("team_id, teams(id, name, slug, focus, description)")
          .eq("user_id", uid)
          .maybeSingle(),
      ]);

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
            .select("user_id, role_in_team, profiles:user_id(full_name, username, avatar_url)")
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
        setMates(
          (tMembers.data ?? [])
            .filter((r) => r.user_id !== uid)
            .map((r) => {
              const p = (r.profiles ?? {}) as { full_name?: string; username?: string | null; avatar_url?: string | null };
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
        carrera: draft.carrera?.trim() || null,
        semestre: draft.semestre?.trim() || null,
        phone: draft.phone?.trim() || null,
        bio: draft.bio?.trim() || null,
        github_url: draft.github_url?.trim() || null,
        linkedin_url: draft.linkedin_url?.trim() || null,
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
            <FieldInput label="Carrera" value={draft.carrera ?? ""} onChange={(v) => set("carrera", v)} maxLength={120} />
            <FieldInput label="Semestre" value={draft.semestre ?? ""} onChange={(v) => set("semestre", v)} maxLength={20} />
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

      <TeamCard team={team} mates={mates} loading={loading} />

      <Card className="mt-6 border-border/70 p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Proyectos</h2>
        {loading ? (
          <p className="mt-3 text-sm text-muted-foreground">Cargando...</p>
        ) : projects.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Aún no tienes proyectos asignados. Contacta a tu coordinador.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {projects.map((p) => (
              <li key={p.id} className="rounded-lg border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  <Badge variant="outline">{p.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <CompetitionsCard competitions={competitions} loading={loading} hasTeam={!!team} />

      <ToolsCard />
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
