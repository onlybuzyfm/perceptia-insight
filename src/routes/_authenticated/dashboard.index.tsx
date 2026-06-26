import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Users, Settings, FileText, BookOpen, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const auth = useAuth();
  const [firstName, setFirstName] = useState<string>("");

  const primaryRole = auth.hasRole("admin")
    ? "admin"
    : auth.hasRole("coordinador")
    ? "coordinador"
    : auth.hasRole("docente_asociado")
    ? "docente_asociado"
    : auth.hasRole("estudiante")
    ? "estudiante"
    : "sin rol";


  useEffect(() => {
    if (!auth.user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", auth.user.id)
      .maybeSingle()
      .then(({ data }) => {
        const name = (data?.full_name || "").trim().split(" ")[0];
        setFirstName(name);
      });
  }, [auth.user]);

  // Auto-redirect to role-specific dashboard
  if (primaryRole === "admin") return <Navigate to="/dashboard/admin" replace />;
  if (primaryRole === "coordinador") return <Navigate to="/dashboard/coordinator" replace />;
  if (primaryRole === "docente_asociado") return <Navigate to="/dashboard/student" replace />;
  if (primaryRole === "estudiante") return <Navigate to="/dashboard/student" replace />;

  return (
    <DashboardShell title={`Hola, ${firstName || "👋"} 👋`}>
      <p className="text-muted-foreground">
        Bienvenido al portal interno de PerceptIA. Tu rol actual es{" "}
        <span className="font-semibold text-primary">{primaryRole}</span>.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickCard to="/dashboard/student" icon={GraduationCap} title="Mi espacio" desc="Tu proyecto y avances." />
        <QuickCard to="/weekly-updates" icon={FileText} title="Avances semanales" desc="Registra tu progreso." />
        <QuickCard to="/resources" icon={BookOpen} title="Recursos internos" desc="Moodle, CVAT, Notion, GitHub..." />
        {auth.isStaff() && (
          <QuickCard to="/dashboard/coordinator" icon={Users} title="Coordinación" desc="Estudiantes y postulaciones." />
        )}
        {auth.hasRole("admin") && (
          <QuickCard to="/dashboard/admin" icon={Settings} title="Administración" desc="Usuarios, roles, configuración." />
        )}
      </div>
    </DashboardShell>
  );
}

function QuickCard({ to, icon: Icon, title, desc }: { to: string; icon: typeof GraduationCap; title: string; desc: string }) {
  return (
    <Link to={to}>
      <Card className="group h-full border-border/70 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card)]">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="mt-3 font-display text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        <ArrowRight className="mt-3 h-4 w-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
      </Card>
    </Link>
  );
}
