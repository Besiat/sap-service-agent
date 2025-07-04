import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, User, Tenant, TenantsResponse } from '../../shared/models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'user';
  private readonly TENANT_KEY = 'selected_tenant';

  public isAuthenticated = signal<boolean>(this.hasValidToken());
  public currentUser = signal<User | null>(this.getStoredUser());
  public selectedTenant = signal<Tenant | null>(this.getStoredTenant());

  constructor() {
    this.clearCorruptedData();
    this.updateAuthState();
  }

  getAllTenants(): Observable<TenantsResponse> {
    return this.http.get<TenantsResponse>(`${this.baseUrl}/tenants`);
  }

  getUserTenants(): Observable<TenantsResponse> {
    return this.http.get<TenantsResponse>(`${this.baseUrl}/me/tenants`);
  }

  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, loginRequest).pipe(
      tap(response => {
        this.setAuthData(response);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TENANT_KEY);
    
    this.updateAuthState();
    
    if (!this.router.url.includes('/login')) {
      this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  checkAuthenticationState(): boolean {
    const isValid = this.hasValidToken();
    
    if (!isValid && this.getToken()) {
      console.warn('Token found but invalid, clearing auth data');
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TENANT_KEY);
      this.updateAuthState();
    }
    
    return isValid;
  }

  switchTenant(tenant: Tenant): void {
    this.http.post<AuthResponse>(`${this.baseUrl}/switch-tenant`, { tenantId: tenant.id }).subscribe({
      next: (response) => {
        this.setAuthData(response);
        window.location.reload();
      },
      error: (error) => {
        console.error('Failed to switch tenant:', error);
        this.setOrRemoveItem(this.TENANT_KEY, tenant);
        this.selectedTenant.set(tenant);
        window.location.reload();
      }
    });
  }

  
  private clearCorruptedData(): void {
    const keys = [this.TOKEN_KEY, this.USER_KEY, this.TENANT_KEY];
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value === 'undefined' || value === 'null') {
        localStorage.removeItem(key);
      }
    });
  }

  private getStoredItem<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item || item === 'undefined' || item === 'null') {
      return null;
    }
    try {
      return JSON.parse(item);
    } catch {
      return null;
    }
  }


  private updateAuthState(): void {
    const isValid = this.hasValidToken();
    const user = this.getStoredUser();
    const tenant = this.getStoredTenant();
    
    this.isAuthenticated.set(isValid);
    this.currentUser.set(user);
    this.selectedTenant.set(tenant);
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  private getStoredUser(): User | null {
    return this.getStoredItem<User>(this.USER_KEY);
  }

  private getStoredTenant(): Tenant | null {
    return this.getStoredItem<Tenant>(this.TENANT_KEY);
  }

  private setAuthData(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.access_token);
    
    this.setOrRemoveItem(this.USER_KEY, response.user);
    this.setOrRemoveItem(this.TENANT_KEY, response.selectedTenant);
    
    this.updateAuthState();
  }

  private setOrRemoveItem(key: string, value: any): void {
    if (value) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.removeItem(key);
    }
  }
}
