import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoami from "./tools/whoami";
import listMyProjects from "./tools/list-my-projects";
import listMyActivities from "./tools/list-my-activities";
import listMyWeeklyUpdates from "./tools/list-my-weekly-updates";
import createWeeklyUpdate from "./tools/create-weekly-update";
import listUpcomingMeetings from "./tools/list-upcoming-meetings";
import listAnnouncements from "./tools/list-announcements";

// El issuer OAuth debe ser el host directo de Supabase (no el proxy).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "perceptia-mcp",
  title: "PerceptIA",
  version: "0.1.0",
  instructions:
    "Herramientas del portal del semillero PerceptIA. Permiten consultar el perfil y roles del usuario, sus proyectos, actividades con fecha límite, avances semanales, próximas reuniones y anuncios, además de registrar un nuevo avance semanal. Todo se ejecuta con los permisos del usuario conectado.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    whoami,
    listMyProjects,
    listMyActivities,
    listMyWeeklyUpdates,
    createWeeklyUpdate,
    listUpcomingMeetings,
    listAnnouncements,
  ],
});
