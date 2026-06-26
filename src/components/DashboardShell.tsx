import { Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { LayoutDashboard, FileText, BookOpen, LogOut, Users, Settings, GraduationCap, User as UserIcon, ChevronDown, Briefcase } from "lucide-react";
import logo from "@/assets/perceptia-logo.svg";
import { useAuth } from "@/lib/auth-context";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

export function DashboardShell({ children, title }: { children: ReactNode; title: string }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ username: string; full_name: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!auth.user) return;
    supabase
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("id", auth.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile({ username: data.username ?? "", full_name: data.full_name ?? "", avatar_url: data.avatar_url ?? null });
      });
  }, [auth.user]);

  const handleSignOut = async () => {
    await auth.signOut();
    navigate({ to: "/" });
  };

  const isStaff = auth.isStaff();
  const isAdmin = auth.hasRole("admin");

  const displayName = profile?.username || profile?.full_name?.split(" ")[0] || auth.user?.email?.split("@")[0] || "usuario";
  const initials = (profile?.full_name || profile?.username || auth.user?.email || "U")
    .split(/[\s._]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-1.5 py-1 pr-2.5 text-sm transition-colors hover:bg-secondary">
                <Avatar className="h-7 w-7">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
                  <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">
                    {initials || <UserIcon className="h-3.5 w-3.5" />}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden font-medium text-foreground sm:inline">@{displayName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">@{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">{auth.user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" /> Ajustes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            <SideLink to="/dashboard" icon={LayoutDashboard} label="Inicio" />
            <SideLink to="/dashboard/student" icon={GraduationCap} label="Mi espacio" />
            <SideLink to="/weekly-updates" icon={FileText} label="Avances semanales" />
            <SideLink to="/resources" icon={BookOpen} label="Recursos" />
            {auth.hasRole("docente_asociado") && (
              <SideLink to="/dashboard/teacher" icon={Briefcase} label="Mis proyectos" />
            )}
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
