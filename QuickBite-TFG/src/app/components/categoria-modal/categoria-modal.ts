import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-categoria-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, 
    MatFormFieldModule, MatInputModule, MatButtonModule
  ],
  templateUrl: './categoria-modal.html',
  styleUrl: './categoria-modal.css'
})
export class CategoriaModalComponent implements OnInit {
  categoriaForm!: FormGroup;
  esEdicion: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<CategoriaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.esEdicion = !!this.data;
    
    this.categoriaForm = new FormGroup({
      nombre: new FormControl(this.data?.nombre || '', [Validators.required, Validators.minLength(3)]),
      descripcion: new FormControl(this.data?.descripcion || '') // La descripción es opcional en tu BD
    });
  }

  guardar() {
    if (this.categoriaForm.valid) {
      this.dialogRef.close(this.categoriaForm.value);
    }
  }

  cancelar() {
    this.dialogRef.close(null);
  }

  get f() { return this.categoriaForm.controls; }
}
