import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { PublicLayout, SectionHeader } from "@/components/PublicLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Building2, GraduationCap, Users, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto — PerceptIA" },
      { name: "description", content: "Contacta con el semillero PerceptIA en la Universidad Nacional de Chimborazo." },
      { property: "og:title", content: "Contacto — PerceptIA" },
      { property: "og:description", content: "Escríbenos y conoce más sobre el semillero." },
    ],
  }),
  component: ContactoPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre completo").max(100),
  email: z.string().trim().email("Correo electrónico inválido").max(255),
  message: z.string().trim().min(10, "El mensaje debe tener al menos 10 caracteres").max(1000),
});

const INFO = [
  { icon: Building2, title: "Universidad", value: "Universidad Nacional de Chimborazo" },
  { icon: GraduationCap, title: "Carrera", value: "Ciencia de Datos e Inteligencia Artificial" },
  { icon: Users, title: "Facultad", value: "Ciencias de la Educación, Humanas y Tecnologías" },
  { icon: Mail, title: "Correo", value: "contacto@perceptia.dev" },
];

function ContactoPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = schema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      message: form.get("message"),
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((iss) => {
        if (iss.path[0]) fieldErrors[String(iss.path[0])] = iss.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSent(true);
    e.currentTarget.reset();
  };

  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="Contacto"
          title="Hablemos de investigación"
          description="Escríbenos para colaborar, postular o conocer más sobre PerceptIA."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Info */}
          <div className="space-y-3">
            {INFO.map((i) => (
              <Card key={i.title} className="flex items-start gap-4 border-border/70 p-5 shadow-[var(--shadow-card)]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <i.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">{i.title}</p>
                  <p className="mt-1 text-sm text-foreground">{i.value}</p>
                </div>
              </Card>
            ))}
            <Card className="border-border/70 bg-primary-soft/40 p-5 text-sm text-foreground/80 shadow-[var(--shadow-card)]">
              Adscritos al grupo de investigación <span className="font-semibold text-primary">MODSIM</span> —
              Investigaciones de Modelamiento y Simulación.
            </Card>
          </div>

          {/* Form */}
          <Card className="border-border/70 p-7 shadow-[var(--shadow-elegant)] sm:p-9">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="h-12 w-12 text-primary" />
                <h3 className="mt-4 font-display text-xl font-semibold text-foreground">¡Mensaje enviado!</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Gracias por escribir a PerceptIA. Te responderemos al correo indicado.
                </p>
                <Button onClick={() => setSent(false)} variant="outline" className="mt-6 border-primary/30 text-primary hover:bg-primary-soft">
                  Enviar otro
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5" noValidate>
                <div>
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input id="name" name="name" placeholder="Tu nombre" className="mt-1.5" />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input id="email" name="email" type="email" placeholder="tu@correo.com" className="mt-1.5" />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="message">Mensaje</Label>
                  <Textarea id="message" name="message" rows={5} placeholder="Cuéntanos sobre tu interés, propuesta o consulta…" className="mt-1.5" />
                  {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  Enviar mensaje
                </Button>
              </form>
            )}
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
