import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AdminService } from '../../services/admin';

@Component({
  selector: 'app-oferta-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, 
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatSlideToggleModule
  ],
  templateUrl: './oferta-modal.html',
  styleUrl: './oferta-modal.css'
})
export class OfertaModalComponent implements OnInit {
  ofertaForm!: FormGroup;
  categorias: any[] = [];
  platos: any[] = [];
  esEdicion: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<OfertaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private adminService: AdminService
  ) {}

  ngOnInit() {
    this.esEdicion = !!this.data;

    this.ofertaForm = new FormGroup({
      nombre_oferta: new FormControl(this.data?.nombre_oferta || '', [Validators.required]),
      porcentaje_descuento: new FormControl(this.data?.porcentaje_descuento || '', [Validators.required, Validators.min(1), Validators.max(100)]),
      id_categoria: new FormControl(this.data?.id_categoria || null),
      id_plato: new FormControl(this.data?.id_plato || null),
      activa: new FormControl(this.data ? this.data.activa : true)
    });

    this.cargarDatos();
  }

  cargarDatos() {
    // Cargamos categorías para el desplegable
    this.adminService.getCategorias().subscribe(data => this.categorias = data);
    // Cargamos platos para el desplegable
    this.adminService.getPlatos().subscribe(data => this.platos = data);
  }

  guardar() {
    if (this.ofertaForm.valid) {
      this.dialogRef.close(this.ofertaForm.value);
    }
  }

  cancelar() {
    this.dialogRef.close(null);
  }
}