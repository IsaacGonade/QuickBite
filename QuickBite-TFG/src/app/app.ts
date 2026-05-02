import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, MatButtonModule, MatIconModule],
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