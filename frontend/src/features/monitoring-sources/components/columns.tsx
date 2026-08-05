import { createColumnHelper } from "@tanstack/react-table";

import { ConnectionStatusBadge } from "@/features/monitoring-sources/components/ConnectionStatusBadge";
import { EnabledToggle } from "@/features/monitoring-sources/components/EnabledToggle";
import { RowActionsMenu } from "@/features/monitoring-sources/components/RowActionsMenu";
import { SOURCE_TYPE_OPTIONS } from "@/features/monitoring-sources/constants";
import type { MonitoringSource } from "@/types/monitoring-source";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    className?: string;
  }
}

const sourceTypeLabels = Object.fromEntries(SOURCE_TYPE_OPTIONS.map((option) => [option.value, option.label]));

function formatLastSync(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

interface ColumnActions {
  onEdit: (source: MonitoringSource) => void;
  onDelete: (source: MonitoringSource) => void;
}

const columnHelper = createColumnHelper<MonitoringSource>();

export function buildColumns({ onEdit, onDelete }: ColumnActions) {
  return [
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => <span className="font-medium text-foreground">{info.getValue()}</span>,
    }),
    columnHelper.accessor("vendor", {
      header: "Vendor",
      cell: (info) => <span className="capitalize">{info.getValue()}</span>,
    }),
    columnHelper.accessor("source_type", {
      header: "Source type",
      cell: (info) => sourceTypeLabels[info.getValue()] ?? info.getValue(),
      meta: { className: "hidden sm:table-cell" },
    }),
    columnHelper.accessor("connection_status", {
      header: "Status",
      cell: (info) => <ConnectionStatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor("last_sync_at", {
      header: "Last sync",
      cell: (info) => <span className="text-muted-foreground">{formatLastSync(info.getValue())}</span>,
      meta: { className: "hidden md:table-cell" },
    }),
    columnHelper.display({
      id: "enabled",
      header: "Enabled",
      cell: ({ row }) => <EnabledToggle source={row.original} />,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => <RowActionsMenu source={row.original} onEdit={onEdit} onDelete={onDelete} />,
      meta: { className: "text-right" },
    }),
  ];
}
