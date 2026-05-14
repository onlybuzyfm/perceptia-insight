import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout, SectionHeader } from "@/components/PublicLayout";
import { NodeBackdrop } from "@/components/NodeBackdrop";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import academyLogo from "@/assets/perceptia-academy-logo.svg";
import {
  ArrowRight,
  Brain,
  Eye,
  Bot,
  BarChart3,
  Workflow,
  Cloud,
  GraduationCap,
  Github,
  Plug,
  Container,
  LineChart,
  Sparkles,
  Users,
  Check,
  X,
} from "lucide-react";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "PerceptIA Academy — Aprender construyendo" },
      {
        name: "description",
        content:
          "Ecosistema académico y tecnológico de PerceptIA: IA aplicada, visión artificial, robótica, ciencia de datos y automatización con proyectos reales.",
      },
      { property: "og:title", content: "PerceptIA Academy" },
      {
        property: "og:description",
        content:
          "Formación universitaria potenciada con experiencias reales en IA, datos, visión, robótica y automatización.",
      },
    ],
  }),
  component: AcademyPage,
});

const PHILOSOPHY = [
  { icon: Brain, emoji: "🧠", title: "IA Aplicada", desc: "Modelos de Machine Learning, Deep Learning, LLMs y agentes inteligentes aplicados a escenarios reales." },
  { icon: Eye, emoji: "👁️", title: "Visión Artificial", desc: "Sistemas capaces de interpretar imágenes, video y datos visuales mediante percepción artificial moderna." },
  { icon: Bot, emoji: "", title: "Robótica con IA", desc: "Integración de sensores, automatización y sistemas inteligentes conectados con el mundo físico." },
  { icon: BarChart3, emoji: "📊", title: "Ciencia de Datos", desc: "Análisis, visualización, predicción y soluciones basadas en información real." },
  { icon: Workflow, emoji: "", title: "Automatización Inteligente", desc: "Flujos automatizados, APIs, agentes IA y herramientas modernas para optimizar procesos." },
  { icon: Cloud, emoji: "☁️", title: "Desarrollo y Deploy", desc: "Infraestructura moderna, Docker, cloud, APIs y despliegue de soluciones tecnológicas." },
];

const STEPS = [
  { n: "01", title: "Fundamentos", desc: "Python, datos, IA, programación y bases computacionales." },
  { n: "02", title: "Construcción", desc: "Desarrollo de proyectos reales y resolución de problemas aplicados." },
  { n: "03", title: "Colaboración", desc: "Trabajo en equipos multidisciplinarios y líneas de investigación." },
  { n: "04", title: "Implementación", desc: "Despliegue de aplicaciones, automatización y soluciones funcionales." },
  { n: "05", title: "Proyección profesional", desc: "Portafolio, investigación aplicada y participación en iniciativas tecnológicas." },
];

const ECOSYSTEM = [
  { icon: GraduationCap, label: "Moodle académico" },
  { icon: Github, label: "GitHub y control de versiones" },
  { icon: Plug, label: "APIs y automatización" },
  { icon: Container, label: "Cloud y Docker" },
  { icon: LineChart, label: "Dashboards y visualización" },
  { icon: Sparkles, label: "IA generativa" },
  { icon: Bot, label: "Agentes inteligentes" },
  { icon: Users, label: "Proyectos colaborativos" },
];

const COMPARISON: { traditional: string; academy: string }[] = [
  { traditional: "Ejercicios académicos aislados", academy: "Casos y proyectos reales" },
  { traditional: "Materias separadas", academy: "Integración multidisciplinaria" },
  { traditional: "Enfoque teórico", academy: "Construcción práctica" },
  { traditional: "Tecnologías limitadas", academy: "Herramientas modernas" },
  { traditional: "Aprendizaje individual", academy: "Trabajo colaborativo" },
  { traditional: "Poco despliegue real", academy: "Soluciones funcionales" },
];

const EXPERTS = [
  "Expertos en IA",
  "Investigadores",
  "Desarrolladores",
  "Profesionales de industria",
  "Colaboradores nacionales e internacionales",
];

function AcademyPage() {
  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-fade" />
        <NodeBackdrop className="opacity-70" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <GraduationCap className="h-3.5 w-3.5" /> PerceptIA Academy
            </span>
            <div className="mt-6 flex justify-center">
              <img
                src={academyLogo}
                alt="PerceptIA Academy logo"
                className="h-32 w-32 sm:h-40 sm:w-40 drop-shadow-[0_8px_24px_oklch(0.38_0.16_305_/_0.35)]"
              />
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl text-slate-500">
              Percept<span className="text-primary">IA</span> Academy
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Potenciamos la formación universitaria mediante experiencias reales en
              Inteligencia Artificial, Ciencia de Datos, Visión Artificial, Robótica y Automatización.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Una plataforma académica y tecnológica donde los estudiantes aprenden construyendo
              proyectos reales, colaborando con equipos multidisciplinarios y trabajando con
              herramientas modernas utilizadas en investigación e industria.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <a href="https://moodle.perceptia.dev/" target="_blank" rel="noopener noreferrer">
                  Ir a PerceptIA Academy <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary-soft">
                <Link to="/lineas">
                  Explorar líneas de aprendizaje
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary-soft">
                <a href="https://forms.office.com/r/c14PfYPa2i" target="_blank" rel="noopener noreferrer">
                  Unirse a la comunidad
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ¿QUÉ ES? */}
      <section className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeader
            eyebrow="¿Qué es PerceptIA Academy?"
            title="Más allá de la malla académica"
          />
          <div className="mx-auto mt-10 max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground">
            <p>
              PerceptIA Academy nace como un ecosistema de aprendizaje práctico que complementa
              la formación universitaria tradicional.
            </p>
            <p>
              Mientras la malla académica proporciona fundamentos teóricos y científicos,
              PerceptIA Academy impulsa experiencias reales de desarrollo, investigación e
              implementación tecnológica.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Desarrollan proyectos reales",
              "Trabajan en equipos colaborativos",
              "Utilizan herramientas modernas",
              "Crean portafolio técnico",
              "Interactúan con expertos",
              "Construyen soluciones de IA aplicada",
            ].map((item) => (
              <Card key={item} className="flex items-center gap-3 border-border/70 p-4 shadow-[var(--shadow-card)]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Check className="h-4 w-4" />
                </div>
                <span className="text-sm text-foreground">{item}</span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FILOSOFÍA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader eyebrow="Filosofía" title="Aprender construyendo" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PHILOSOPHY.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="group border-border/70 p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ¿CÓMO SE APRENDE? — TIMELINE */}
      <section className="border-y border-border/60 bg-gradient-to-b from-primary-soft/40 to-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeader
            eyebrow="¿Cómo se aprende?"
            title="Formación basada en experiencias reales"
          />
          <ol className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-5">
            {STEPS.map((s) => (
              <li key={s.n} className="relative">
                <Card className="h-full border-border/70 p-5 shadow-[var(--shadow-card)]">
                  <span className="font-display text-xs font-semibold text-primary/70">{s.n}</span>
                  <p className="mt-2 font-display text-base font-semibold text-foreground">{s.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ECOSISTEMA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="Ecosistema"
          title="Un ecosistema tecnológico y académico"
          description="PerceptIA Academy integra herramientas modernas utilizadas en entornos reales de desarrollo e investigación."
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ECOSYSTEM.map(({ icon: Icon, label }) => (
            <Card key={label} className="flex items-center gap-3 border-border/70 p-4 shadow-[var(--shadow-card)] transition-all hover:border-primary/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-foreground">{label}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* EXPERTOS */}
      <section className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Expertos y colaboradores</span>
              <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
                Aprendizaje junto a expertos
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                La Academy incorpora talleres, masterclasses y espacios colaborativos con
                profesionales externos, investigadores y especialistas en distintas áreas tecnológicas.
              </p>
            </div>
            <div className="grid gap-3">
              {EXPERTS.map((e) => (
                <Card key={e} className="flex items-center gap-3 border-border/70 bg-background p-4 shadow-[var(--shadow-card)]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-foreground">{e}</span>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DIFERENCIAL — COMPARATIVA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="Diferencial"
          title="¿Qué hace diferente a PerceptIA Academy?"
        />
        <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-2xl border border-border/70 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-2 bg-secondary/60">
            <div className="flex items-center gap-2 px-5 py-4 text-sm font-semibold text-muted-foreground">
              <X className="h-4 w-4" /> Formación tradicional
            </div>
            <div className="flex items-center gap-2 border-l border-border/70 bg-primary-soft px-5 py-4 text-sm font-semibold text-primary">
              <Check className="h-4 w-4" /> PerceptIA Academy
            </div>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={i} className="grid grid-cols-2 border-t border-border/70 bg-background">
              <div className="px-5 py-4 text-sm text-muted-foreground">{row.traditional}</div>
              <div className="border-l border-border/70 px-5 py-4 text-sm font-medium text-foreground">
                {row.academy}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VISIÓN */}
      <section className="border-y border-border/60 bg-gradient-to-b from-primary-soft/40 to-background">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-background p-8 shadow-[var(--shadow-elegant)] sm:p-12">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-soft blur-2xl" />
            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Visión</span>
              <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
                Construyendo la próxima generación de talento tecnológico
              </h2>
              <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  PerceptIA Academy busca formar estudiantes capaces de investigar, desarrollar e
                  implementar soluciones inteligentes con impacto real en educación, industria,
                  territorio y sociedad.
                </p>
                <p>
                  Nuestra visión es crear una comunidad donde la tecnología, la investigación y la
                  innovación converjan para transformar ideas en soluciones reales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-[var(--gradient-soft)] p-10 sm:p-14">
          <NodeBackdrop className="opacity-50" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Construye proyectos reales mientras aprendes
              </h3>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Únete a una comunidad enfocada en IA aplicada, percepción artificial, robótica,
                automatización y desarrollo tecnológico moderno.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link to="/lineas">
                  Explorar Academy <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary-soft">
                <a href="https://forms.office.com/r/c14PfYPa2i" target="_blank" rel="noopener noreferrer">
                  Formar parte de PerceptIA
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
