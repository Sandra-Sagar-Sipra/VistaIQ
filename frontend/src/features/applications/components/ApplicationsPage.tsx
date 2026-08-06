import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  Search,
  RefreshCw,
  LayoutTemplate,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { useApplicationsQuery } from "@/features/applications/hooks/use-applications";
import { ApplicationFormModal } from "@/features/applications/components/ApplicationFormModal";
import { DeleteApplicationDialog } from "@/features/applications/components/DeleteApplicationDialog";
import type { Application } from "@/types/applications";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function ApplicationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);

  const { data, isLoading, isError, refetch } = useApplicationsQuery({
    limit: 50,
    offset: 0,
    search: debouncedSearch,
  });

  function openCreate() {
    setSelectedApp(null);
    setModalOpen(true);
  }

  const columns = [
    {
      accessorKey: "name",
      header: "Application Name",
      meta: { className: "w-[250px]" },
      cell: ({ row }: any) => {
        const app = row.original;
        return (
          <Link
            to={`/applications/${app.id}`}
            className="font-medium text-primary hover:underline"
          >
            {app.name}
          </Link>
        );
      },
    },
    {
      accessorKey: "owner",
      header: "Owner",
      meta: { className: "w-[150px]" },
      cell: ({ row }: any) =>
        row.original.owner ?? (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "environment_id",
      header: "Environment",
      meta: { className: "w-[150px]" },
      cell: ({ row }: any) =>
        row.original.environment_id ?? (
          <span className="text-muted-foreground italic">Not Assigned</span>
        ),
    },
    {
      accessorKey: "criticality",
      header: "Criticality",
      meta: { className: "w-[120px]" },
      cell: ({ row }: any) => {
        const value = row.original.criticality;
        if (!value) return <span className="text-muted-foreground">—</span>;
        const colorMap: Record<string, string> = {
          critical: "bg-red-100 text-red-700 border-red-200",
          high: "bg-orange-100 text-orange-700 border-orange-200",
          medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
          low: "bg-green-100 text-green-700 border-green-200",
        };
        return (
          <Badge
            variant="outline"
            className={`capitalize font-medium ${colorMap[value]}`}
          >
            {value}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      meta: { className: "w-[120px]" },
      cell: ({ row }: any) => {
        const status = row.original.status;
        return (
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 shrink-0 rounded-full ${
                status === "active" ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <span className="capitalize text-sm">{status}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "updated_at",
      header: "Last Updated",
      meta: { className: "w-[160px]" },
      cell: ({ row }: any) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.updated_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      meta: { className: "w-[60px] text-right" },
      cell: ({ row }: any) => {
        const app = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigate(`/applications/${app.id}`)}
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedApp(app);
                  setModalOpen(true);
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setAppToDelete(app)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Page header ── title+description on the left, actions on the right */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Applications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your root applications and their configurations.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Application
          </Button>
        </div>
      </div>

      {/* ── Toolbar ── search bar constrained, aligned to table edge */}
      <div className="flex items-center">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* ── Data table ── */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-b"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`h-10 text-xs font-medium uppercase tracking-wide text-muted-foreground ${
                      (header.column.columnDef.meta as any)?.className ?? ""
                    }`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-1 text-destructive">
                    <p className="text-sm font-medium">
                      Failed to load applications.
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-destructive"
                      onClick={() => refetch()}
                    >
                      Try again
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-56 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <LayoutTemplate className="h-10 w-10 opacity-25" />
                    <p className="text-sm font-medium">No applications found.</p>
                    {search ? (
                      <p className="text-xs">
                        No results for &ldquo;{search}&rdquo;. Try a different
                        search.
                      </p>
                    ) : (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={openCreate}
                        className="h-auto p-0 text-sm"
                      >
                        Create your first application
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={(cell.column.columnDef.meta as any)?.className ?? ""}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ApplicationFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        application={selectedApp}
      />
      <DeleteApplicationDialog
        application={appToDelete}
        onOpenChange={(open) => !open && setAppToDelete(null)}
      />
    </div>
  );
}
