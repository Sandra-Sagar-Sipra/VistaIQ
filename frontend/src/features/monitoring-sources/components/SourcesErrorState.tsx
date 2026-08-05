import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SourcesErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Couldn&apos;t load monitoring sources</p>
        <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
      </div>
      <Button size="sm" variant="outline" onClick={onRetry} className="mt-2">
        Try again
      </Button>
    </div>
  );
}
