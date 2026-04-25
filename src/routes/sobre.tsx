import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout, SectionHeader } from "@/components/PublicLayout";
import { Card } from "@/components/ui/card";
import { ABOUT_PARAGRAPHS, ABOUT_FACTS, GENERAL_OBJECTIVE, SPECIFIC_OBJECTIVES } from "@/data/content";
import { Target } from "lucide-react";

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
