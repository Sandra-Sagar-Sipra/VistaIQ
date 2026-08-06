import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateApplicationMutation,
  useUpdateApplicationMutation,
} from "@/features/applications/hooks/use-applications";
import type { Application, Priority } from "@/types/applications";

interface ApplicationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
}

interface FormValues {
  name: string;
  owner: string;
  environment_id: string;
  criticality: Priority | "";
  status: string;
}

export function ApplicationFormModal({
  open,
  onOpenChange,
  application,
}: ApplicationFormModalProps) {
  const isEditing = !!application;
  
  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      owner: "",
      environment_id: "",
      criticality: "",
      status: "active",
    },
  });

  const createMutation = useCreateApplicationMutation();
  const updateMutation = useUpdateApplicationMutation();

  useEffect(() => {
    if (open) {
      if (application) {
        form.reset({
          name: application.name,
          owner: application.owner ?? "",
          environment_id: application.environment_id ?? "",
          criticality: application.criticality ?? "",
          status: application.status,
        });
      } else {
        form.reset({
          name: "",
          owner: "",
          environment_id: "",
          criticality: "",
          status: "active",
        });
      }
    }
  }, [open, application, form]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      owner: values.owner || undefined,
      environment_id: values.environment_id || undefined,
      criticality: (values.criticality as Priority) || undefined,
      status: values.status,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: application.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (error) {
      // Form error handling would go here. In a real app we'd map API errors to fields.
      console.error(error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Application" : "Create Application"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Make changes to your application here."
              : "Add a new application to the inventory."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Core Banking System" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Platform Team" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="criticality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Criticality</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select criticality" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              rules={{ required: "Status is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
