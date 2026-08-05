import type {
  IngestionMode,
  MonitoringSourceListParams,
  SourceType,
} from "@/types/monitoring-source";

export interface SourcesFiltersState {
  search: string;
  vendor: string;
  sourceType: SourceType | "all";
  ingestionMode: IngestionMode | "all";
  enabled: "all" | "enabled" | "disabled";
}

export const DEFAULT_FILTERS: SourcesFiltersState = {
  search: "",
  vendor: "all",
  sourceType: "all",
  ingestionMode: "all",
  enabled: "all",
};

export function hasActiveFilters(filters: SourcesFiltersState): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.vendor !== "all" ||
    filters.sourceType !== "all" ||
    filters.ingestionMode !== "all" ||
    filters.enabled !== "all"
  );
}

export function toListParams(
  filters: SourcesFiltersState,
  pagination: { pageIndex: number; pageSize: number }
): MonitoringSourceListParams {
  return {
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
    search: filters.search.trim() || undefined,
    vendor: filters.vendor === "all" ? undefined : filters.vendor,
    source_type: filters.sourceType === "all" ? undefined : filters.sourceType,
    ingestion_mode: filters.ingestionMode === "all" ? undefined : filters.ingestionMode,
    is_enabled: filters.enabled === "all" ? undefined : filters.enabled === "enabled",
  };
}
