import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private usuarioActual = new BehaviorSubject<any>(null);
  usuario$ = this.usuarioActual.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((usuarioBD) => {
        //guardo el usuario en la memoria de angular
        this.usuarioActual.next(usuarioBD);
      })
    );
  }

  registro(nombre: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, { nombre, email, password });
  }

  logout() {
    this.usuarioActual.next(null);
  }
}