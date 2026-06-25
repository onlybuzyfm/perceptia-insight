import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PublicLayout } from "@/components/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Send } from "lucide-react";

export const Route = createFileRoute("/postular")({
  component: PostularPage,
  head: () => ({
    meta: [
      { title: "Postular a PerceptIA — Únete a la investigación" },
      { name: "description", content: "Postula para integrarte al semillero de investigación PerceptIA y desarrolla proyectos en inteligencia artificial." },
    ],
  }),
});

function PostularPage() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Postula a PerceptIA
          </h1>
          <p className="mt-3 text-muted-foreground">
            Comparte tu interés, te contactaremos para conocerte mejor y asignarte a un proyecto activo.
          </p>
        </header>
        <Card className="mt-8 border-border/70 bg-white p-6 sm:p-8">
          <ApplicationForm />
        </Card>
      </section>
    </PublicLayout>
  );
}

function ApplicationForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    carrera: "Ciencia de Datos e Inteligencia Artificial",
    semestre: "",
    interest_area: "",
    message: "",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error("Nombre y correo son obligatorios");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("applications").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      carrera: form.carrera.trim() || null,
      semestre: form.semestre.trim() || null,
      interest_area: form.interest_area.trim() || null,
      message: form.message.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast.error("No pudimos enviar tu postulación", { description: error.message });
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="py-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">¡Postulación enviada!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pronto nos pondremos en contacto contigo a través del correo que indicaste.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre completo *" id="full_name">
          <Input id="full_name" required value={form.full_name} onChange={update("full_name")} maxLength={200} />
        </Field>
        <Field label="Correo *" id="email">
          <Input id="email" required type="email" value={form.email} onChange={update("email")} maxLength={255} />
        </Field>
        <Field label="Teléfono" id="phone">
          <Input id="phone" value={form.phone} onChange={update("phone")} maxLength={50} />
        </Field>
        <Field label="Carrera" id="carrera">
          <Input id="carrera" value="Ciencia de Datos e Inteligencia Artificial" readOnly disabled />
        </Field>
        <Field label="Semestre" id="semestre">
          <Input id="semestre" value={form.semestre} onChange={update("semestre")} maxLength={50} />
        </Field>
        <Field label="Área de interés" id="interest_area">
          <Input
            id="interest_area"
            placeholder="Visión por computador, NLP, robótica…"
            value={form.interest_area}
            onChange={update("interest_area")}
            maxLength={200}
          />
        </Field>
      </div>
      <Field label="¿Por qué quieres unirte?" id="message">
        <Textarea id="message" rows={4} value={form.message} onChange={update("message")} maxLength={4000} />
      </Field>
      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        <Send className="mr-2 h-4 w-4" />
        {submitting ? "Enviando…" : "Enviar postulación"}
      </Button>
    </form>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
