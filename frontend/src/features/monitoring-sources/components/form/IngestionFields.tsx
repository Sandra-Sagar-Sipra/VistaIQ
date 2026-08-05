import type { Control } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import type { MonitoringSourceFormValues, FormMode } from "@/features/monitoring-sources/schema";
import type { IngestionMode } from "@/types/monitoring-source";

interface IngestionFieldsProps {
  control: Control<MonitoringSourceFormValues>;
  ingestionMode: IngestionMode;
  mode: FormMode;
}

export function IngestionFields({ control, ingestionMode, mode }: IngestionFieldsProps) {
  if (ingestionMode === "poll") {
    return (
      <FormField
        control={control}
        name="poll_interval_seconds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Poll interval (seconds)</FormLabel>
            <FormControl>
              <Input type="number" min={1} step={1} placeholder="60" {...field} />
            </FormControl>
            <FormDescription>How often VistaIQ polls this source for new events.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <FormField
      control={control}
      name="webhook_secret"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Webhook secret</FormLabel>
          <FormControl>
            <Input
              type="password"
              autoComplete="off"
              placeholder={mode === "edit" ? "Leave blank to keep current value" : "Shared secret"}
              {...field}
            />
          </FormControl>
          <FormDescription>Used to verify inbound webhook signatures. Write-only.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
