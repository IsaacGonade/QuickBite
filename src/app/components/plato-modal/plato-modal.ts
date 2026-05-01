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
  selector: 'app-plato-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, 
    MatFormFieldModule, MatInputModule, MatButtonModule, 
    MatSelectModule, MatSlideToggleModule
  ],
  templateUrl: './plato-modal.html',
  styleUrl: './plato-modal.css'
})
export class PlatoModalComponent implements OnInit {
  platoForm!: FormGroup;
  categorias: any[] = [];
  esEdicion: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<PlatoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, // Recibe los datos del plato (si estamos editando)
    private adminService: AdminService
  ) {}

  ngOnInit() {
    this.esEdicion = !!this.data; // Si hay datos, es edición
    
    // Inicializamos el formulario (vacío o con los datos del plato a editar)
    this.platoForm = new FormGroup({
      nombre: new FormControl(this.data?.nombre || '', [Validators.required, Validators.minLength(3)]),
      descripcion: new FormControl(this.data?.descripcion || '', [Validators.required]),
      precio: new FormControl(this.data?.precio || '', [Validators.required, Validators.min(0)]),
      id_categoria: new FormControl(this.data?.id_categoria || '', [Validators.required]),
      url_imagen: new FormControl(this.data?.url_imagen || ''),
      disponible: new FormControl(this.data ? this.data.disponible : true) // Activo por defecto
    });

    this.cargarCategorias();
  }

  // Necesitamos las categorías para el desplegable (Select)
  cargarCategorias() {
    this.adminService.getCategorias().subscribe({
      next: (data) => this.categorias = data,
      error: (err) => console.error('Error al cargar categorías', err)
    });
  }

  guardar() {
    if (this.platoForm.valid) {
      this.dialogRef.close(this.platoForm.value);
    }
  }

  cancelar() {
    this.dialogRef.close(null);
  }

  get f() { return this.platoForm.controls; }
}