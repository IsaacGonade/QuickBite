import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-reserva-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './reserva-modal.html',
  styleUrl: './reserva-modal.css',
})
export class ReservaModal {
  reservaForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ReservaModal>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.reservaForm = new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      comensales: new FormControl(this.data.capacidad, [
        Validators.required,
        Validators.min(1),
        Validators.max(this.data.capacidad),
      ]),
    });
  }

  confirmar() {
    if (this.reservaForm.valid) {
      this.dialogRef.close(this.reservaForm.value);
    }
  }

  cancelar() {
    this.dialogRef.close(null);
  }

  get f() {
    return this.reservaForm.controls;
  }
}
