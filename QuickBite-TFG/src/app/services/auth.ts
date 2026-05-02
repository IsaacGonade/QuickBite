import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private usuarioActual = new BehaviorSubject<any>(null);
  usuario$ = this.usuarioActual.asObservable();

  constructor(private http: HttpClient) {
    // 1. AL INICIAR LA APP: Recuperamos el usuario
    const usuarioGuardado = localStorage.getItem('usuario_quickbite');

    // Comprobamos que existe Y que no es la palabra literal "undefined"
    if (usuarioGuardado && usuarioGuardado !== 'undefined') {
      try {
        this.usuarioActual.next(JSON.parse(usuarioGuardado));
      } catch (error) {
        // Si el JSON está corrupto por algún motivo, evitamos que la app explote
        console.error('Datos de usuario corruptos en localStorage. Limpiando...');
        localStorage.removeItem('usuario_quickbite');
      }
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((usuarioBD) => {
        // 2. AL HACER LOGIN: Guardo el usuario en el navegador (localStorage)
        localStorage.setItem('usuario_quickbite', JSON.stringify(usuarioBD));

        // Y también lo guardo en la memoria de Angular para que se actualice al instante
        this.usuarioActual.next(usuarioBD);
      }),
    );
  }

  registro(nombre: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, { nombre, email, password });
  }

  logout() {
    // 3. AL CERRAR SESIÓN: Borro el usuario del disco duro del navegador
    localStorage.removeItem('usuario_quickbite');

    // Y vacío la memoria de Angular
    this.usuarioActual.next(null);
  }

}
