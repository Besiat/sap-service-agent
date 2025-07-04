export interface User {
  id: string;
  username: string;
}

export interface Tenant {
  id: string;
  name: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  tenantId: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
  selectedTenant?: Tenant;
}

export interface TenantsResponse {
  tenants: Tenant[];
}
