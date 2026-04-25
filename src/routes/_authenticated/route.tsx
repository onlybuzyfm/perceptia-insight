import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

// Force pathless layout — no path conflict with index route

function AuthenticatedLayout() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (auth.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">Acceso restringido</h1>
          <p className="mt-3 text-muted-foreground">
            Necesitas iniciar sesión para acceder a esta sección del portal.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Iniciar sesión
            </Link>
            <button
              onClick={() => navigate({ to: "/" })}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
            >
              Volver al inicio
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return <Outlet />;
}
