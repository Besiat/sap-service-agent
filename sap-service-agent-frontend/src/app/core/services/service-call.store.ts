import { Injectable, inject, signal, computed } from '@angular/core';
import { ServiceCallApiService } from './service-call-api.service';
import { FavoritesApiService } from './favorites-api.service';
import { ServiceCallListItem, PaginatedResponse } from '../../shared/models/service-call.models';
import { catchError, of, forkJoin, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServiceCallStore {
  private readonly serviceCallApi = inject(ServiceCallApiService);
  private readonly favoritesApi = inject(FavoritesApiService);

  readonly serviceCalls = signal<ServiceCallListItem[]>([]);
  readonly favoriteIds = signal<Set<string>>(new Set());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);
  readonly totalItems = signal(0);
  readonly showFavoritesOnly = signal(false);
  readonly sortColumn = signal<string>('');
  readonly sortDirection = signal<'asc' | 'desc' | ''>('');

  loadServiceCalls(page?: number, pageSize?: number) {
    if (page !== undefined) this.currentPage.set(page);
    if (pageSize !== undefined) this.pageSize.set(pageSize);

    this.loading.set(true);
    this.error.set(null);

    const apiPage = this.currentPage() + 1;
    const sortBy = this.sortColumn();
    const sortOrder = this.sortDirection() === '' ? undefined : this.sortDirection() as 'asc' | 'desc';

    return forkJoin({
      serviceCalls: this.serviceCallApi.getAllServiceCalls(
        apiPage, 
        this.pageSize(), 
        this.showFavoritesOnly(),
        sortBy || undefined,
        sortOrder
      ),
      favorites: this.favoritesApi.getUserFavorites()
    }).pipe(
      catchError(error => {
        this.error.set('Failed to load service calls');
        return of({ 
          serviceCalls: { data: [], total: 0, page: 1, limit: this.pageSize(), totalPages: 0 } as PaginatedResponse<ServiceCallListItem>,
          favorites: { favoriteServiceCallIds: [] }
        });
      })
    ).subscribe({
      next: ({ serviceCalls, favorites }) => {
        const favoriteIdsSet = new Set(favorites.favoriteServiceCallIds);
        const processedServiceCalls = serviceCalls.data.map(sc => ({
          ...sc,
          scheduledAt: new Date(sc.scheduledAt),
          executedAt: sc.executedAt ? new Date(sc.executedAt) : null,
          createdAt: new Date(sc.createdAt),
          isFavorite: favoriteIdsSet.has(sc.id)
        }));

        this.serviceCalls.set(processedServiceCalls);
        this.favoriteIds.set(favoriteIdsSet);
        this.totalItems.set(serviceCalls.total);
      },
      complete: () => this.loading.set(false)
    });
  }

  setSorting(column: string, direction: 'asc' | 'desc' | '') {
    this.sortColumn.set(column);
    this.sortDirection.set(direction);
    this.currentPage.set(0);
    this.loadServiceCalls();
  }

  toggleFavoritesFilter() {
    this.showFavoritesOnly.set(!this.showFavoritesOnly());
    this.currentPage.set(0);
    this.loadServiceCalls();
  }

  toggleFavorite(serviceCallId: string) {
    const isFavorite = this.favoriteIds().has(serviceCallId);
    
    const updatedFavorites = new Set(this.favoriteIds());
    if (isFavorite) {
      updatedFavorites.delete(serviceCallId);
    } else {
      updatedFavorites.add(serviceCallId);
    }
    this.favoriteIds.set(updatedFavorites);

    const updatedServiceCalls = this.serviceCalls().map(sc => 
      sc.id === serviceCallId ? { ...sc, isFavorite: !isFavorite } : sc
    );
    this.serviceCalls.set(updatedServiceCalls);

    const apiCall = isFavorite 
      ? this.favoritesApi.removeFromFavorites(serviceCallId)
      : this.favoritesApi.addToFavorites(serviceCallId);

    return apiCall.pipe(
      catchError(error => {
        this.favoriteIds.set(new Set(isFavorite ? [serviceCallId, ...updatedFavorites] : [...updatedFavorites].filter(id => id !== serviceCallId)));
        const revertedServiceCalls = this.serviceCalls().map(sc => 
          sc.id === serviceCallId ? { ...sc, isFavorite } : sc
        );
        this.serviceCalls.set(revertedServiceCalls);
        throw error;
      }),
      tap(() => {
        if (this.showFavoritesOnly()) {
          this.loadServiceCalls();
        }
      })
    );
  }
}
