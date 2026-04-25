import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout, SectionHeader } from "@/components/PublicLayout";
import { Card } from "@/components/ui/card";
import { RESEARCH_LINES, JUSTIFICATIONS } from "@/data/content";

export const Route = createFileRoute("/lineas")({
  head: () => ({
    meta: [
      { title: "Líneas de investigación — PerceptIA" },
      { name: "description", content: "Líneas de investigación del semillero PerceptIA: visión artificial, TinyML, ciencia de datos, razonamiento difuso y más." },
      { property: "og:title", content: "Líneas de investigación — PerceptIA" },
      { property: "og:description", content: "Visión artificial, TinyML, ciencia de datos y razonamiento difuso aplicado." },
    ],
  }),
  component: LineasPage,
});

function LineasPage() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="Líneas de investigación"
          title="Hacia dónde dirigimos nuestra ciencia"
          description="Áreas en las que PerceptIA desarrolla proyectos, datasets y prototipos aplicados."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RESEARCH_LINES.map((l, i) => (
            <Card key={l.title} className="group relative overflow-hidden border-border/70 p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40">
              <span className="font-display text-xs font-semibold tracking-wider text-primary/70">
                LÍNEA {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{l.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.desc}</p>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
            </Card>
          ))}
        </div>
      </section>

      {/* Problemática */}
      <section className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Contexto"
            title="Problemática que aborda PerceptIA"
          />
          <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
            <p>
              La expansión de dispositivos conectados y de la Internet de las Cosas ha generado la necesidad
              de sensores inteligentes capaces de percibir, interpretar y actuar en tiempo real sin depender
              completamente de la nube. En contextos rurales, periféricos o con infraestructura limitada,
              las soluciones tradicionales de visión artificial e inteligencia artificial pueden resultar
              costosas o inviables debido a sus altos requerimientos de cómputo, energía y conectividad.
            </p>
            <p>
              PerceptIA responde a este desafío mediante el desarrollo de soluciones de inteligencia artificial
              ligera, percepción artificial embebida, TinyML y datasets contextualizados, orientados a
              problemáticas reales del entorno andino-ecuatoriano.
            </p>
          </div>
        </div>
      </section>

      {/* Justificación */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader eyebrow="Justificación" title="Por qué importa este semillero" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {JUSTIFICATIONS.map((j, i) => (
            <Card key={j.title} className="border-border/70 p-7 shadow-[var(--shadow-card)]">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft font-display text-sm font-bold text-primary">
                  0{i + 1}
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{j.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{j.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
