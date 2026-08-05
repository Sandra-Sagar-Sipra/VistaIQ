import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { CredentialFields } from "@/features/monitoring-sources/components/form/CredentialFields";
import { IngestionFields } from "@/features/monitoring-sources/components/form/IngestionFields";
import {
  AUTH_METHOD_OPTIONS,
  INGESTION_MODE_OPTIONS,
  SOURCE_TYPE_OPTIONS,
  VENDOR_SUGGESTIONS,
} from "@/features/monitoring-sources/constants";
import { buildSourcePayload, getDefaultFormValues } from "@/features/monitoring-sources/form-utils";
import {
  useCreateMonitoringSource,
  useUpdateMonitoringSource,
} from "@/features/monitoring-sources/hooks/use-monitoring-sources";
import { createMonitoringSourceFormSchema } from "@/features/monitoring-sources/schema";
import type { FormMode, MonitoringSourceFormValues } from "@/features/monitoring-sources/schema";
import type { MonitoringSource, MonitoringSourceCreatePayload } from "@/types/monitoring-source";

interface SourceFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: MonitoringSource | null;
}

export function SourceFormDrawer({ open, onOpenChange, source }: SourceFormDrawerProps) {
  const mode: FormMode = source ? "edit" : "create";

  const createMutation = useCreateMonitoringSource();
  const updateMutation = useUpdateMonitoringSource();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<MonitoringSourceFormValues>({
    resolver: zodResolver(createMonitoringSourceFormSchema(mode)),
    defaultValues: getDefaultFormValues(source),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultFormValues(source));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, source]);

  const authMethod = form.watch("auth_method");
  const ingestionMode = form.watch("ingestion_mode");

  function onSubmit(values: MonitoringSourceFormValues) {
    const payload = buildSourcePayload(values, mode);

    if (mode === "create") {
      createMutation.mutate(payload as MonitoringSourceCreatePayload, {
        onSuccess: () => onOpenChange(false),
      });
    } else if (source) {
      updateMutation.mutate({ id: source.id, payload }, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Add monitoring source" : `Edit ${source?.name}`}</SheetTitle>
          <SheetDescription>
            Configure how VistaIQ connects to and ingests events from this source.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            id="source-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 space-y-6 overflow-y-auto pr-1 py-4"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Production Veracode scans" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="source_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SOURCE_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vendor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor</FormLabel>
                      <FormControl>
                        <Input list="vendor-suggestions" placeholder="veracode" {...field} />
                      </FormControl>
                      <datalist id="vendor-suggestions">
                        {VENDOR_SUGGESTIONS.map((vendor) => (
                          <option key={vendor} value={vendor} />
                        ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="base_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://api.vendor.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="auth_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authentication method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AUTH_METHOD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CredentialFields control={form.control} authMethod={authMethod} mode={mode} />
            </div>

            <Separator />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="ingestion_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ingestion mode</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INGESTION_MODE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <IngestionFields control={form.control} ingestionMode={ingestionMode} mode={mode} />
            </div>

            <Separator />

            <FormField
              control={form.control}
              name="is_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Enabled</FormLabel>
                    <FormDescription>Disabled sources are not polled or synced.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="source-form" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : mode === "create" ? "Create source" : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
