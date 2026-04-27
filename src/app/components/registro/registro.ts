import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-registro',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatSnackBarModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})

export class Registro {
  registroForm = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    pass: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  registrar() {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const { nombre, email, pass } = this.registroForm.value;

    this.authService.registro(nombre!, email!, pass!).subscribe({
      next: () => {
        this.snackBar.open('Cuenta creada con éxito. Redirigiendo...', 'Cerrar', {
          duration: 3000,
          panelClass: ['snack-success'],
        });
        this.router.navigate(['/login']);
      },
      error: (err) =>
        this.snackBar.open(err.error.error || 'Error al crear la cuenta', 'Cerrar', {
          duration: 4000,
          panelClass: ['snack-error'],
        }),
    });
  }

  get f() {
    return this.registroForm.controls;
  }
}
