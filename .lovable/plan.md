# Auditoría — Roles, Proyectos, Actividades, Avances y RLS

Sin cambios aplicados. Hallazgos ordenados por criticidad.

## 🔴 CRÍTICOS (seguridad / integridad)

### C1. Un estudiante puede insertar avances sobre CUALQUIER proyecto/actividad
- **Política:** `weekly_updates_insert_own` → `WITH CHECK (auth.uid() = user_id)`.
- **Falta:** validar que `project_id` esté en `project_members` del usuario y que `activity_id` pertenezca a ese `project_id` y que el usuario esté en `activity_assignees`.
- **Impacto:** la UI (`src/routes/_authenticated/weekly-updates.tsx`) valida, pero con un `curl` autenticado un estudiante puede reportar horas/evidencias sobre proyectos ajenos → contamina indicadores, atrasos, evaluaciones.
- **Archivos:** política SQL en `weekly_updates`, form en `weekly-updates.tsx`.

### C2. Política `project_activities_update_status_assignee` está rota
- **SQL:** `WHERE aa.activity_id = aa.id AND aa.user_id = auth.uid()` — compara alias contra sí mismo. Debería ser `aa.activity_id = project_activities.id`.
- **Impacto:** ningún asignado puede cambiar el estado de su actividad (pendiente → en_progreso → completada) salvo staff/docente. Regresión silenciosa.
- **Archivo:** política en `project_activities`.

### C3. `project_members_teacher_self_join` no restringe a qué proyecto
- **SQL:** `WITH CHECK (auth.uid()=user_id AND role_in_project='docente' AND is_teacher(auth.uid()))` — sin filtrar `project_id`.
- **Impacto:** cualquier `docente_asociado` puede auto-inscribirse como docente en cualquier proyecto (incluidos los del admin), obteniendo poderes de `is_project_teacher` sobre él (crear/editar actividades, ver todos los avances, editar el proyecto).
- **Archivo:** política en `project_members`.

### C4. `team_projects_select` es `USING (true)` para `anon,authenticated`
- **Impacto:** el mapa equipo↔proyecto se filtra públicamente sin autenticar. Menor sensibilidad pero es una fuga innecesaria.
- **Archivo:** política en `team_projects`.

## 🟠 ALTOS (consistencia y jerarquía)

### A1. Docente puede editar/borrar avances de sus estudiantes
- `weekly_updates_teacher_update`: `USING/WITH CHECK is_project_teacher(...)` — permite reescribir el contenido del avance del estudiante, no sólo evaluar. La intención era revisar/evaluar, no mutar.
- **Sugerencia (no aplicada):** dejar update sólo al dueño o admin; docente restringido a `evaluations`.

### A2. `activity_id` en `weekly_updates` sin coherencia con `project_id`
- No hay CHECK/trigger que garantice `activity.project_id = weekly_update.project_id`. Si se cambia el proyecto de una actividad, quedan avances huérfanos apuntando a proyectos que ya no coinciden. Afecta indicadores y filtros por proyecto.

### A3. Doble fuente para "línea" en `projects`
- Coexisten `research_line_id` (FK) y `line` (texto libre). Admin usa selector→`line` como texto; docente en `dashboard.teacher.tsx` (NewProjectDialog, línea 261) usa Input libre. `research_line_id` nunca se llena desde la UI.
- **Impacto:** filtros por línea inconsistentes, tarjetas públicas muestran texto libre desalineado del catálogo oficial.

### A4. `is_teacher()` sólo reconoce `docente_asociado`
- Un admin/coordinador que NO tenga además el rol `docente_asociado` falla `is_teacher()` — puede afectar `projects_teacher_insert` y flujos "también soy docente". Ver `dashboard.teacher.tsx` línea 73 que trata admin como teacher en UI, pero DB no lo confirma.

## 🟡 MEDIOS

### M1. `weekly_updates` no valida que el usuario sea assignee de la actividad
- Aparte de C1, incluso si el proyecto es propio, un miembro puede reportar sobre actividades a las que no fue asignado. La UI lo filtra en cascada, pero la DB permite cualquier `activity_id` del proyecto.

### M2. `project_activities_teacher_manage` permite borrar actividades con avances asociados
- Sin `ON DELETE` explícito documentado. Si `activity_id` en `weekly_updates` es FK con `SET NULL` o `CASCADE`, se pierde trazabilidad. Verificar el DDL.

### M3. UI del docente crea proyecto y se auto-inserta cliente-side
- `dashboard.teacher.tsx` inserta el proyecto y en un segundo `INSERT` se auto-asigna en `project_members`. Si el segundo falla, el proyecto queda huérfano sin docente y sin RLS que se lo devuelva (queda invisible incluso para su creador hasta intervención de staff). Debería ser transacción/RPC.

### M4. `dashboard.student.tsx` y `weekly-updates.tsx` cargan proyectos por dos caminos distintos
- Uno hace `project_members` + `team_members`+`team_projects`; el otro sólo `project_members`. Aunque el trigger `sync_team_project_members` propaga, si el trigger fallara alguna vez, un espacio muestra proyectos y el otro no.

## 🔵 BAJOS / observaciones

- **O1.** `user_roles_admin_all` sólo cubre `admin`, no `coordinador`, pese a que `is_staff` los equipara en muchas rutas. Coordinador no puede otorgar/quitar roles vía DB directa (probablemente intencional; documentarlo).
- **O2.** `projects_select_published` incluye `anon`; correcto, pero combinado con `team_projects_select=true` permite a `anon` unir públicos con equipos.
- **O3.** Falta política `SELECT` explícita para `weekly_updates` del docente sobre avances cuyo `project_id IS NULL` (avances sin proyecto quedan ocultos incluso para staff sólo via `is_staff` — ok, pero UI de "avances atrasados" podría no contarlos).
- **O4.** `dashboard.teacher.tsx` línea 22-30: `STATUS_OPTIONS` no incluye `publicado`/`archivado`, pero el tipo sí — inconsistencia menor de UI.
- **O5.** No hay índice visible sobre `weekly_updates(project_id, week_start)` ni `activity_assignees(user_id)` — no bloqueante hoy, sí a escala.

## Resumen ejecutivo

| # | Área | Criticidad | Riesgo principal |
|---|------|-----------|------------------|
| C1 | RLS weekly_updates INSERT | 🔴 | Cualquier estudiante inyecta avances en proyectos ajenos |
| C2 | RLS project_activities UPDATE assignee | 🔴 | Asignados no pueden marcar progreso (bug lógico) |
| C3 | RLS project_members self-join docente | 🔴 | Escalada a docente sobre proyectos ajenos |
| C4 | RLS team_projects SELECT anon | 🔴 | Fuga a público |
| A1 | Docente UPDATE weekly_updates | 🟠 | Mutación de contenido ajeno |
| A2 | Coherencia activity↔project | 🟠 | Inconsistencia de indicadores |
| A3 | line vs research_line_id | 🟠 | Datos duplicados/desalineados |
| A4 | is_teacher no cubre admin | 🟠 | Fricción de permisos |

Si apruebas este informe, en el siguiente turno puedo proponer un plan de remediación priorizado (parches RLS + ajustes UI) sin ejecutarlo hasta tu segunda aprobación.
