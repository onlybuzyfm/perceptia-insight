import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Cpu, Eye, Database } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { NodeBackdrop } from "@/components/NodeBackdrop";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logo from "@/assets/perceptia-logo.svg";
import { HERO, RESEARCH_LINES } from "@/data/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PerceptIA — Semillero de Investigación" },
      {
        name: "description",
        content:
          "Percepción artificial, ciencia de datos, IA y TinyML para entornos reales con recursos limitados.",
      },
    ],
  }),
  component: HomePage,
});

const PILLARS = [
  { icon: Eye, title: "Percepción artificial", desc: "Visión y sensores que interpretan el mundo." },
  { icon: Cpu, title: "TinyML embebido", desc: "Inferencia en tiempo real de bajo consumo." },
  { icon: Database, title: "Ciencia de datos", desc: "Del dato curado al modelo desplegado." },
  { icon: Sparkles, title: "Razonamiento aproximado", desc: "Inferencia difusa para la incertidumbre." },
];

function HomePage() {
  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-fade" />
        <NodeBackdrop className="opacity-70" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {HERO.subtitle}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] text-foreground sm:text-5xl lg:text-6xl">
              Percepción artificial para <span className="text-primary">entornos reales</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {HERO.tagline}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link to="/sobre">
                  Conocer el semillero <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary-soft">
                <Link to="/proyectos">Ver proyectos</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary-soft">
                <Link to="/login">Ingresar al portal</Link>
              </Button>
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary-soft via-transparent to-transparent blur-2xl" />
            <div className="relative aspect-square w-full max-w-md rounded-[2rem] border border-primary/15 bg-white p-10 shadow-[var(--shadow-elegant)]">
              <div className="absolute right-4 top-4 rounded-full bg-primary-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                perceptia.dev
              </div>
              <img src={logo} alt="Logo PerceptIA" className="h-full w-full object-contain" />
              <div className="absolute -bottom-px left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            </div>
            <figcaption className="relative mt-6 max-w-md text-center">
              <p className="font-display text-sm font-semibold text-foreground">
                El quinde andino: precisión, agilidad y percepción.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Símbolo de la sierra ecuatoriana, el colibrí encarna el espíritu de PerceptIA:
                inteligencia que observa el detalle, se adapta al entorno y conecta nuestras
                raíces andinas con la frontera de la inteligencia artificial.
              </p>
            </figcaption>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden bg-border lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div key={p.title} className="bg-background p-6">
              <p.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-display text-base font-semibold text-foreground">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LINES PREVIEW */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Líneas</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Investigación con propósito
            </h2>
          </div>
          <Button asChild variant="ghost" className="text-primary hover:bg-primary-soft">
            <Link to="/lineas">Ver todas <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RESEARCH_LINES.slice(0, 4).map((l, i) => (
            <Card key={l.title} className="group relative overflow-hidden border-border/70 p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40">
              <span className="font-display text-xs font-semibold text-primary/70">
                0{i + 1}
              </span>
              <h3 className="mt-2 font-display text-base font-semibold text-foreground">
                {l.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{l.desc}</p>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-[var(--gradient-soft)] p-10 sm:p-14">
          <NodeBackdrop className="opacity-50" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                ¿Te interesa la investigación aplicada en IA?
              </h3>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Únete a PerceptIA y colabora en proyectos de visión artificial,
                TinyML y ciencia de datos con impacto local.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <a href="https://forms.office.com/r/c14PfYPa2i" target="_blank" rel="noopener noreferrer">Postular</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary-soft">
                <Link to="/sobre">Sobre nosotros</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
