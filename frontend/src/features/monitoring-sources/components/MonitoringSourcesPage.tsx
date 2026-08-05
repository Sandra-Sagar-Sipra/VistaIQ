import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { DeleteSourceDialog } from "@/features/monitoring-sources/components/DeleteSourceDialog";
import { SourceFormDrawer } from "@/features/monitoring-sources/components/SourceFormDrawer";
import { SourcesFilters } from "@/features/monitoring-sources/components/SourcesFilters";
import { SourcesHeader } from "@/features/monitoring-sources/components/SourcesHeader";
import { SourcesPagination } from "@/features/monitoring-sources/components/SourcesPagination";
import { SourcesTable } from "@/features/monitoring-sources/components/SourcesTable";
import { DEFAULT_FILTERS, hasActiveFilters, toListParams } from "@/features/monitoring-sources/filters";
import type { SourcesFiltersState } from "@/features/monitoring-sources/filters";
import { useMonitoringSourcesQuery } from "@/features/monitoring-sources/hooks/use-monitoring-sources";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { MonitoringSource } from "@/types/monitoring-source";

const PAGE_SIZE = 10;

export function MonitoringSourcesPage() {
  const [filters, setFilters] = useState<SourcesFiltersState>(DEFAULT_FILTERS);
  const [pageIndex, setPageIndex] = useState(0);
  const [drawerState, setDrawerState] = useState<{ open: boolean; source: MonitoringSource | null }>({
    open: false,
    source: null,
  });
  const [sourceToDelete, setSourceToDelete] = useState<MonitoringSource | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setDrawerState({ open: true, source: null });
      const next = new URLSearchParams(searchParams);
      next.delete("action");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const listParams = useMemo(
    () => toListParams({ ...filters, search: debouncedSearch }, { pageIndex, pageSize: PAGE_SIZE }),
    [filters, debouncedSearch, pageIndex]
  );

  const query = useMonitoringSourcesQuery(listParams);

  function updateFilters(patch: Partial<SourcesFiltersState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPageIndex(0);
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setPageIndex(0);
  }

  function openCreateDrawer() {
    setDrawerState({ open: true, source: null });
  }

  function openEditDrawer(source: MonitoringSource) {
    setDrawerState({ open: true, source });
  }

  const total = query.data?.total ?? 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <SourcesHeader onAddSource={openCreateDrawer} />

      <div className="flex flex-col gap-4">
        <SourcesFilters filters={filters} onChange={updateFilters} onClear={clearFilters} />

        <SourcesTable
          data={query.data?.items ?? []}
          isLoading={query.isLoading}
          isError={query.isError}
          onRetry={() => query.refetch()}
          onEdit={openEditDrawer}
          onDelete={setSourceToDelete}
          hasActiveFilters={hasActiveFilters(filters)}
          onAddSource={openCreateDrawer}
        />

        {!query.isError && total > 0 && (
          <SourcesPagination
            pageIndex={pageIndex}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPageIndex}
          />
        )}
      </div>

      <SourceFormDrawer
        open={drawerState.open}
        onOpenChange={(open) => setDrawerState((prev) => ({ ...prev, open }))}
        source={drawerState.source}
      />

      <DeleteSourceDialog
        source={sourceToDelete}
        onOpenChange={(open) => !open && setSourceToDelete(null)}
      />
    </div>
  );
}
