import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartaService } from '../../services/carta';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatCardModule, MatIconModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class Menu implements OnInit {
  //menu agrupado { "Entrantes": [...], "Postres": [...] }
  menu: any = {};
  categorias: string[] = [];
  cargando: boolean = true;

  constructor(private cartaService: CartaService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cartaService.getCarta().subscribe({
      next: (data) => {
        this.menu = data;
        this.categorias = Object.keys(data);
        this.cargando = false;

        this.cdr.detectChanges()
      },
      error: (err) => {
        console.error('Error al cargar la carta', err);
        this.cargando = false;
        this.cdr.detectChanges()
      }
    });
  }
}