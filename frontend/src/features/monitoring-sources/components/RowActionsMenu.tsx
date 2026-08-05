import { MoreHorizontal, Pencil, PlugZap, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useSyncMonitoringSource,
  useTestMonitoringSourceConnection,
} from "@/features/monitoring-sources/hooks/use-monitoring-sources";
import type { MonitoringSource } from "@/types/monitoring-source";

interface RowActionsMenuProps {
  source: MonitoringSource;
  onEdit: (source: MonitoringSource) => void;
  onDelete: (source: MonitoringSource) => void;
}

export function RowActionsMenu({ source, onEdit, onDelete }: RowActionsMenuProps) {
  const testConnection = useTestMonitoringSourceConnection();
  const sync = useSyncMonitoringSource();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${source.name}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(source)}>
          <Pencil className="h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => testConnection.mutate(source.id)}
          disabled={testConnection.isPending}
        >
          <PlugZap className="h-4 w-4" />
          Test connection
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => sync.mutate(source.id)} disabled={sync.isPending}>
          <RefreshCw className="h-4 w-4" />
          Sync now
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(source)}>
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
