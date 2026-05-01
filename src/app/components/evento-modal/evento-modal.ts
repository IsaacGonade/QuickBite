import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-evento-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, 
    MatFormFieldModule, MatInputModule, MatButtonModule
  ],
  templateUrl: './evento-modal.html',
  styleUrl: './evento-modal.css'
})
export class EventoModalComponent implements OnInit {
  eventoForm!: FormGroup;
  esEdicion: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<EventoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.esEdicion = !!this.data;

    // Función para adaptar la fecha de MySQL al selector de Angular
    const formatearFecha = (fechaStr: string) => {
      if (!fechaStr) return '';
      const d = new Date(fechaStr);
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    this.eventoForm = new FormGroup({
      titulo: new FormControl(this.data?.titulo || '', [Validators.required, Validators.minLength(3)]),
      descripcion: new FormControl(this.data?.descripcion || '', [Validators.required]),
      fecha_inicio: new FormControl(formatearFecha(this.data?.fecha_inicio), [Validators.required]),
      fecha_fin: new FormControl(formatearFecha(this.data?.fecha_fin), [Validators.required]),
      url_imagen: new FormControl(this.data?.url_imagen || '')
    });
  }

  guardar() {
    if (this.eventoForm.valid) {
      this.dialogRef.close(this.eventoForm.value);
    }
  }

  cancelar() {
    this.dialogRef.close(null);
  }

  get f() { return this.eventoForm.controls; }
}
