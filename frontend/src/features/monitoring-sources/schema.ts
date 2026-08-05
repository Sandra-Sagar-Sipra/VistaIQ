import { z } from "zod";

import { AUTH_METHODS, INGESTION_MODES, SOURCE_TYPES } from "@/types/monitoring-source";
import type { AuthMethod } from "@/types/monitoring-source";

export const CREDENTIAL_FIELDS_BY_AUTH_METHOD = {
  api_key: ["api_key"],
  basic: ["username", "password"],
  bearer_token: ["token"],
  oauth2: ["client_id", "client_secret", "token_url"],
} as const satisfies Record<AuthMethod, readonly string[]>;

export const CREDENTIAL_FIELD_META: Record<string, { label: string; type: "text" | "password" }> = {
  api_key: { label: "API Key", type: "password" },
  username: { label: "Username", type: "text" },
  password: { label: "Password", type: "password" },
  token: { label: "Bearer Token", type: "password" },
  client_id: { label: "Client ID", type: "text" },
  client_secret: { label: "Client Secret", type: "password" },
  token_url: { label: "Token URL", type: "text" },
};

const baseObjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255, "Must be 255 characters or fewer"),
  source_type: z.enum(SOURCE_TYPES, { required_error: "Select a source type" }),
  vendor: z.string().trim().min(1, "Vendor is required").max(100, "Must be 100 characters or fewer"),
  base_url: z.string().trim().url("Enter a valid URL, e.g. https://api.vendor.com"),
  auth_method: z.enum(AUTH_METHODS, { required_error: "Select an authentication method" }),
  ingestion_mode: z.enum(INGESTION_MODES, { required_error: "Select an ingestion mode" }),
  is_enabled: z.boolean(),
  poll_interval_seconds: z.string().optional().default(""),
  webhook_secret: z.string().optional().default(""),
  api_key: z.string().optional().default(""),
  username: z.string().optional().default(""),
  password: z.string().optional().default(""),
  token: z.string().optional().default(""),
  client_id: z.string().optional().default(""),
  client_secret: z.string().optional().default(""),
  token_url: z.string().optional().default(""),
});

export type MonitoringSourceFormValues = z.infer<typeof baseObjectSchema>;

export type FormMode = "create" | "edit";

export function createMonitoringSourceFormSchema(mode: FormMode) {
  return baseObjectSchema.superRefine((values, ctx) => {
    if (values.ingestion_mode === "poll") {
      const parsed = Number(values.poll_interval_seconds);
      if (!values.poll_interval_seconds?.trim() || !Number.isInteger(parsed) || parsed <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["poll_interval_seconds"],
          message: "Enter a whole number of seconds greater than 0",
        });
      }
    }

    if (values.ingestion_mode === "webhook" && mode === "create" && !values.webhook_secret.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["webhook_secret"],
        message: "Webhook secret is required",
      });
    }

    const credentialFields = CREDENTIAL_FIELDS_BY_AUTH_METHOD[values.auth_method];
    const filledCount = credentialFields.filter((field) =>
      values[field as keyof MonitoringSourceFormValues]?.toString().trim()
    ).length;

    const requireAll =
      mode === "create" || (filledCount > 0 && filledCount < credentialFields.length);

    if (requireAll) {
      credentialFields.forEach((field) => {
        if (!values[field as keyof MonitoringSourceFormValues]?.toString().trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message:
              mode === "create"
                ? `${CREDENTIAL_FIELD_META[field]?.label ?? field} is required`
                : "Fill in every credential field, or leave them all blank to keep the current value",
          });
        }
      });
    }
  });
}
