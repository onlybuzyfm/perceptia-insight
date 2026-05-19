import { Link, Navigate, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FolderKanban,
  FileCheck2,
  Calendar,
  BookOpen,
  BarChart3,
  Settings,
  Palette,
  ScrollText,
  Inbox,
  Wrench,
  Trophy,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth-context";

type AdminNavItem = {
  to: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
  soon?: boolean;
};

const ADMIN_NAV: AdminNavItem[] = [
  { to: "/dashboard/admin", icon: LayoutDashboard, label: "Resumen", exact: true },
  { to: "/dashboard/admin/users", icon: Users, label: "Usuarios" },
  { to: "/dashboard/admin/students", icon: GraduationCap, label: "Estudiantes" },
  { to: "/dashboard/admin/projects", icon: FolderKanban, label: "Proyectos" },
  { to: "/dashboard/admin/teams", icon: Users, label: "Equipos" },
  { to: "/dashboard/admin/competitions", icon: Trophy, label: "Competencias" },
  { to: "/dashboard/admin/applications", icon: Inbox, label: "Postulaciones", soon: true },
  { to: "/dashboard/admin/updates", icon: FileCheck2, label: "Avances" },
  { to: "/dashboard/admin/meetings", icon: Calendar, label: "Reuniones" },
  { to: "/dashboard/admin/tools", icon: Wrench, label: "Herramientas" },
  { to: "/dashboard/admin/resources", icon: BookOpen, label: "Recursos" },
  { to: "/dashboard/admin/events", icon: Calendar, label: "Eventos", soon: true },
  { to: "/dashboard/admin/production", icon: ScrollText, label: "Producción", soon: true },
  { to: "/dashboard/admin/indicators", icon: BarChart3, label: "Indicadores", soon: true },
  { to: "/dashboard/admin/settings", icon: Settings, label: "Institucional", soon: true },
  { to: "/dashboard/admin/branding", icon: Palette, label: "Visual", soon: true },
  { to: "/dashboard/admin/audit", icon: ScrollText, label: "Auditoría", soon: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.isLoading && !auth.hasRole("admin")) {
    return <Navigate to="/dashboard" replace />;
  }

  const current = ADMIN_NAV.find((n) =>
    n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to),
  );
  const title = current ? `Admin · ${current.label}` : "Administración";

  return (
    <DashboardShell title={title}>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-wrap gap-1 lg:flex-col lg:gap-0.5">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const baseCls = "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors";
            if (item.soon) {
              return (
                <span key={item.to} className={`${baseCls} cursor-not-allowed text-muted-foreground/60`}>
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                    pronto
                  </span>
                </span>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact ?? false }}
                className={`${baseCls} text-muted-foreground hover:bg-primary-soft hover:text-primary`}
                activeProps={{ className: "bg-primary-soft text-primary" }}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <section className="min-w-0">{children}</section>
      </div>
    </DashboardShell>
  );
}
