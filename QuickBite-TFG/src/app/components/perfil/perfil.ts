import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { UsuarioService } from '../../services/usuario';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { EdicionReservaModal } from '../edicion-reserva-modal/edicion-reserva-modal';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class PerfilComponent implements OnInit {
  usuarioActual: any = null;
  perfilForm!: FormGroup;

  reservasActivas: any[] = [];
  reservasPasadas: any[] = [];

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.authService.usuario$.subscribe((usuario) => {
      if (usuario) {
        this.usuarioActual = usuario;
        this.inicializarFormulario();
        this.cargarReservas();
      } else {
        this.router.navigate(['/login']); // Si no hay usuario, lo echamos al login
      }
    });
  }

  inicializarFormulario() {
    this.perfilForm = new FormGroup({
      nombre: new FormControl(this.usuarioActual.nombre, [Validators.required]),
      email: new FormControl(this.usuarioActual.email, [Validators.required, Validators.email]),
      password: new FormControl(''), // Opcional: solo si quiere cambiarla
    });
  }

  cargarReservas() {
    this.usuarioService.getReservasUsuario(this.usuarioActual.id).subscribe({
      next: (reservas) => {
        const hoy = new Date();
        this.reservasActivas = [];
        this.reservasPasadas = [];

        reservas.forEach((reserva) => {
          // Cambiamos .fecha por .fecha_reserva
          const fechaReservaObj = new Date(reserva.fecha_reserva);
          if (fechaReservaObj >= hoy) {
            this.reservasActivas.push(reserva);
          } else {
            this.reservasPasadas.push(reserva);
          }
        });
      },
      error: (err) => console.error('Error al cargar reservas', err),
    });
  }

  actualizarPerfil() {
    if (this.perfilForm.valid) {
      const id = this.usuarioActual.id;
      const datosModificados = this.perfilForm.value;

      this.usuarioService.actualizarPerfil(id, datosModificados).subscribe({
        next: (res) => {
          // 1. Mostramos el mensaje elegante de Angular Material
          const snackRef = this.snackBar.open(
            'Perfil actualizado. Reiniciando sesión para aplicar cambios...',
            'Entendido',
            {
              duration: 5000, // 3 segundos para que le de tiempo a leer
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['snack-success'], // Tu clase CSS personalizada
            },
          );

          // 2. Cuando el SnackBar se cierre (por tiempo o por clic en 'Entendido')
          snackRef.afterDismissed().subscribe(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          });
        },
        error: (err) => {
          this.snackBar.open('Error al actualizar el perfil', 'Cerrar', {
            duration: 3000,
            panelClass: ['snack-error'],
          });
        },
      });
    }
  }

  editarReserva(reserva: any) {
    // En la función editarReserva(reserva: any)
    const dialogRef = this.dialog.open(EdicionReservaModal, {
      width: '450px',
      panelClass: 'dark-modal', // ¡ESTO QUITA EL FONDO BLANCO!
      data: { ...reserva },
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) {
        // Llamamos al servicio con los nuevos datos
        this.usuarioService.actualizarReserva(reserva.id_reserva, resultado).subscribe({
          next: () => {
            this.snackBar.open('Reserva actualizada', 'OK', {
              duration: 3000,
              panelClass: ['snack-success'],
            });

            const index = this.reservasActivas.findIndex(
              (r: any) => r.id_reserva === reserva.id_reserva,
            );

            if (index !== -1) {
              this.reservasActivas[index].num_comensales = resultado.num_comensales;
              this.reservasActivas[index].fecha_reserva = resultado.fecha_reserva;

              // Forzamos a Angular a repintar el HTML AHORA MISMO
              this.cdr.detectChanges();
            }
          },
          error: (err) => {
            // Si el backend devuelve error 400 (Mesa ocupada), lo mostramos
            const mensajeError = err.error?.error || 'Error al actualizar';
            this.snackBar.open(mensajeError, 'Cerrar', {
              duration: 5000,
              panelClass: ['snack-error'],
            });
          },
        });
      }
    });
  }

  cancelarReserva(idReserva: number) {
    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      width: '400px',
      panelClass: 'dark-modal', // Aprovechamos el fondo oscuro que ya creamos
      data: {
        titulo: 'Cancelar Reserva',
        mensaje: '¿Estás seguro de que deseas cancelar esta reserva?',
        textoBoton: 'Sí, cancelar',
        isDanger: true, // Naranja normal
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        // Aquí metemos exactamente el código que ya tenías
        this.usuarioService.cancelarReserva(idReserva).subscribe({
          next: () => {
            this.snackBar.open('Reserva cancelada', 'Cerrar', {
              duration: 3000,
              panelClass: ['snack-success'],
            });
            this.cargarReservas();
          },
          error: () => {
            this.snackBar.open('Error al cancelar', 'Cerrar', {
              duration: 3000,
              panelClass: ['snack-error'],
            });
          },
        });
      }
    });
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  eliminarCuenta() {
    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      width: '400px',
      panelClass: 'dark-modal',
      data: {
        titulo: 'Eliminar Cuenta',
        mensaje: '¿Estás SEGURO de que quieres borrar tu cuenta? Esta acción no se puede deshacer.',
        textoBoton: 'Eliminar definitivamente',
        isDanger: true, // ¡Esto lo pondrá en ROJO de alerta!
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        // Tu código exacto para eliminar
        this.usuarioService.eliminarCuenta(this.usuarioActual.id).subscribe({
          next: () => {
            this.authService.logout();
            this.router.navigate(['/']);
            this.snackBar.open('Cuenta eliminada', 'Cerrar', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Error al eliminar cuenta', 'Cerrar', {
              duration: 3000,
              panelClass: ['snack-error'],
            });
          },
        });
      }
    });
  }
}
