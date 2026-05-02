import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventosService } from '../../services/eventos';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet, RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [RouterLink, CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css'
})
export class EventosComponent implements OnInit {
  eventos: any[] = [];
  cargando: boolean = true;

  constructor(
    private eventosService: EventosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.eventosService.getEventosActivos().subscribe({
      next: (data) => {
        this.eventos = [...data];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar eventos', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }
}