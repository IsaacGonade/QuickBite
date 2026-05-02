import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/*@Component({
  // ...
})*/
@Injectable({
  providedIn: 'root',
})
export class ReservasService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getMesas(fecha: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mesas?fecha=${fecha}`);
  }

  crearReserva(reserva: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reservas`, reserva);
  }

  actualizarReserva(id: number, datos: any) {
    return this.http.put(`${this.apiUrl}/reservas/${id}`, datos);
  }
}
