import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashboardShell } from "@/components/DashboardShell";
import { AvatarUploader } from "@/components/AvatarUploader";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Save, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/student")({
  component: StudentDashboard,
});

interface ProjectRow {
  id: string;
  title: string;
  description: string;
  status: string;
}

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
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [draft, setDraft] = useState<ProfileData>(EMPTY_PROFILE);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.user) return;
    (async () => {
      const [pm, prof] = await Promise.all([
        supabase
          .from("project_members")
          .select("project_id, projects(id, title, description, status)")
          .eq("user_id", auth.user!.id),
        supabase
          .from("profiles")
          .select("full_name, username, carrera, semestre, phone, bio, github_url, linkedin_url, avatar_url")
          .eq("id", auth.user!.id)
          .maybeSingle(),
      ]);
      const list: ProjectRow[] = (pm.data ?? [])
        .map((r) => r.projects as ProjectRow | null)
        .filter((p): p is ProjectRow => !!p);
      setProjects(list);
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
    <DashboardShell title="Mi espacio de estudiante">
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
            <div className="mt-5 border-y border-border/60 py-5">
              <AvatarUploader
                userId={auth.user!.id}
                avatarUrl={profile.avatar_url}
                onChange={(url) => {
                  setProfile((p) => ({ ...p, avatar_url: url }));
                  setDraft((d) => ({ ...d, avatar_url: url }));
                }}
              />
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
      </Card>

      <Card className="mt-6 border-border/70 p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Proyectos asignados</h2>
        {loading ? (
          <p className="mt-3 text-sm text-muted-foreground">Cargando...</p>
        ) : projects.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Aún no tienes un proyecto asignado. Contacta a tu coordinador.
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
    </DashboardShell>
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
