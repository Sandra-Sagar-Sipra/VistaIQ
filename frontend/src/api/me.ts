import { apiClient } from "@/lib/api-client";
import type { Me } from "@/types/me";

export function fetchMe() {
  return apiClient.get<Me>("/me");
}
