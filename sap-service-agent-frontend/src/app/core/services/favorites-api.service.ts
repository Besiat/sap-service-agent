import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserFavoritesResponse {
  favoriteServiceCallIds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/favorites`;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getUserFavorites(): Observable<UserFavoritesResponse> {
    return this.http.get<UserFavoritesResponse>(this.baseUrl, {
      headers: this.getHeaders()
    });
  }

  addToFavorites(serviceCallId: string): Observable<void> {
    return this.http.post<void>(this.baseUrl, 
      { serviceCallId }, 
      { headers: this.getHeaders() }
    );
  }

  removeFromFavorites(serviceCallId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${serviceCallId}`, {
      headers: this.getHeaders()
    });
  }
}
