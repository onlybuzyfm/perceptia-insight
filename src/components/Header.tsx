import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import logo from "@/assets/perceptia-logo.svg";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { to: "/", label: "Inicio" },
  { to: "/sobre", label: "Sobre nosotros" },
  { to: "/lineas", label: "Líneas" },
  { to: "/proyectos", label: "Proyectos" },
  { to: "/actividades", label: "Actividades" },
  { to: "/academy", label: "Academy" },
  { to: "/integrantes", label: "Integrantes" },
  { to: "/contacto", label: "Contacto" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="PerceptIA inicio">
          <img src={logo} alt="" aria-hidden="true" className="h-9 w-auto" />
          <span className="font-display text-lg font-bold leading-none text-foreground text-slate-500">
            Percept<span className="text-primary">IA</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              activeProps={{ className: "text-primary bg-primary-soft" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {auth.isAuthenticated ? (
            <>
              <Button asChild variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary-soft">
                <Link to="/dashboard">
                  <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" /> Portal
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild variant="default" size="sm" className="bg-primary hover:bg-primary/90">
              <Link to="/login">Ingresar</Link>
            </Button>
          )}
        </div>

        <button
          aria-label="Menú"
          className="rounded-md p-2 text-foreground lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-primary-soft hover:text-primary"
                activeProps={{ className: "text-primary bg-primary-soft" }}
              >
                {item.label}
              </Link>
            ))}
            {auth.isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-md border border-primary/30 px-3 py-2 text-center text-sm font-semibold text-primary"
                >
                  Ir al portal
                </Link>
                <button
                  onClick={() => { setOpen(false); handleSignOut(); }}
                  className="rounded-md px-3 py-2 text-center text-sm font-semibold text-muted-foreground"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
