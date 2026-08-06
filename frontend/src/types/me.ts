/** Mirrors app/schemas/me/MeResponse on the backend. */
export interface Me {
  id: string;
  email: string;
  display_name: string | null;
  entra_object_id: string;
  entra_tenant_id: string;
  role: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}
