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
}
