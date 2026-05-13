import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminShell } from "@/components/AdminShell";
import { Tag, Upload, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/tools")({
  component: () => <AdminShell><ToolsAdmin /></AdminShell>,
});

interface Tool {
  name: string;
  description: string;
  url: string | null;
  icon: typeof Tag;
  active: boolean;
}

const TOOLS: Tool[] = [
  {
    name: "Etiquetador",
    description: "CVAT — anotación de imágenes y video para entrenamiento de modelos.",
    url: "https://cvat.perceptia.dev/auth/login",
    icon: Tag,
    active: true,
  },
  {
    name: "Uploader",
    description: "Carga masiva de datasets al almacenamiento del laboratorio.",
    url: null,
    icon: Upload,
    active: false,
  },
];

function ToolsAdmin() {
  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-white p-4">
        <h2 className="text-sm font-semibold">Herramientas del laboratorio</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Accesos directos a las plataformas internas de PerceptIA.
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const inner = (
            <Card className={`group border-border/70 bg-white p-5 transition-all ${t.active ? "hover:border-primary/40 hover:shadow-md" : "opacity-60"}`}>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                {t.active ? (
                  <Badge variant="outline" className="border-primary/40 text-primary">Activo</Badge>
                ) : (
                  <Badge variant="outline" className="border-border text-muted-foreground">Próximamente</Badge>
                )}
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <h3 className="font-display text-lg font-semibold text-foreground">{t.name}</h3>
                {t.active && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
            </Card>
          );
          return t.active && t.url ? (
            <a key={t.name} href={t.url} target="_blank" rel="noopener noreferrer">{inner}</a>
          ) : (
            <div key={t.name}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
