import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicLayout, SectionHeader } from "@/components/PublicLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RESULTS } from "@/data/content";
import { supabase } from "@/integrations/supabase/client";
import {
  Apple, Tags, GraduationCap, Bot, Satellite, Landmark, Cpu, Globe,
  ScanSearch, ShieldAlert, CloudRain, BrainCircuit, Database, Network,
  FlaskConical, ChartLine, Code, Zap,
  type LucideIcon,
} from "lucide-react";

const PROJECT_ICONS: Record<string, LucideIcon> = {
  apple: Apple, tags: Tags, "graduation-cap": GraduationCap, bot: Bot,
  satellite: Satellite, landmark: Landmark, cpu: Cpu, globe: Globe,
  "scan-search": ScanSearch, "shield-alert": ShieldAlert, "cloud-rain": CloudRain,
  "brain-circuit": BrainCircuit, database: Database, network: Network,
  "flask-conical": FlaskConical, "chart-line": ChartLine, code: Code, zap: Zap,
};

type ProjectStatus = "propuesto" | "planificacion" | "activo" | "pausado" | "finalizado" | "publicado" | "archivado";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  propuesto: "Propuesto",
  planificacion: "En planificación",
  activo: "Activo",
  pausado: "Pausado",
  finalizado: "Finalizado",
  publicado: "Publicado",
  archivado: "Archivado",
};

const STATUS_STYLES: Record<ProjectStatus, string> = {
  activo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  publicado: "bg-primary-soft text-primary border-primary/20",
  planificacion: "bg-amber-50 text-amber-700 border-amber-200",
  finalizado: "bg-sky-50 text-sky-700 border-sky-200",
  propuesto: "bg-muted text-muted-foreground border-border",
  pausado: "bg-orange-50 text-orange-700 border-orange-200",
  archivado: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

interface DbProject {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  icon: string | null;
  line: string | null;
}

export const Route = createFileRoute("/proyectos")({
  head: () => ({
    meta: [
      { title: "Proyectos — PerceptIA" },
      { name: "description", content: "Proyectos destacados de PerceptIA: datasets, agentes, TinyML, superresolución satelital y más." },
      { property: "og:title", content: "Proyectos — PerceptIA" },
      { property: "og:description", content: "Datasets, agentes académicos, TinyML y plataformas del semillero." },
    ],
  }),
  component: ProyectosPage,
});

function ProyectosPage() {
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, title, description, status, icon, line")
        .eq("is_published", true)
        .order("created_at", { ascending: true });
      setProjects((data ?? []) as DbProject[]);
      setLoading(false);
    })();
  }, []);

  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="Proyectos"
          title="Investigación en marcha"
          description="Iniciativas activas del semillero, desde datasets contextualizados hasta sistemas embebidos."
        />
        {loading ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">Cargando proyectos…</p>
        ) : projects.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">Aún no hay proyectos publicados.</p>
        ) : (
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const Icon = PROJECT_ICONS[p.icon ?? "globe"] ?? Globe;
            return (
            <Card key={p.id} className="group flex flex-col border-border/70 p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className={`w-fit ${STATUS_STYLES[p.status]}`}>
                  {STATUS_LABELS[p.status]}
                </Badge>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold leading-tight text-foreground">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
              {p.line && (
                <div className="mt-5 flex items-center gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Línea: <span className="font-medium text-foreground">{p.line}</span></span>
                </div>
              )}
            </Card>
            );
          })}
        </div>
        )}
      </section>

      {/* Resultados esperados */}
      <section className="border-t border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Resultados esperados"
            title="Indicadores de impacto"
            description="Métricas de producción y formación que orientan la actividad del semillero."
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {RESULTS.map((r) => (
              <Card key={r.label} className="border-border/70 bg-background p-5 shadow-[var(--shadow-card)]">
                <p className="font-display text-sm font-semibold text-primary">{r.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.value}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
