import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserMenu } from "@/features/auth/components/UserMenu";

export function SourcesHeader({ onAddSource }: { onAddSource: () => void }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Monitoring Sources</h1>
        <p className="text-sm text-muted-foreground">
          Connect and manage the monitoring, security, DevOps, and cloud tools VistaIQ ingests from.
        </p>
      </div>
      <div className="flex items-center gap-2 sm:shrink-0">
        <UserMenu />
        <Button onClick={onAddSource}>
          <Plus className="h-4 w-4" />
          Add source
        </Button>
      </div>
    </div>
  );
}
