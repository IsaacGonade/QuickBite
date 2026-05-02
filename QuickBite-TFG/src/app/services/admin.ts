import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = 'http://localhost:3000/api/admin';

  constructor(private http: HttpClient) {}

  // Categorías
  getCategorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categorias`);
  }
  addCategoria(cat: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/categorias`, cat);
  }
  deleteCategoria(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categorias/${id}`);
  }
  updateCategoria(id: number, categoria: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/categorias/${id}`, categoria);
  }

  // Platos
  getPlatos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/platos`);
  }
  addPlato(plato: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/platos`, plato);
  }
  updatePlato(id: number, plato: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/platos/${id}`, plato);
  }
  deletePlato(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/platos/${id}`);
  }

  // --- EVENTOS ---
  getEventos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/eventos`);
  }
  addEvento(evento: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/eventos`, evento);
  }
  updateEvento(id: number, evento: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/eventos/${id}`, evento);
  }
  deleteEvento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eventos/${id}`);
  }

  // --- OFERTAS ---
  getOfertas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ofertas`);
  }
  addOferta(oferta: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ofertas`, oferta);
  }
  updateOferta(id: number, oferta: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/ofertas/${id}`, oferta);
  }
  deleteOferta(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/ofertas/${id}`);
  }


  // Obtener mesas
  getMesas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mesas`);
  }

  // Crear mesa
  crearMesa(mesa: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/mesas`, mesa);
  }

  // Actualizar mesa
  actualizarMesa(id: number, mesa: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/mesas/${id}`, mesa);
  }

  // Eliminar mesa
  eliminarMesa(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/mesas/${id}`);
  }


  // Traer reservas (le pasamos la fecha opcional)
  getReservas(fecha?: string): Observable<any> {
    let url = `${this.apiUrl}/reservas`;
    if (fecha) {
      url += `?fecha=${fecha}`;
    }
    return this.http.get(url);
  }

  // Cambiar el estado
  actualizarEstadoReserva(id: number, estado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/reservas/${id}/estado`, { estado });
  }

  // Obtener usuarios (con búsqueda opcional)
  getUsuarios(busqueda?: string): Observable<any> {
    let url = `${this.apiUrl}/usuarios`;
    if (busqueda) {
      url += `?busqueda=${busqueda}`;
    }
    return this.http.get(url);
  }

  // Cambiar el rol de un usuario
  actualizarRolUsuario(id: number, rol: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}/rol`, { rol });
  }

  // Obtener estadísticas del Dashboard enviando el mes opcional
  getEstadisticas(mes?: string): Observable<any> {
    let url = `${this.apiUrl}/estadisticas`;
    if (mes) {
      url += `?mes=${mes}`;
    }
    return this.http.get(url);
  }
}
