import { useMemo, useState } from "react";
import {
  Apple, Tags, GraduationCap, Bot, Satellite, Landmark,
  Cpu, Globe, ScanSearch, ShieldAlert, CloudRain, BrainCircuit,
  Database, Network, FlaskConical, ChartLine, Code, Zap,
  type LucideIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ICON_MAP: Record<string, LucideIcon> = {
  apple: Apple,
  tags: Tags,
  "graduation-cap": GraduationCap,
  bot: Bot,
  satellite: Satellite,
  landmark: Landmark,
  cpu: Cpu,
  globe: Globe,
  "scan-search": ScanSearch,
  "shield-alert": ShieldAlert,
  "cloud-rain": CloudRain,
  "brain-circuit": BrainCircuit,
  database: Database,
  network: Network,
  "flask-conical": FlaskConical,
  "chart-line": ChartLine,
  code: Code,
  zap: Zap,
};

export function IconPreview({ name, className }: { name: string | null | undefined; className?: string }) {
  const Icon = (name && ICON_MAP[name]) || Globe;
  return <Icon className={cn("h-4 w-4", className)} />;
}

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const entries = useMemo(() => {
    const all = Object.entries(ICON_MAP);
    if (!q.trim()) return all;
    const t = q.toLowerCase();
    return all.filter(([n]) => n.includes(t));
  }, [q]);

  const Selected = ICON_MAP[value] ?? Globe;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 font-normal"
        >
          <Selected className="h-4 w-4 text-primary" />
          <span className="truncate">{value || "Seleccionar ícono"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <Input
          autoFocus
          placeholder="Buscar ícono…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mb-3 h-8"
        />
        <div className="grid max-h-64 grid-cols-4 gap-1.5 overflow-y-auto pr-1">
          {entries.map(([name, Icon]) => {
            const active = name === value;
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                title={name}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md border p-2 text-[10px] transition-colors",
                  active
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-transparent hover:border-border hover:bg-secondary/60 text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-foreground")} />
                <span className="truncate w-full text-center">{name}</span>
              </button>
            );
          })}
          {entries.length === 0 && (
            <p className="col-span-4 py-6 text-center text-xs text-muted-foreground">
              Sin resultados
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
