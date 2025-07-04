import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ServiceCallStore } from '../../core/services/service-call.store';
import { ServiceCallListItem, ServiceCallStatus } from '../../shared/models/service-call.models';
import { CustomDatePipe } from '../../shared/pipes/custom-date.pipe';

@Component({
  selector: 'app-service-calls-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatSortModule,
    MatCheckboxModule,
    CustomDatePipe,
  ],
  templateUrl: './service-calls-table.component.html',
  styleUrl: './service-calls-table.component.scss'
})
export class ServiceCallsTableComponent implements OnInit, OnDestroy {
  private readonly store = inject(ServiceCallStore);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  private readonly destroy$ = new Subject<void>();

  autoRefreshEnabled = false;
  private refreshInterval: number | null = null;

  readonly serviceCalls = this.store.serviceCalls;
  readonly loading = this.store.loading;
  readonly totalItems = this.store.totalItems;
  readonly currentPage = this.store.currentPage;
  readonly pageSize = this.store.pageSize;
  readonly error = this.store.error;
  readonly showFavoritesOnly = this.store.showFavoritesOnly;
  readonly sortColumn = this.store.sortColumn;
  readonly sortDirection = this.store.sortDirection;

  displayedColumns: string[] = ['favorite', 'id', 'name', 'url', 'scheduledAt', 'createdAt', 'status', 'actions'];

  ngOnInit() {
    this.store.setSorting('createdAt', 'desc');
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSortChange(sort: Sort) {
    this.store.setSorting(sort.active, sort.direction);
  }

  onPageChange(event: PageEvent) {
    this.store.loadServiceCalls(event.pageIndex, event.pageSize);
  }

  viewDetails(serviceCall: ServiceCallListItem) {
    this.router.navigate(['/service-calls', serviceCall.id, 'edit']);
  }

  createNew() {
    this.router.navigate(['/service-calls/new']);
  }

  toggleFavoritesFilter() {
    this.store.toggleFavoritesFilter();
  }

  getStatusClass(status: ServiceCallStatus): string {
    switch (status) {
      case ServiceCallStatus.COMPLETED:
        return 'success';
      case ServiceCallStatus.RUNNING:
        return 'pending';
      case ServiceCallStatus.FAILED:
        return 'error';
      case ServiceCallStatus.SCHEDULED:
      default:
        return 'scheduled';
    }
  }

  truncateId(id: string): string {
    return id.length > 8 ? `${id.substring(0, 8)}...` : id;
  }

  toggleFavorite(serviceCall: ServiceCallListItem) {
    this.store.toggleFavorite(serviceCall.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const message = serviceCall.isFavorite ? 'Removed from favorites' : 'Added to favorites';
          this.snackBar.open(message, 'Close', { duration: 2000 });
        },
        error: (error) => {
          console.error('Failed to toggle favorite:', error);
          this.snackBar.open('Failed to update favorites', 'Close', { duration: 3000 });
        }
      });
  }

  toggleAutoRefresh() {
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  private startAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = window.setInterval(() => {
      this.store.loadServiceCalls(this.currentPage(), this.pageSize());
    }, 5000);
  }

  private stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}
