import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventosService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Pide al servidor solo los eventos activos (que aún no han terminado)
  getEventosActivos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/eventos`);
  }
}