import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INGESTION_MODE_OPTIONS,
  SOURCE_TYPE_OPTIONS,
  VENDOR_SUGGESTIONS,
} from "@/features/monitoring-sources/constants";
import { hasActiveFilters as computeHasActiveFilters } from "@/features/monitoring-sources/filters";
import type { SourcesFiltersState } from "@/features/monitoring-sources/filters";

interface SourcesFiltersProps {
  filters: SourcesFiltersState;
  onChange: (patch: Partial<SourcesFiltersState>) => void;
  onClear: () => void;
}

export function SourcesFilters({ filters, onChange, onClear }: SourcesFiltersProps) {
  const active = computeHasActiveFilters(filters);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="Search by name…"
          className="pl-8"
        />
      </div>

      <Select value={filters.vendor} onValueChange={(value) => onChange({ vendor: value })}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Vendor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All vendors</SelectItem>
          {VENDOR_SUGGESTIONS.map((vendor) => (
            <SelectItem key={vendor} value={vendor} className="capitalize">
              {vendor}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sourceType}
        onValueChange={(value) => onChange({ sourceType: value as SourcesFiltersState["sourceType"] })}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Source type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {SOURCE_TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.ingestionMode}
        onValueChange={(value) =>
          onChange({ ingestionMode: value as SourcesFiltersState["ingestionMode"] })
        }
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Ingestion mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All modes</SelectItem>
          {INGESTION_MODE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.enabled}
        onValueChange={(value) => onChange({ enabled: value as SourcesFiltersState["enabled"] })}
      >
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="enabled">Enabled</SelectItem>
          <SelectItem value="disabled">Disabled</SelectItem>
        </SelectContent>
      </Select>

      {active && (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
          <X className="h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
