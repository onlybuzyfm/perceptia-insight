import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout, SectionHeader } from "@/components/PublicLayout";
import { Card } from "@/components/ui/card";
import { ABOUT_PARAGRAPHS, ABOUT_FACTS, GENERAL_OBJECTIVE, SPECIFIC_OBJECTIVES } from "@/data/content";
import { Target, Network, Microscope, Users2, Building2 } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre PerceptIA — Semillero de Investigación" },
      { name: "description", content: "Conoce a PerceptIA: misión, adscripción al grupo MODSIM, objetivos y enfoque de investigación aplicada." },
      { property: "og:title", content: "Sobre PerceptIA" },
      { property: "og:description", content: "Misión, adscripción y objetivos del semillero PerceptIA." },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader eyebrow="Sobre nosotros" title="Quiénes somos" />
        <div className="mx-auto mt-10 max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground">
          {ABOUT_PARAGRAPHS.map((p, i) => <p key={i}>{p}</p>)}
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ABOUT_FACTS.map((f) => (
            <Card key={f.label} className="border-border/70 p-5 shadow-[var(--shadow-card)]">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{f.label}</p>
              <p className="mt-2 font-display text-base font-semibold text-foreground">{f.value}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* MODSIM — Grupo de investigación matriz */}
      <section className="border-y border-border/60 bg-gradient-to-b from-primary-soft/40 to-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <Building2 className="h-3.5 w-3.5" /> Grupo de investigación matriz
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl">
                Adscritos al Grupo MODSIM
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                PerceptIA nace y se desarrolla bajo el paraguas del <strong className="text-foreground">Grupo de Investigación MODSIM</strong> (Modelado y Simulación), espacio académico que articula la investigación formativa, la producción científica y la transferencia de conocimiento desde la carrera de Ciencia de Datos e Inteligencia Artificial.
              </p>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Esta adscripción nos da respaldo institucional, líneas de trabajo consolidadas, mentoría docente y acceso a redes de colaboración para llevar nuestros proyectos desde el aula hasta publicaciones, prototipos y eventos científicos.
              </p>

              <Card className="mt-6 border-primary/20 bg-background p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-base font-bold">
                    LM
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Dirección del grupo</p>
                    <p className="mt-0.5 font-display text-base font-semibold text-foreground">Dra. Lorena Molina</p>
                    <p className="text-sm text-muted-foreground">Jefa del Grupo de Investigación MODSIM</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Microscope, title: "Investigación aplicada", desc: "Proyectos con rigor metodológico y validación empírica." },
                { icon: Network, title: "Redes y colaboración", desc: "Articulación con docentes, semilleros y aliados externos." },
                { icon: Users2, title: "Formación de talento", desc: "Estudiantes investigadores guiados por el grupo." },
                { icon: Target, title: "Producción científica", desc: "Artículos, ponencias, capítulos y prototipos." },
              ].map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="border-border/70 p-5 shadow-[var(--shadow-card)]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 font-display text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* General Objective */}
      <section className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-background p-8 shadow-[var(--shadow-elegant)] sm:p-12">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-soft blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                <Target className="h-3.5 w-3.5" /> Objetivo general
              </div>
              <p className="mt-4 font-display text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                {GENERAL_OBJECTIVE}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Specific Objectives */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader eyebrow="Objetivos específicos" title="Cómo lo hacemos" />
        <ol className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SPECIFIC_OBJECTIVES.map((obj, i) => (
            <Card key={i} className="border-border/70 p-6 shadow-[var(--shadow-card)] transition-all hover:border-primary/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display text-sm font-bold">
                {String(i + 1).padStart(2, "0")}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{obj}</p>
            </Card>
          ))}
        </ol>
      </section>
    </PublicLayout>
  );
}
