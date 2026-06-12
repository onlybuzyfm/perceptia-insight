import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Phone, GraduationCap, Calendar, Inbox, Check, X, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/applications")({
  component: () => (
    <AdminShell>
      <Applications />
    </AdminShell>
  ),
});

type Status = "pendiente" | "en_revision" | "aceptada" | "rechazada";

interface AppRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  carrera: string | null;
  semestre: string | null;
  interest_area: string | null;
  message: string;
  status: Status;
  created_at: string;
}

const STATUS_LABELS: Record<Status, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
};

const STATUS_VARIANTS: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  pendiente: "secondary",
  en_revision: "outline",
  aceptada: "default",
  rechazada: "destructive",
};

function Applications() {
  const [rows, setRows] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "todas">("pendiente");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AppRow | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("No se pudieron cargar las postulaciones");
    } else {
      setRows((data ?? []) as AppRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: Status) {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("applications")
      .update({ status, reviewed_by: u.user?.id ?? null })
      .eq("id", id);
    if (error) {
      toast.error("No se pudo actualizar", { description: error.message });
      return;
    }
    toast.success(`Postulación marcada como ${STATUS_LABELS[status].toLowerCase()}`);
    setSelected(null);
    load();
  }

  const filtered = rows.filter((r) => {
    if (filter !== "todas" && r.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.carrera ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    todas: rows.length,
    pendiente: rows.filter((r) => r.status === "pendiente").length,
    en_revision: rows.filter((r) => r.status === "en_revision").length,
    aceptada: rows.filter((r) => r.status === "aceptada").length,
    rechazada: rows.filter((r) => r.status === "rechazada").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Postulaciones</h1>
          <p className="text-sm text-muted-foreground">Revisa, acepta o rechaza las solicitudes para unirse al semillero.</p>
        </div>
        <Inbox className="h-6 w-6 text-primary" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["pendiente", "en_revision", "aceptada", "rechazada", "todas"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-white text-foreground hover:bg-accent"
            }`}
          >
            {f === "todas" ? "Todas" : STATUS_LABELS[f]} ({counts[f]})
          </button>
        ))}
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, correo o carrera…"
          className="ml-auto max-w-xs"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        <Card className="border-border/70 bg-white p-10 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">No hay postulaciones que mostrar.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <Card key={r.id} className="border-border/70 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-foreground">{r.full_name}</h3>
                    <Badge variant={STATUS_VARIANTS[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>
                    {r.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>}
                    {r.carrera && <span className="inline-flex items-center gap-1"><GraduationCap className="h-3 w-3" />{r.carrera}{r.semestre ? ` · ${r.semestre}` : ""}</span>}
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.interest_area && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Interés:</span> {r.interest_area}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setSelected(r)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {r.status !== "aceptada" && (
                    <Button size="sm" onClick={() => updateStatus(r.id, "aceptada")}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {r.status !== "rechazada" && (
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(r.id, "rechazada")}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.full_name}</DialogTitle>
            <DialogDescription>
              Postulación enviada el {selected && new Date(selected.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Row label="Correo" value={selected.email} />
              {selected.phone && <Row label="Teléfono" value={selected.phone} />}
              {selected.carrera && <Row label="Carrera" value={`${selected.carrera}${selected.semestre ? ` · ${selected.semestre}` : ""}`} />}
              {selected.interest_area && <Row label="Área de interés" value={selected.interest_area} />}
              {selected.message && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Mensaje</p>
                  <p className="mt-1 whitespace-pre-wrap rounded-md border border-border/60 bg-muted/30 p-3 text-foreground">
                    {selected.message}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground">Estado actual</p>
                <Badge className="mt-1" variant={STATUS_VARIANTS[selected.status]}>{STATUS_LABELS[selected.status]}</Badge>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-wrap gap-2 sm:justify-between">
            {selected && (
              <>
                <Button variant="outline" size="sm" onClick={() => updateStatus(selected.id, "en_revision")}>
                  Marcar en revisión
                </Button>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={() => updateStatus(selected.id, "rechazada")}>
                    Rechazar
                  </Button>
                  <Button size="sm" onClick={() => updateStatus(selected.id, "aceptada")}>
                    Aceptar
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}
