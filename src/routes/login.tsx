import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { NodeBackdrop } from "@/components/NodeBackdrop";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/perceptia-logo.svg";
import { ArrowLeft, Camera, Loader2, User as UserIcon, X as XIcon } from "lucide-react";


export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Ingresar — PerceptIA" },
      { name: "description", content: "Accede al portal interno del semillero PerceptIA." },
    ],
  }),
  component: LoginPage,
});

type Mode = "signin" | "signup" | "forgot";

const signInSchema = z.object({
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(128),
});

const signUpSchema = signInSchema
  .extend({
    full_name: z.string().trim().min(2, "Ingresa tu nombre").max(120),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9_.]{3,30}$/, "Usa 3-30 caracteres: a-z, 0-9, _ o ."),
    confirm_password: z.string().min(6, "Confirma tu contraseña").max(128),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirm_password"],
  });

function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [signupSent, setSignupSent] = useState(false);
  const [signupAvatarUploaded, setSignupAvatarUploaded] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const onAvatarChange = (file: File | null) => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      setGlobalError("La foto debe pesar menos de 2 MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [auth.isAuthenticated, navigate]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGlobalError(null);
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const fullName = String(fd.get("full_name") ?? "");
    const username = String(fd.get("username") ?? "").trim().toLowerCase();

    if (mode === "forgot") {
      const r = z.string().email().safeParse(email);
      if (!r.success) return setErrors({ email: "Correo inválido" });
      setLoading(true);
      const { error } = await auth.resetPassword(email);
      setLoading(false);
      if (error) return setGlobalError(error);
      setForgotSent(true);
      return;
    }

    if (mode === "signup") {
      const confirmPassword = String(fd.get("confirm_password") ?? "");
      const r = signUpSchema.safeParse({ email, password, full_name: fullName, username, confirm_password: confirmPassword });
      if (!r.success) {
        const fe: Record<string, string> = {};
        r.error.issues.forEach((i) => i.path[0] && (fe[String(i.path[0])] = i.message));
        return setErrors(fe);
      }
      setLoading(true);
      const { error, needsEmailConfirm } = await auth.signUp(email, password, fullName, username, avatarFile);
      setLoading(false);
      if (error) return setGlobalError(error);
      setSignupAvatarUploaded(!!avatarFile && !needsEmailConfirm);
      setSignupSent(true);
      return;
    }

    const r = signInSchema.safeParse({ email, password });
    if (!r.success) {
      const fe: Record<string, string> = {};
      r.error.issues.forEach((i) => i.path[0] && (fe[String(i.path[0])] = i.message));
      return setErrors(fe);
    }
    setLoading(true);
    const { error } = await auth.signIn(email, password);
    setLoading(false);
    if (error) return setGlobalError(error);
    navigate({ to: "/dashboard" });
  };

  const title =
    mode === "signup" ? "Crear cuenta" : mode === "forgot" ? "Recuperar contraseña" : "Ingresar al portal";

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
            <h1 className="mt-6 font-display text-2xl font-bold text-foreground">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === "signup"
                ? "Regístrate para acceder al portal interno."
                : mode === "forgot"
                ? "Te enviaremos un enlace de recuperación."
                : "Acceso para integrantes del semillero."}
            </p>
          </div>

          {forgotSent ? (
            <div className="mt-8 rounded-lg border border-primary/20 bg-primary-soft p-5 text-center text-sm text-foreground">
              Si el correo existe, recibirás un enlace de recuperación.
              <button
                onClick={() => { setMode("signin"); setForgotSent(false); }}
                className="mt-4 block w-full text-xs font-semibold text-primary hover:underline"
              >
                Volver al inicio de sesión
              </button>
            </div>
          ) : signupSent ? (
            <div className="mt-8 rounded-lg border border-primary/20 bg-primary-soft p-5 text-center text-sm text-foreground">
              <p className="font-semibold text-foreground">¡Cuenta creada!</p>
              <p className="mt-2 text-muted-foreground">
                Te enviamos un correo de confirmación. Revisa tu bandeja de entrada
                (y la carpeta de spam) y haz clic en el enlace para activar tu cuenta
                antes de iniciar sesión.
              </p>
              {avatarFile && !signupAvatarUploaded && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Tu foto se podrá subir después desde <span className="font-semibold">Mi perfil</span> al iniciar sesión.
                </p>
              )}
              {signupAvatarUploaded && (
                <p className="mt-3 text-xs text-muted-foreground">Foto de perfil guardada ✓</p>
              )}
              <button
                onClick={() => { setMode("signin"); setSignupSent(false); }}
                className="mt-4 block w-full text-xs font-semibold text-primary hover:underline"
              >
                Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
              {mode === "signup" && (
                <>
                  <div>
                    <Label htmlFor="full_name">Nombre completo</Label>
                    <Input id="full_name" name="full_name" autoComplete="name" className="mt-1.5" />
                    {errors.full_name && <p className="mt-1 text-xs text-destructive">{errors.full_name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="username">Nombre de usuario</Label>
                    <Input
                      id="username"
                      name="username"
                      autoComplete="username"
                      placeholder="ej: juan.perez"
                      className="mt-1.5"
                      maxLength={30}
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">3-30 caracteres: a-z, 0-9, _ o .</p>
                    {errors.username && <p className="mt-1 text-xs text-destructive">{errors.username}</p>}
                  </div>
                  <div>
                    <Label>Foto de perfil (opcional)</Label>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-primary-soft text-primary">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Vista previa" className="h-full w-full object-cover" />
                        ) : (
                          <UserIcon className="h-5 w-5" />
                        )}
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary">
                        <Camera className="h-3.5 w-3.5" />
                        {avatarPreview ? "Cambiar" : "Subir foto"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={() => onAvatarChange(null)}
                          className="text-xs text-destructive hover:underline"
                        >
                          <XIcon className="inline h-3 w-3" /> Quitar
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">JPG, PNG, WEBP o GIF. Máx 2 MB.</p>
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" name="email" type="email" autoComplete="email" placeholder="tu@correo.com" className="mt-1.5" />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>

              {mode !== "forgot" && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        ¿Olvidaste?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className="mt-1.5"
                  />
                  {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
                </div>
              )}

              {mode === "signup" && (
                <div>
                  <Label htmlFor="confirm_password">Confirmar contraseña</Label>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    autoComplete="new-password"
                    className="mt-1.5"
                  />
                  {errors.confirm_password && <p className="mt-1 text-xs text-destructive">{errors.confirm_password}</p>}
                </div>
              )}

              {globalError && (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                  {globalError}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "signup" ? "Crear cuenta" : mode === "forgot" ? "Enviar enlace" : "Ingresar"}
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                {mode === "signin" ? (
                  <>
                    ¿No tienes cuenta?{" "}
                    <button type="button" onClick={() => setMode("signup")} className="font-semibold text-primary hover:underline">
                      Regístrate
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setMode("signin")} className="font-semibold text-primary hover:underline">
                    Volver al inicio de sesión
                  </button>
                )}
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
