import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { NodeBackdrop } from "@/components/NodeBackdrop";
import logo from "@/assets/perceptia-logo.png";
import { ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Ingresar — PerceptIA" },
      { name: "description", content: "Accede al portal interno del semillero PerceptIA." },
    ],
  }),
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Correo electrónico inválido").max(255),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(128),
});

function LoginPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGlobalError(null);
    const form = new FormData(e.currentTarget);

    if (forgotMode) {
      const email = String(form.get("email") ?? "");
      const r = z.string().email().safeParse(email);
      if (!r.success) {
        setErrors({ email: "Correo electrónico inválido" });
        return;
      }
      setErrors({});
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setForgotSent(true);
      }, 700);
      return;
    }

    const result = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
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
    setLoading(true);
    // Mock — backend aún no conectado.
    setTimeout(() => {
      setLoading(false);
      setGlobalError("El portal interno se habilitará en la siguiente fase. Conecta Lovable Cloud para activar la autenticación.");
    }, 700);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <NodeBackdrop className="opacity-60" />
      <div className="absolute inset-0 bg-radial-fade" />

      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Volver al sitio
        </Link>

        <Card className="border-border/70 bg-background p-8 shadow-[var(--shadow-elegant)] sm:p-10">
          <div className="flex flex-col items-center text-center">
            <img src={logo} alt="PerceptIA" className="h-12 w-auto" />
            <h1 className="mt-6 font-display text-2xl font-bold text-foreground">
              {forgotMode ? "Recuperar contraseña" : "Ingresar al portal"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {forgotMode
                ? "Te enviaremos un enlace de recuperación a tu correo."
                : "Acceso restringido para integrantes del semillero."}
            </p>
          </div>

          {forgotSent ? (
            <div className="mt-8 rounded-lg border border-primary/20 bg-primary-soft p-5 text-center text-sm text-foreground">
              Si el correo existe en nuestro sistema, recibirás un enlace de recuperación en los próximos minutos.
              <button
                onClick={() => { setForgotMode(false); setForgotSent(false); }}
                className="mt-4 block w-full text-xs font-semibold text-primary hover:underline"
              >
                Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" name="email" type="email" autoComplete="email" placeholder="tu@correo.com" className="mt-1.5" />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>

              {!forgotMode && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <button
                      type="button"
                      onClick={() => { setForgotMode(true); setErrors({}); setGlobalError(null); }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" className="mt-1.5" />
                  {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
                </div>
              )}

              {globalError && (
                <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                  {globalError}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {forgotMode ? "Enviar enlace" : "Ingresar"}
              </Button>

              {forgotMode && (
                <button
                  type="button"
                  onClick={() => { setForgotMode(false); setErrors({}); }}
                  className="block w-full text-center text-xs text-muted-foreground hover:text-primary"
                >
                  Volver al inicio de sesión
                </button>
              )}
            </form>
          )}

          <p className="mt-8 border-t border-border/70 pt-5 text-center text-xs text-muted-foreground">
            ¿Aún no eres parte del semillero?{" "}
            <Link to="/contacto" className="font-semibold text-primary hover:underline">
              Postula aquí
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
