import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteMonitoringSource } from "@/features/monitoring-sources/hooks/use-monitoring-sources";
import type { MonitoringSource } from "@/types/monitoring-source";

interface DeleteSourceDialogProps {
  source: MonitoringSource | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSourceDialog({ source, onOpenChange }: DeleteSourceDialogProps) {
  const deleteMutation = useDeleteMonitoringSource();

  return (
    <Dialog open={!!source} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete monitoring source</DialogTitle>
          <DialogDescription>
            This permanently deletes <span className="font-medium text-foreground">{source?.name}</span>{" "}
            and stops all polling/webhook ingestion for it. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (!source) return;
              deleteMutation.mutate(source.id, { onSuccess: () => onOpenChange(false) });
            }}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
