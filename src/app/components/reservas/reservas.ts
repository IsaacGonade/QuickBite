import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservasService } from '../../services/reservas';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { ReservaModal } from '../reserva-modal/reserva-modal';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatButtonModule,
    MatFormFieldModule,
    MatCardModule,
    MatSelectModule,
    MatIcon,
    MatSnackBarModule,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-ES' }],
  templateUrl: './reservas.html',
  styleUrl: './reservas.css',
})
export class Reservas implements OnInit {
  fechaInput: Date | null = null;
  horaInput: string = '';
  fechaSeleccionada: string = '';
  mesas: any[] = [];
  mesaSeleccionadaId: number | null = null;
  usuarioActual: any = null;

  constructor(
    private reservasService: ReservasService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    // Escuchamos si hay un usuario logueado al entrar a la página
    this.authService.usuario$.subscribe((usuario) => {
      this.usuarioActual = usuario;
    });
  }

  abrirModalReserva() {
    const mesaSeleccionada = this.mesas.find((m) => m.id_mesa === this.mesaSeleccionadaId);

    const dialogRef = this.dialog.open(ReservaModal, {
      width: '450px',
      data: {
        id_mesa: mesaSeleccionada.id_mesa,
        numero_mesa: mesaSeleccionada.numero_mesa,
        capacidad: mesaSeleccionada.capacidad,
        fecha: this.fechaSeleccionada,
        // PASAMOS EL USUARIO AL MODAL PARA QUE RELLENE SUS DATOS
        usuario: this.usuarioActual,
      },
    });

    dialogRef.afterClosed().subscribe((datosFormulario) => {
      if (datosFormulario) {
        const nuevaReserva = {
          id_mesa: mesaSeleccionada.id_mesa,
          nombre_cliente: datosFormulario.nombre,
          email_cliente: datosFormulario.email,
          fecha_reserva: this.fechaSeleccionada,
          num_comensales: datosFormulario.comensales,
          // AÑADIMOS EL ID DEL USUARIO A LA RESERVA FINAL (o null si es invitado)
          // Nota: pon .id o .id_usuario según cómo se llame en tu authService
          id_usuario: this.usuarioActual
            ? this.usuarioActual.id_usuario || this.usuarioActual.id
            : null,
        };

        this.reservasService.crearReserva(nuevaReserva).subscribe({
          next: () => {
            this.snackBar.open('¡Reserva confirmada! Te hemos enviado un correo.', 'Genial', {
              duration: 4000,
              panelClass: ['snack-success'],
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            });
            this.consultarDisponibilidad();
            // 2. ¡MAGIA! Redirigimos al usuario a la página de login
            this.router.navigate(['/']);
          },
          error: (err) =>
            this.snackBar.open('Error al guardar la reserva.', 'Cerrar', {
              duration: 4000,
              panelClass: ['snack-error'],
            }),
        });
      }
    });
  }

  combinarYConsultar() {
    if (this.fechaInput && this.horaInput) {
      const year = this.fechaInput.getFullYear();
      const month = (this.fechaInput.getMonth() + 1).toString().padStart(2, '0');
      const day = this.fechaInput.getDate().toString().padStart(2, '0');

      const fechaFormateada = `${year}-${month}-${day}`;
      this.fechaSeleccionada = `${fechaFormateada} ${this.horaInput}`;

      console.log('Consultando a MySQL:', this.fechaSeleccionada);
      this.consultarDisponibilidad();
    }
  }

  consultarDisponibilidad() {
    this.reservasService.getMesas(this.fechaSeleccionada).subscribe({
      next: (data) => {
        this.mesas = data;
        this.mesaSeleccionadaId = null;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error:', err),
    });
  }

  seleccionarMesa(id: number, ocupada: number) {
    if (ocupada === 1) return;
    this.mesaSeleccionadaId = id;
  }
}
