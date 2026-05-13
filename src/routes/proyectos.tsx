import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout, SectionHeader } from "@/components/PublicLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROJECTS, RESULTS, type ProjectStatus, type ProjectIcon } from "@/data/content";
import {
  Apple,
  Tags,
  GraduationCap,
  Bot,
  Satellite,
  Landmark,
  Cpu,
  Globe,
  ScanSearch,
  ShieldAlert,
  CloudRain,
  BrainCircuit,
  type LucideIcon,
} from "lucide-react";

const PROJECT_ICONS: Record<ProjectIcon, LucideIcon> = {
  apple: Apple,
  tags: Tags,
  "graduation-cap": GraduationCap,
  bot: Bot,
  satellite: Satellite,
  landmark: Landmark,
  cpu: Cpu,
  globe: Globe,
  "scan-search": ScanSearch,
  "shield-alert": ShieldAlert,
  "cloud-rain": CloudRain,
  "brain-circuit": BrainCircuit,
};

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

const STATUS_STYLES: Record<ProjectStatus, string> = {
  "Activo": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "En curso": "bg-primary-soft text-primary border-primary/20",
  "En diseño": "bg-amber-50 text-amber-700 border-amber-200",
  "Piloto": "bg-sky-50 text-sky-700 border-sky-200",
};

function ProyectosPage() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="Proyectos"
          title="Investigación en marcha"
          description="Iniciativas activas del semillero, desde datasets contextualizados hasta sistemas embebidos."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((p) => {
            const Icon = PROJECT_ICONS[p.icon];
            return (
            <Card key={p.title} className="group flex flex-col border-border/70 p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className={`w-fit ${STATUS_STYLES[p.status]}`}>
                  {p.status}
                </Badge>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold leading-tight text-foreground">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              <div className="mt-5 flex items-center gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Línea: <span className="font-medium text-foreground">{p.line}</span></span>
              </div>
            </Card>
            );
          })}
        </div>
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
