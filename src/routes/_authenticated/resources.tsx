import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, BookOpen, Database, Github, FileText, Cloud, Workflow, Folder } from "lucide-react";

export const Route = createFileRoute("/_authenticated/resources")({
  component: ResourcesPage,
});

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  icon: string | null;
}

const ICONS: Record<string, typeof BookOpen> = {
  moodle: BookOpen,
  dataset: Database,
  cvat: FileText,
  notion: FileText,
  github: Github,
  drive: Cloud,
  n8n: Workflow,
  otro: Folder,
};

function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("resources")
      .select("*")
      .order("display_order", { ascending: true })
      .then(({ data }) => {
        setResources(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <DashboardShell title="Recursos internos">
      <p className="text-muted-foreground">
        Accesos directos a herramientas del semillero. Cada plataforma usa sus propias credenciales.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Cargando...</p>
      ) : resources.length === 0 ? (
        <Card className="mt-6 border-dashed border-border/70 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no hay recursos publicados. Un administrador puede agregarlos.
          </p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => {
            const Icon = ICONS[r.category] ?? Folder;
            return (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noreferrer noopener"
                className="group block"
              >
                <Card className="h-full border-border/70 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40">
                  <div className="flex items-start justify-between">
                    <Icon className="h-5 w-5 text-primary" />
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold text-foreground">{r.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                  <Badge variant="outline" className="mt-3 capitalize">{r.category}</Badge>
                </Card>
              </a>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
