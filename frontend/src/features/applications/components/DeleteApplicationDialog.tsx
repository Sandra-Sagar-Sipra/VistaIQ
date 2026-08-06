import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteApplicationMutation } from "@/features/applications/hooks/use-applications";
import type { Application } from "@/types/applications";

interface DeleteApplicationDialogProps {
  application: Application | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteApplicationDialog({
  application,
  onOpenChange,
}: DeleteApplicationDialogProps) {
  const deleteMutation = useDeleteApplicationMutation();

  if (!application) return null;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(application.id);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={!!application} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Application</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{application.name}</strong>? This action cannot
            be undone. If this application has child components, the deletion will be rejected by
            the system.
          </DialogDescription>
        </DialogHeader>
        {deleteMutation.isError && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            Failed to delete application. It may have child components or an unexpected error occurred.
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
