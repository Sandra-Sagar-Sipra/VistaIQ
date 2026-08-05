import { Badge } from "@/components/ui/badge";
import { CONNECTION_STATUS_META } from "@/features/monitoring-sources/constants";

export function ConnectionStatusBadge({ status }: { status: string }) {
  const meta = CONNECTION_STATUS_META[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
