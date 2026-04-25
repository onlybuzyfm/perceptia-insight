import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout, SectionHeader } from "@/components/PublicLayout";
import { Card } from "@/components/ui/card";
import { User } from "lucide-react";
import { MEMBERS } from "@/data/content";

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

function IntegrantesPage() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="Integrantes"
          title="El equipo de PerceptIA"
          description="Docentes, coordinadores, estudiantes y colaboradores que construyen el semillero."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MEMBERS.map((m) => (
            <Card key={m.name} className="border-border/70 p-6 shadow-[var(--shadow-card)] transition-all hover:border-primary/40">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-base font-semibold text-foreground">{m.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">{m.role}</p>
                </div>
              </div>
              <div className="mt-5 border-t border-border/70 pt-4 text-sm text-muted-foreground">
                {m.carrera}
              </div>
            </Card>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
          Por privacidad institucional, no publicamos información sensible (números de cédula
          ni teléfonos). Los correos institucionales se comparten en contextos académicos puntuales.
        </p>
      </section>
    </PublicLayout>
  );
}
