import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';

@Component({
  selector: 'app-edicion-reserva-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatSelectModule,
  ],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }],
  templateUrl: './edicion-reserva-modal.html',
  styleUrl: './edicion-reserva-modal.css',
})
export class EdicionReservaModal implements OnInit {
  editForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EdicionReservaModal>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    // Inicializamos el formulario con los datos que ya tiene la reserva
    this.editForm = new FormGroup({
      nombre: new FormControl({ value: data.nombre_cliente, disabled: true }),
      email: new FormControl({ value: data.email_cliente, disabled: true }),
      num_comensales: new FormControl(data.num_comensales, [
        Validators.required,
        Validators.min(1),
      ]),
      fecha_reserva: new FormControl(data.fecha_reserva, [Validators.required]),
    });
  }

  ngOnInit() {
    const fechaObj = new Date(this.data.fecha_reserva);
    
    // Extraemos hora y minutos y le pegamos el ":00" para que coincida con tu mat-option
    const hh = fechaObj.getHours().toString().padStart(2, '0');
    const mm = fechaObj.getMinutes().toString().padStart(2, '0');
    const horaExacta = `${hh}:${mm}:00`; 

    this.editForm = new FormGroup({
      nombre: new FormControl({ value: this.data.nombre_cliente, disabled: true }),
      email: new FormControl({ value: this.data.email_cliente, disabled: true }),
      num_comensales: new FormControl(this.data.num_comensales, [
        Validators.required, 
        Validators.min(1),
        Validators.max(this.data.capacidad || 20)
      ]),
      fecha: new FormControl(fechaObj, [Validators.required]),
      hora: new FormControl(horaExacta, [Validators.required]), // Le pasamos la hora en formato HH:mm:00
      id_mesa: new FormControl(this.data.id_mesa)
    });
  }

  guardar() {
    if (this.editForm.valid) {
      const f = this.editForm.value.fecha;
      const h = this.editForm.value.hora; // Esto ya es algo como "14:30:00"

      const year = f.getFullYear();
      const month = (f.getMonth() + 1).toString().padStart(2, '0');
      const day = f.getDate().toString().padStart(2, '0');
      
      // Juntamos la fecha y el turno seleccionado
      const fecha_mysql = `${year}-${month}-${day} ${h}`;

      this.dialogRef.close({
        id_mesa: this.editForm.value.id_mesa,
        num_comensales: this.editForm.value.num_comensales,
        fecha_reserva: fecha_mysql
      });
    }
  }

  cancelar() {
    this.dialogRef.close(null);
  }
}
