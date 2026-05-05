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
import { MesaModalComponent } from '../mesa-modal/mesa-modal';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms'; // Súper importante para que funcione el [(ngModel)]

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
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    FormsModule,
    MatSelectModule
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

  // Variables
  mesas: any[] = [];
  columnasMesas: string[] = [
    'numero_mesa',
    'capacidad',
    'ubicacion',
    'estado_servicio',
    'acciones',
  ];

  listaReservas: any[] = [];
  fechaFiltro: Date | null = null; // Para el buscador por fecha

  // 1. Añade estas variables arriba con las demás
  listaUsuarios: any[] = [];
  busquedaUsuario: string = '';

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef, // <--- AÑADE ESTO
  ) {}

  // 1. Añadimos 'dashboard' y lo ponemos por defecto
  vistaActual: 'dashboard' | 'menu' | 'reservas' | 'usuarios' = 'dashboard';

  // 2. Datos de ejemplo para las estadísticas (luego vendrán de tu BD)
  // Actualiza tu variable stats para incluir el array vacío del gráfico
  stats: any = {
    topMesa: { numero: '-', reservas: 0 },
    topDia: { nombre: '-', porcentaje: 0 },
    topHora: { hora: '-', reservas: 0 },
    nuevosUsuarios: { cantidad: 0, tendencia: '-' },
    grafico: [] // <--- Añadimos esto
  };

  // Nueva variable para el mes del gráfico
  mesesDisponibles: { valor: string, nombre: string }[] = [];
  mesGrafico: string = '';

  ngOnInit(): void {
    // Al arrancar, seleccionamos el mes actual en formato "YYYY-MM" (ej: "2026-05")
    // 1. Generamos la lista de meses
    this.generarMesesDisponibles();
    // 2. Seleccionamos el primer mes por defecto (el actual)
    this.mesGrafico = this.mesesDisponibles[0].valor;
    this.cargarDashboard();
    this.cargarPlatos();
    this.cargarCategorias();
    this.cargarEventos(); // <--- NUEVO
    this.cargarOfertas(); // <--- NUEVO
    this.cargarReservasAdmin();
    this.cargarMesasAdmin();
  }

  cargarDashboard() {
    // Le enviamos el mes que tenemos seleccionado al backend
    this.adminService.getEstadisticas(this.mesGrafico).subscribe({
      next: (data) => {
        this.stats = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar el dashboard:", err)
    });
  }

  // Función que crea dinámicamente los últimos 12 meses
  generarMesesDisponibles() {
    const hoy = new Date();
    const opciones = { month: 'long' as const, year: 'numeric' as const };
    
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      
      // Formato 'YYYY-MM' para enviar al backend (ej: "2026-05")
      const valor = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // Formato bonito para el usuario (ej: "Mayo 2026")
      let nombre = fecha.toLocaleDateString('es-ES', opciones);
      nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1); // Primera letra en mayúscula
      
      this.mesesDisponibles.push({ valor, nombre });
    }
  }

  // Se llama cuando el usuario cambia la fecha en el input
  cambiarMesGrafico() {
    this.cargarDashboard(); // Volvemos a pedir los datos al servidor
  }

  // 3. Actualizamos la función cambiarVista
  cambiarVista(nuevaVista: 'dashboard' | 'menu' | 'reservas' | 'usuarios') {
    this.vistaActual = nuevaVista;
    if (nuevaVista === 'reservas') {
      this.cargarReservasAdmin();
    } else if (nuevaVista === 'usuarios') {
      this.cargarUsuariosAdmin();
    } else if (nuevaVista === 'menu') {
      // Si quieres recargar platos/mesas al volver a entrar
      this.cargarMesasAdmin(); 
    }
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
              this.cargarPlatos()
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

              this.cargarPlatos()
            },
            error: (err) => {
              // AQUÍ MOSTRAMOS SI EL PLATO YA TIENE OFERTA
              const mensaje = err.error?.error || 'Error al crear la oferta.';
              this.snackBar.open(mensaje, 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-error'],
              })
            }
          });
        }
      }
    });
  }

  // Cargar mesas
  cargarMesasAdmin() {
    this.adminService.getMesas().subscribe({
      next: (data) => {
        this.mesas = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar mesas:', err),
    });
  }

  // 2. Actualiza la función eliminar (le pasamos el ID y el Número)
  eliminarMesa(id_mesa: number, numero_mesa: number) {
    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      width: '400px',
      panelClass: 'dark-modal',
      data: {
        titulo: 'Eliminar Mesa',
        // Ahora muestra el número real de la mesa
        mensaje: `¿Estás seguro de que deseas eliminar la Mesa ${numero_mesa}?`,
        textoBoton: 'Eliminar',
        isDanger: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.adminService.eliminarMesa(id_mesa).subscribe({
          next: () => {
            this.snackBar.open('Mesa eliminada', 'Cerrar', {
              duration: 3000,
              panelClass: ['snack-success'],
            });
            this.cargarMesasAdmin(); // Recargamos
          },
          error: (err) => {
            const mensajeError =
              err.status === 409
                ? 'No se puede eliminar: la mesa tiene reservas'
                : 'Error al eliminar la mesa';
            this.snackBar.open(mensajeError, 'Cerrar', {
              duration: 4000,
              panelClass: ['snack-error'],
            });
          },
        });
      }
    });
  }

  // Le ponemos el interrogante (mesa?: any) para que sea opcional
  abrirModalMesa(mesaActual?: any) {
    const dialogRef = this.dialog.open(MesaModalComponent, {
      width: '400px',
      panelClass: 'dark-modal', // Tu clase para que se vea oscuro
      data: { mesa: mesaActual }, // Le pasamos la mesa (si existe)
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      // Si "resultado" existe, significa que han pulsado "Guardar" o "Crear"
      if (resultado) {
        if (mesaActual) {
          // ESTAMOS EDITANDO
          this.adminService.actualizarMesa(mesaActual.id_mesa, resultado).subscribe({
            next: () => {
              this.snackBar.open('Mesa actualizada con éxito', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-success'],
              });
              this.cargarMesasAdmin(); // Recargamos la tabla
            },
            error: (err) => {
              // Si falla por número duplicado, mostramos el mensaje del backend
              const msg = err.error?.error || 'Error al actualizar la mesa';
              this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: ['snack-error'] });
            },
          });
        } else {
          // ESTAMOS CREANDO
          this.adminService.crearMesa(resultado).subscribe({
            next: () => {
              this.snackBar.open('Nueva mesa creada', 'Cerrar', {
                duration: 3000,
                panelClass: ['snack-success'],
              });
              this.cargarMesasAdmin(); // Recargamos la tabla
            },
            error: (err) => {
              const msg = err.error?.error || 'Error al crear la mesa';
              this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: ['snack-error'] });
            },
          });
        }
      }
    });
  }

  // 1. Método para cargar (con o sin filtro)
  cargarReservasAdmin() {
    let fechaString = '';

    // Si el administrador ha elegido una fecha en el calendario, la formateamos a YYYY-MM-DD para MySQL
    if (this.fechaFiltro) {
      const year = this.fechaFiltro.getFullYear();
      const month = String(this.fechaFiltro.getMonth() + 1).padStart(2, '0');
      const day = String(this.fechaFiltro.getDate()).padStart(2, '0');
      fechaString = `${year}-${month}-${day}`;
    }

    this.adminService.getReservas(fechaString).subscribe({
      next: (data) => {
        this.listaReservas = data;
        this.cdr.detectChanges(); // ¡Nuestro toque mágico para que pinte rápido!
      },
      error: (err) => console.error('Error al cargar reservas:', err),
    });
  }

  // 2. Método para confirmar o rechazar (Usando nuestro Modal Premium)
  cambiarEstadoReserva(reserva: any, nuevoEstado: string) {
    // Si el estado es "Rechazada", ponemos isDanger en true para que el botón salga rojo
    const isDanger = nuevoEstado === 'Cancelada';

    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      width: '400px',
      panelClass: 'dark-modal',
      data: {
        titulo: `Reserva ${nuevoEstado}`,
        mensaje: `¿Estás seguro de que deseas marcar la reserva de ${reserva.nombre_cliente} como ${nuevoEstado}?`,
        textoBoton: `Sí, ${nuevoEstado.toLowerCase()}`,
        isDanger: isDanger,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.adminService.actualizarEstadoReserva(reserva.id_reserva, nuevoEstado).subscribe({
          next: () => {
            this.snackBar.open(`Reserva ${nuevoEstado.toLowerCase()}`, 'Cerrar', {
              duration: 3000,
              panelClass: ['snack-success'],
            });
            this.cargarReservasAdmin(); // Recargamos la lista
          },
          error: () => {
            this.snackBar.open('Error al cambiar el estado', 'Cerrar', {
              duration: 3000,
              panelClass: ['snack-error'],
            });
          },
        });
      }
    });
  }

  // 3. Añade los dos métodos nuevos:
  cargarUsuariosAdmin() {
    this.adminService.getUsuarios(this.busquedaUsuario).subscribe({
      next: (data) => {
        this.listaUsuarios = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar usuarios:', err),
    });
  }

  cambiarRol(usuario: any) {
    // Determinamos cuál será el nuevo rol
    const nuevoRol = usuario.rol === 'admin' ? 'normal' : 'admin';
    const accion =
      nuevoRol === 'admin' ? 'Hacer administrador' : 'Quitar permisos de administrador';
    const isDanger = nuevoRol === 'normal'; // Lo ponemos en rojo si le estamos quitando permisos

    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      width: '400px',
      panelClass: 'dark-modal',
      data: {
        titulo: 'Cambiar permisos',
        mensaje: `¿Estás seguro de que deseas ${accion.toLowerCase()} a ${usuario.nombre_usuario}?`,
        textoBoton: accion,
        isDanger: isDanger,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.adminService.actualizarRolUsuario(usuario.id_usuario, nuevoRol).subscribe({
          next: () => {
            this.snackBar.open('Rol actualizado', 'Cerrar', {
              duration: 3000,
              panelClass: ['snack-success'],
            });
            this.cargarUsuariosAdmin(); // Recargamos para ver el cambio
          },
          error: () => {
            this.snackBar.open('Error al actualizar rol', 'Cerrar', {
              duration: 3000,
              panelClass: ['snack-error'],
            });
          },
        });
      }
    });
  }
}
