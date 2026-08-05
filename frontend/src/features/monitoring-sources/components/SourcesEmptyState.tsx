import { Inbox, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SourcesEmptyStateProps {
  hasActiveFilters: boolean;
  onAddSource: () => void;
}

export function SourcesEmptyState({ hasActiveFilters, onAddSource }: SourcesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="rounded-full bg-muted p-3">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {hasActiveFilters ? "No monitoring sources match your filters" : "No monitoring sources yet"}
        </p>
        <p className="text-sm text-muted-foreground">
          {hasActiveFilters
            ? "Try adjusting or clearing your search and filters."
            : "Connect a vendor to start ingesting alerts and events."}
        </p>
      </div>
      {!hasActiveFilters && (
        <Button size="sm" onClick={onAddSource} className="mt-2">
          <Plus className="h-4 w-4" />
          Add monitoring source
        </Button>
      )}
    </div>
  );
}
