import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  usuarioActual: any = null;

  constructor(public authService: AuthService, private router: Router) {
    this.authService.usuario$.subscribe(user => {
      this.usuarioActual = user;
    });
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(["/"])
  }
}