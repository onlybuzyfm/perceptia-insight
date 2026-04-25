import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { AdminOverview } from "./dashboard.admin.index";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  component: () => (
    <AdminShell>
      <AdminOverview />
    </AdminShell>
  ),
});
