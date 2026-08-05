import { Switch } from "@/components/ui/switch";
import { useUpdateMonitoringSource } from "@/features/monitoring-sources/hooks/use-monitoring-sources";
import type { MonitoringSource } from "@/types/monitoring-source";

export function EnabledToggle({ source }: { source: MonitoringSource }) {
  const updateMutation = useUpdateMonitoringSource();

  return (
    <Switch
      checked={source.is_enabled}
      disabled={updateMutation.isPending}
      onCheckedChange={(checked) =>
        updateMutation.mutate({ id: source.id, payload: { is_enabled: checked } })
      }
      aria-label={`${source.is_enabled ? "Disable" : "Enable"} ${source.name}`}
    />
  );
}
