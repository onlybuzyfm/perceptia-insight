import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicLayout, SectionHeader } from "@/components/PublicLayout";
import { Card } from "@/components/ui/card";
import { Github, Linkedin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/integrantes")({
  head: () => ({
    meta: [
      { title: "Integrantes — PerceptIA" },
      { name: "description", content: "Conoce al equipo de PerceptIA: profesor asesor, coordinación, estudiantes investigadores y colaboradores." },
      { property: "og:title", content: "Integrantes — PerceptIA" },
      { property: "og:description", content: "Equipo del semillero PerceptIA." },
    ],
  }),
  component: IntegrantesPage,
});

interface PublicMember {
  id: string;
  full_name: string;
  username: string | null;
  public_role: string | null;
  carrera: string | null;
  bio: string | null;
  avatar_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
}

function IntegrantesPage() {
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc("get_public_members").then(({ data }) => {
      setMembers((data as PublicMember[]) ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="Integrantes"
          title="El equipo de PerceptIA"
          description="Docentes, coordinadores, estudiantes y colaboradores que construyen el semillero."
        />

        {loading ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">Cargando integrantes...</p>
        ) : members.length === 0 ? (
          <p className="mx-auto mt-12 max-w-md text-center text-sm text-muted-foreground">
            Aún no hay integrantes publicados. El equipo aparecerá aquí conforme los miembros del semillero
            sean publicados desde el panel de administración.
          </p>
        ) : (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <Card key={m.id} className="border-border/70 p-6 shadow-[var(--shadow-card)] transition-all hover:border-primary/40">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-soft text-primary">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt={m.full_name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold text-foreground">{m.full_name}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {m.public_role || "Integrante"}
                    </p>
                    {m.username && <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">@{m.username}</p>}
                  </div>
                </div>
                {(m.bio || m.carrera) && (
                  <div className="mt-5 border-t border-border/70 pt-4 text-sm text-muted-foreground">
                    {m.bio || m.carrera}
                  </div>
                )}
                {(m.github_url || m.linkedin_url) && (
                  <div className="mt-3 flex gap-2">
                    {m.github_url && (
                      <a href={m.github_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {m.linkedin_url && (
                      <a href={m.linkedin_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
          Por privacidad institucional, no publicamos información sensible (números de cédula
          ni teléfonos). Los correos institucionales se comparten en contextos académicos puntuales.
        </p>
      </section>
    </PublicLayout>
  );
}
