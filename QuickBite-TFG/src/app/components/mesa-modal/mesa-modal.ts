import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-mesa-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule
  ],
  // ¡Aquí está la magia de la separación!
  templateUrl: './mesa-modal.html',
  styleUrls: ['./mesa-modal.css'] 
})
export class MesaModalComponent {
  
  mesa: any = {
    numero_mesa: null,
    capacidad: 2,
    ubicacion: 'Salón Principal',
    estado_servicio: 'Activa'
  };
  esEdicion: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<MesaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data && data.mesa) {
      this.esEdicion = true;
      this.mesa = { ...data.mesa };
    }
  }

  guardar() {
    this.dialogRef.close(this.mesa);
  }

  cancelar() {
    this.dialogRef.close();
  }
}