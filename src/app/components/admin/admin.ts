import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PlatoModalComponent } from '../plato-modal/plato-modal';
import { CategoriaModalComponent } from '../categoria-modal/categoria-modal';
import { EventoModalComponent } from '../evento-modal/evento-modal';
import { OfertaModalComponent } from '../oferta-modal/oferta-modal';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  // Lista de platos que recibiremos de la base de datos
  platos: any[] = [];
  // Le decimos a Angular Material qué columnas queremos mostrar y en qué orden
  columnasPlatos: string[] = ['imagen', 'nombre', 'categoria', 'precio', 'disponible', 'acciones'];

  // --- VARIABLES PARA EVENTOS Y OFERTAS ---
  eventos: any[] = [];
  columnasEventos: string[] = ['titulo', 'fechas', 'acciones'];

  ofertas: any[] = [];
  columnasOfertas: string[] = ['nombre', 'descuento', 'objetivo', 'activa', 'acciones'];

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef, // <--- AÑADE ESTO
  ) {}

  ngOnInit(): void {
    this.cargarPlatos();
    this.cargarCategorias();
    this.cargarEventos(); // <--- NUEVO
    this.cargarOfertas(); // <--- NUEVO
  }

  cargarPlatos() {
    this.adminService.getPlatos().subscribe({
      next: (data) => {
        // Los tres puntos crean un array NUEVO, forzando a la tabla a enterarse
        this.platos = [...data];
        this.cdr.detectChanges(); // Despertamos a Angular
      },
      error: (err) => console.error('Error al cargar platos', err),
    });
  }

  // No olvides el import arriba si no lo tienes:
  // import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

  eliminarPlato(id: number) {
    // 1. Abrimos el modal de confirmación
    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      width: '400px',
      panelClass: 'dark-modal', // Mantenemos la estética oscura
      data: {
        titulo: 'Eliminar Plato',
        mensaje:
          '¿Estás seguro de que deseas eliminar este plato de la carta? Esta acción no se puede deshacer.',
        textoBoton: 'Eliminar',
        isDanger: true, // Lo ponemos en rojo peligro
      },
    });

    // 2. Esperamos a ver qué responde el usuario
    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        // 3. Si dice que sí, ejecutamos el código que ya teníamos
        this.adminService.deletePlato(id).subscribe({
          next: () => {
            this.snackBar.open('Plato eliminado de la carta', 'Cerrar', {
              duration: 3000,
              panelClass: ['snack-success'],
            });
            this.cargarPlatos(); // Recargamos la tabla para que desaparezca
          },
          error: () => {
            this.snackBar.open('Error al eliminar el plato', 'Cerrar', {
              duration: 3000,
              panelClass: ['snack-error'],
            });
          },
        });
      }
    });
  }

  abrirModalPlato(plato?: any) {
    const dialogRef = this.dialog.open(PlatoModalComponent, {
      width: '600px',
      data: plato, // Si es undefined, el modal sabrá que es uno nuevo
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) {
        if (plato) {
          // MODO EDITAR: Actualizar plato existente
          this.adminService.updatePlato(plato.id_plato, resultado).subscribe({
            next: () => {
              this.snackBar.open('Plato actualizado correctamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-success'],
              });
              this.cargarPlatos();
            },
            error: () =>
              this.snackBar.open('Error al actualizar', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-error'],
              }),
          });
        } else {
          // MODO CREAR: Añadir nuevo plato
          this.adminService.addPlato(resultado).subscribe({
            next: () => {
              this.snackBar.open('Nuevo plato añadido a la carta', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-success'],
              });
              this.cargarPlatos();
            },
            error: () =>
              this.snackBar.open('Error al crear plato', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-error'],
              }),
          });
        }
      }
    });
  }

  // --- VARIABLES PARA CATEGORÍAS ---
  categorias: any[] = [];
  columnasCategorias: string[] = ['nombre', 'descripcion', 'acciones'];

  // --- FUNCIONES DE CATEGORÍAS ---
  cargarCategorias() {
    this.adminService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = [...data];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar categorías', err),
    });
  }

  eliminarCategoria(id: number) {
    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      width: '400px',
      panelClass: 'dark-modal',
      data: {
        titulo: 'Eliminar Categoría',
        mensaje:
          '¿Estás seguro de que deseas eliminar esta categoría? Si tiene platos asociados, no te dejará borrarla.',
        textoBoton: 'Eliminar',
        isDanger: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.adminService.deleteCategoria(id).subscribe({
          next: () => {
            this.snackBar.open('Categoría eliminada', 'Cerrar', {
              duration: 3000,
              panelClass: ['snack-success'],
            });
            this.cargarCategorias();
          },
          error: (err) => {
            // Mantenemos tu error personalizado
            this.snackBar.open('No puedes borrar una categoría con platos', 'Cerrar', {
              duration: 4000,
              panelClass: ['snack-error'],
            });
          },
        });
      }
    });
  }

  abrirModalCategoria(categoria?: any) {
    const dialogRef = this.dialog.open(CategoriaModalComponent, {
      width: '500px',
      data: categoria,
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) {
        if (categoria) {
          // MODO EDITAR
          this.adminService.updateCategoria(categoria.id_categoria, resultado).subscribe({
            next: () => {
              this.snackBar.open('Categoría actualizada', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-success'],
              });
              this.cargarCategorias(); // Recargamos la tabla
            },
            error: () =>
              this.snackBar.open('Error al actualizar', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-error'],
              }),
          });
        } else {
          // MODO CREAR
          this.adminService.addCategoria(resultado).subscribe({
            next: () => {
              this.snackBar.open('Nueva categoría creada', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-success'],
              });
              this.cargarCategorias();
            },
            error: () =>
              this.snackBar.open('Error al crear', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-error'],
              }),
          });
        }
      }
    });
  }

  // --- FUNCIONES DE EVENTOS ---
  cargarEventos() {
    this.adminService.getEventos().subscribe({
      next: (data) => {
        this.eventos = [...data];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar eventos', err),
    });
  }

  eliminarEvento(id: number) {
    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      width: '400px',
      panelClass: 'dark-modal',
      data: {
        titulo: 'Eliminar Evento',
        mensaje:
          '¿Estás seguro de que deseas cancelar y eliminar este evento? Esta acción no se puede deshacer.',
        textoBoton: 'Eliminar Evento',
        isDanger: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.adminService.deleteEvento(id).subscribe({
          next: () => {
            this.snackBar.open('Evento eliminado', 'Cerrar', {
              duration: 3000,
              panelClass: ['snack-success'],
            });
            this.cargarEventos();
          },
          error: () => {
            this.snackBar.open('Error al eliminar evento', 'Cerrar', {
              duration: 3000,
              panelClass: ['snack-error'],
            });
          },
        });
      }
    });
  }

  abrirModalEvento(evento?: any) {
    const dialogRef = this.dialog.open(EventoModalComponent, {
      width: '600px',
      data: evento,
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) {
        if (evento) {
          // Actualizar
          this.adminService.updateEvento(evento.id_evento, resultado).subscribe({
            next: () => {
              this.snackBar.open('Evento actualizado', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-success'],
              });
              this.cargarEventos();
            },
            error: () =>
              this.snackBar.open('Error al actualizar', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-error'],
              }),
          });
        } else {
          // Crear
          this.adminService.addEvento(resultado).subscribe({
            next: () => {
              this.snackBar.open('Evento creado con éxito', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-success'],
              });
              this.cargarEventos();
            },
            error: () =>
              this.snackBar.open('Error al crear evento', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-error'],
              }),
          });
        }
      }
    });
  }

  // --- FUNCIONES DE OFERTAS ---
  cargarOfertas() {
    this.adminService.getOfertas().subscribe({
      next: (data) => {
        this.ofertas = [...data];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar ofertas', err),
    });
  }

  eliminarOferta(id: number) {
    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      width: '400px',
      panelClass: 'dark-modal',
      data: {
        titulo: 'Eliminar Oferta',
        mensaje:
          '¿Estás seguro de que deseas eliminar esta oferta? Dejará de estar disponible para los clientes inmediatamente.',
        textoBoton: 'Eliminar Oferta',
        isDanger: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.adminService.deleteOferta(id).subscribe({
          next: () => {
            this.snackBar.open('Oferta eliminada', 'Cerrar', {
              duration: 3000,
              panelClass: ['snack-success'],
            });
            this.cargarOfertas();
          },
          error: () => {
            this.snackBar.open('Error al eliminar oferta', 'Cerrar', {
              duration: 3000,
              panelClass: ['snack-error'],
            });
          },
        });
      }
    });
  }

  abrirModalOferta(oferta?: any) {
    const dialogRef = this.dialog.open(OfertaModalComponent, {
      width: '600px',
      data: oferta,
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) {
        if (oferta) {
          this.adminService.updateOferta(oferta.id_oferta, resultado).subscribe({
            next: () => {
              this.snackBar.open('Oferta actualizada', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-success'],
              });
              this.cargarOfertas();
            },
            error: () =>
              this.snackBar.open('Error al actualizar', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-error'],
              }),
          });
        } else {
          this.adminService.addOferta(resultado).subscribe({
            next: () => {
              this.snackBar.open('Oferta creada y aplicada', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-success'],
              });
              this.cargarOfertas();
            },
            error: () =>
              this.snackBar.open('Error al crear oferta', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-error'],
              }),
          });
        }
      }
    });
  }
}
