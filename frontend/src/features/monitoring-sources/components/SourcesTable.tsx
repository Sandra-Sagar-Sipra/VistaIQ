import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildColumns } from "@/features/monitoring-sources/components/columns";
import { SourcesEmptyState } from "@/features/monitoring-sources/components/SourcesEmptyState";
import { SourcesErrorState } from "@/features/monitoring-sources/components/SourcesErrorState";
import type { MonitoringSource } from "@/types/monitoring-source";

interface SourcesTableProps {
  data: MonitoringSource[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEdit: (source: MonitoringSource) => void;
  onDelete: (source: MonitoringSource) => void;
  hasActiveFilters: boolean;
  onAddSource: () => void;
}

export function SourcesTable({
  data,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onDelete,
  hasActiveFilters,
  onAddSource,
}: SourcesTableProps) {
  const columns = buildColumns({ onEdit, onDelete });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className={header.column.columnDef.meta?.className}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isError ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="p-0">
                <SourcesErrorState onRetry={onRetry} />
              </TableCell>
            </TableRow>
          ) : isLoading ? (
            Array.from({ length: 6 }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((_, columnIndex) => (
                  <TableCell key={columnIndex}>
                    <Skeleton className="h-4 w-full max-w-32" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="p-0">
                <SourcesEmptyState hasActiveFilters={hasActiveFilters} onAddSource={onAddSource} />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
