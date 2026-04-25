import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout, SectionHeader } from "@/components/PublicLayout";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { ACTIVITIES } from "@/data/content";

export const Route = createFileRoute("/actividades")({
  head: () => ({
    meta: [
      { title: "Actividades — PerceptIA" },
      { name: "description", content: "Actividades del semillero: prototipado, datasets, modelos, seminarios y eventos científicos." },
      { property: "og:title", content: "Actividades — PerceptIA" },
      { property: "og:description", content: "Lo que hacemos cada semana en PerceptIA." },
    ],
  }),
  component: ActividadesPage,
});

function ActividadesPage() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="Actividades"
          title="Lo que hacemos en el semillero"
          description="Del dato al prototipo: actividades regulares de PerceptIA."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIVITIES.map((a, i) => (
            <Card key={i} className="flex items-start gap-4 border-border/70 p-5 shadow-[var(--shadow-card)] transition-all hover:border-primary/40">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Check className="h-4 w-4" />
              </div>
              <p className="text-sm leading-relaxed text-foreground">{a}</p>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
