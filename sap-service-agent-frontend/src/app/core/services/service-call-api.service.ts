import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ServiceCall, CreateServiceCallRequest, UpdateServiceCallRequest, PaginatedResponse } from '../../shared/models/service-call.models';

@Injectable({
  providedIn: 'root'
})
export class ServiceCallApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/service-call`;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }
  
  getAllServiceCalls(
    page: number = 1, 
    limit: number = 10, 
    favoritesOnly: boolean = false,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Observable<PaginatedResponse<ServiceCall>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (favoritesOnly) {
      params = params.set('favoritesOnly', 'true');
    }

    if (sortBy && sortOrder) {
      params = params.set('sortBy', sortBy);
      params = params.set('sortOrder', sortOrder);
    }
      
    return this.http.get<PaginatedResponse<ServiceCall>>(this.baseUrl, {
      headers: this.getHeaders(),
      params
    });
  }

  getServiceCallById(id: string): Observable<ServiceCall> {
    return this.http.get<ServiceCall>(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  createServiceCall(request: CreateServiceCallRequest): Observable<ServiceCall> {
    return this.http.post<ServiceCall>(this.baseUrl, request, {
      headers: this.getHeaders()
    });
  }

  updateServiceCall(id: string, request: UpdateServiceCallRequest): Observable<ServiceCall> {
    return this.http.put<ServiceCall>(`${this.baseUrl}/${id}`, request, {
      headers: this.getHeaders()
    });
  }
}
