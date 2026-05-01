import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartaService } from '../../services/carta';
import { AuthService } from '../../services/auth';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatCardModule, MatIconModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu implements OnInit {
  //menu agrupado { "Entrantes": [...], "Postres": [...] }
  menu: any = {};
  categorias: string[] = [];
  cargando: boolean = true;
  ofertas: any[] = [];
  esUsuarioRegistrado: boolean = false;

  constructor(
    private cartaService: CartaService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // 1. Comprobamos si el usuario está logueado
    this.authService.usuario$.subscribe((usuario) => {
      this.esUsuarioRegistrado = !!usuario;
    });

    // 2. Cargamos las ofertas
    this.cartaService.getOfertas().subscribe((ofs) => (this.ofertas = ofs));

    // 3. Cargamos la carta
    this.cargarCarta();
  }

  // Función para calcular el precio final en el HTML
  obtenerPrecioFinal(plato: any): number {
    if (!this.esUsuarioRegistrado) return plato.precio;

    // Buscamos si hay oferta para este plato específico
    const ofertaPlato = this.ofertas.find((o) => o.id_plato === plato.id_plato);
    if (ofertaPlato) {
      return plato.precio * (1 - ofertaPlato.porcentaje_descuento / 100);
    }

    // Buscamos si hay oferta para la categoría de este plato
    const ofertaCat = this.ofertas.find((o) => o.id_categoria === plato.id_categoria);
    if (ofertaCat) {
      return plato.precio * (1 - ofertaCat.porcentaje_descuento / 100);
    }

    return plato.precio;
  }

  cargarCarta() {
    this.cartaService.getCarta().subscribe({
      next: (data) => {
        this.menu = data;
        this.categorias = Object.keys(data);

        this.cargando = false; // <--- ¡ESTO FALTABA! Oculta el mensaje de "Cargando..."

        this.cdr.detectChanges(); // Despertamos a Angular para que dibuje
      },
      error: (err) => {
        console.error('Error al cargar la carta', err);

        this.cargando = false; // <--- Ponlo aquí también por si hay un error
        this.cdr.detectChanges();
      },
    });
  }
}
