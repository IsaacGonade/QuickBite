import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // ==========================================
  // GESTIÓN DEL PERFIL
  // ==========================================

  actualizarPerfil(id: number, datosUsuario: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}`, datosUsuario);
  }

  eliminarCuenta(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`);
  }

  // ==========================================
  // GESTIÓN DE RESERVAS DEL CLIENTE
  // ==========================================

  getReservasUsuario(idUsuario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reservas/usuario/${idUsuario}`);
  }

  actualizarReserva(idReserva: number, datosReserva: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/reservas/${idReserva}`, datosReserva);
  }

  cancelarReserva(idReserva: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reservas/${idReserva}`);
  }
}
