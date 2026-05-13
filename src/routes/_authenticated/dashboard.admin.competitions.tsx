import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Plus, Trash2, Pencil, Calendar, MapPin, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/competitions")({
  component: () => <AdminShell><CompetitionsAdmin /></AdminShell>,
});

interface Competition {
  id: string;
  name: string;
  description: string;
  url: string | null;
  event_date: string | null;
  location: string | null;
}

interface TeamComp { competition_id: string; team_id: string; team_name: string; result: string | null }

function CompetitionsAdmin() {
  const [comps, setComps] = useState<Competition[]>([]);
  const [assignments, setAssignments] = useState<TeamComp[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Competition | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const [c, tc, t] = await Promise.all([
      supabase.from("competitions").select("*").order("event_date", { ascending: false, nullsFirst: false }),
      supabase.from("team_competitions").select("competition_id, team_id, result"),
      supabase.from("teams").select("id, name"),
    ]);
    const tMap = new Map((t.data ?? []).map((x) => [x.id, x.name]));
    setComps(c.data ?? []);
    setAssignments((tc.data ?? []).map((x) => ({ ...x, team_name: tMap.get(x.team_id) ?? "—" })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta competencia? Se quitará también de los equipos asignados.")) return;
    const { error } = await supabase.from("competitions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Competencia eliminada"); load();
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold">Competencias</h2>
          </div>
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Nueva competencia
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Registra concursos, hackathones y eventos. Luego asígnalos a los equipos desde la pestaña Equipos.
        </p>
      </Card>

      {loading ? (
        <Card className="p-6 text-sm text-muted-foreground">Cargando...</Card>
      ) : comps.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">Aún no hay competencias registradas.</Card>
      ) : (
        <div className="grid gap-3">
          {comps.map((c) => {
            const teams = assignments.filter((a) => a.competition_id === c.id);
            return (
              <Card key={c.id} className="border-border/70 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                        <Trophy className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{c.name}</h3>
                        <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {c.event_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {c.event_date}</span>}
                          {c.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.location}</span>}
                          {c.url && (
                            <a href={c.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                              <ExternalLink className="h-3 w-3" /> Enlace
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    {c.description && <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>}
                    {teams.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {teams.map((t, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {t.team_name}{t.result ? ` · ${t.result}` : ""}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(c.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CompetitionDialog
        open={open}
        editing={editing}
        onClose={() => setOpen(false)}
        onSaved={() => { setOpen(false); load(); }}
      />
    </div>
  );
}

function CompetitionDialog({ open, editing, onClose, onSaved }: { open: boolean; editing: Competition | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setDescription(editing?.description ?? "");
      setUrl(editing?.url ?? "");
      setEventDate(editing?.event_date ?? "");
      setLocation(editing?.location ?? "");
    }
  }, [open, editing]);

  const save = async () => {
    if (!name.trim()) return toast.error("Ingresa el nombre");
    const payload = {
      name: name.trim(),
      description,
      url: url || null,
      event_date: eventDate || null,
      location: location || null,
    };
    const { error } = editing
      ? await supabase.from("competitions").update(payload).eq("id", editing.id)
      : await supabase.from("competitions").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Competencia actualizada" : "Competencia creada");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar competencia" : "Nueva competencia"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div><Label className="text-xs">Nombre *</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
          <div><Label className="text-xs">Descripción</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" rows={3} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Fecha</Label><Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Lugar</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1" /></div>
          </div>
          <div><Label className="text-xs">URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="mt-1" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} className="bg-primary hover:bg-primary/90">{editing ? "Guardar" : "Crear"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
