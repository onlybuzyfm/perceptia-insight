import { Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { LayoutDashboard, FileText, BookOpen, LogOut, Users, Settings, GraduationCap } from "lucide-react";
import logo from "@/assets/perceptia-logo.svg";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function DashboardShell({ children, title }: { children: ReactNode; title: string }) {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await auth.signOut();
    navigate({ to: "/" });
  };

  const isStaff = auth.isStaff();
  const isAdmin = auth.hasRole("admin");

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <img src={logo} alt="" aria-hidden="true" className="h-9 w-auto" />
            <span className="font-display text-lg font-bold text-slate-500">
              Percept<span className="text-primary">IA</span>
              <span className="ml-2 rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Portal
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {auth.user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1.5 h-3.5 w-3.5" /> Salir
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            <SideLink to="/dashboard" icon={LayoutDashboard} label="Inicio" />
            <SideLink to="/dashboard/student" icon={GraduationCap} label="Mi espacio" />
            <SideLink to="/weekly-updates" icon={FileText} label="Avances semanales" />
            <SideLink to="/resources" icon={BookOpen} label="Recursos" />
            {isStaff && (
              <SideLink to="/dashboard/coordinator" icon={Users} label="Coordinación" />
            )}
            {isAdmin && (
              <SideLink to="/dashboard/admin" icon={Settings} label="Administración" />
            )}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SideLink({ to, icon: Icon, label }: { to: string; icon: typeof LayoutDashboard; label: string }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/dashboard" }}
      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
      activeProps={{ className: "bg-primary-soft text-primary" }}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
