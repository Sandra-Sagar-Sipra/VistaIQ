import type { Control } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CREDENTIAL_FIELDS_BY_AUTH_METHOD, CREDENTIAL_FIELD_META } from "@/features/monitoring-sources/schema";
import type { MonitoringSourceFormValues, FormMode } from "@/features/monitoring-sources/schema";
import type { AuthMethod } from "@/types/monitoring-source";

interface CredentialFieldsProps {
  control: Control<MonitoringSourceFormValues>;
  authMethod: AuthMethod;
  mode: FormMode;
}

export function CredentialFields({ control, authMethod, mode }: CredentialFieldsProps) {
  const fields = CREDENTIAL_FIELDS_BY_AUTH_METHOD[authMethod];

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div>
        <p className="text-sm font-medium">Credentials</p>
        <p className="text-xs text-muted-foreground">
          {mode === "edit"
            ? "Write-only. Leave blank to keep the currently stored credentials."
            : "Write-only. These values are encrypted and never displayed again."}
        </p>
      </div>

      {fields.map((fieldName) => {
        const meta = CREDENTIAL_FIELD_META[fieldName];
        return (
          <FormField
            key={fieldName}
            control={control}
            name={fieldName as keyof MonitoringSourceFormValues}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{meta.label}</FormLabel>
                <FormControl>
                  <Input
                    type={meta.type}
                    autoComplete="off"
                    placeholder={mode === "edit" ? "Leave blank to keep current value" : meta.label}
                    {...field}
                    value={field.value as string}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      })}
    </div>
  );
}
