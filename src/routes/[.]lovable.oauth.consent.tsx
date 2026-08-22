import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NodeBackdrop } from "@/components/NodeBackdrop";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/perceptia-logo.svg";
import { ShieldCheck } from "lucide-react";

type OAuthClient = { name?: string; client_name?: string; redirect_uri?: string };
type AuthorizationDetails = {
  client?: OAuthClient;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Falta el parámetro authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/login", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: ConsentPage,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-md border-border/70 p-8 text-center">
        <h1 className="font-display text-lg font-semibold text-foreground">No se pudo cargar la autorización</h1>
        <p className="mt-2 text-sm text-muted-foreground">{String((error as Error)?.message ?? error)}</p>
      </Card>
    </main>
  ),
});

const SCOPE_LABELS: Record<string, string> = {
  openid: "Identificarte en el portal",
  email: "Ver tu correo electrónico",
  profile: "Ver tu perfil básico",
};

function ConsentPage() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "una aplicación";
  const scopes = (details?.scope ?? "").split(/\s+/).filter(Boolean);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error: err } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("El servidor de autorización no devolvió una URL de retorno.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <NodeBackdrop className="opacity-60" />
      <div className="absolute inset-0 bg-radial-fade" />
      <Card className="relative w-full max-w-md border-border/70 bg-background p-8 shadow-[var(--shadow-elegant)]">
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="PerceptIA" className="h-11 w-auto" />
          <h1 className="mt-6 font-display text-xl font-bold text-foreground">
            Conectar {clientName} con PerceptIA
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esto permitirá que {clientName} use las herramientas del portal actuando como tú.
          </p>
        </div>

        {details?.client?.redirect_uri && (
          <p className="mt-4 break-all rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-center font-mono text-[11px] text-muted-foreground">
            {details.client.redirect_uri}
          </p>
        )}

        {scopes.length > 0 && (
          <ul className="mt-5 space-y-2 text-sm text-foreground">
            {scopes.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{SCOPE_LABELS[s] ?? `Permiso adicional solicitado: ${s}`}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-5 text-xs text-muted-foreground">
          Esto no omite los permisos del portal: seguirás viendo únicamente los datos que tu rol permite.
        </p>

        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
            {busy ? "Procesando..." : "Autorizar"}
          </Button>
          <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
            Cancelar
          </Button>
        </div>
      </Card>
    </main>
  );
}
