import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/services/auth.service';
import { Tenant } from '../../shared/models/auth.models';
import { ServiceCallsTableComponent } from '../service-calls-table/service-calls-table.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatCardModule,
    ServiceCallsTableComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  public authService = inject(AuthService);
  public userTenants = signal<Tenant[]>([]);

  ngOnInit() {
    this.loadUserTenants();
  }

  private loadUserTenants() {
    this.authService.getUserTenants().subscribe({
      next: (response) => {
        this.userTenants.set(response.tenants);
      },
      error: (error) => {
        console.error('Failed to load user tenants:', error);
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  switchTenant(tenant: Tenant) {
    this.authService.switchTenant(tenant);
  }
}
