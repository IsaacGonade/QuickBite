import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <!-- El título cambia a rojo si es una acción peligrosa (isDanger) -->
    <h2 mat-dialog-title [style.color]="data.isDanger ? '#ff4444' : '#ff6b00'">
      {{ data.titulo }}
    </h2>
    
    <mat-dialog-content>
      <p style="color: #eee; font-size: 1.1rem; margin-top: 10px;">
        {{ data.mensaje }}
      </p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()" style="color: #888;">Cancelar</button>
      
      <!-- El botón de aceptar también cambia de color según el peligro -->
      <button mat-flat-button (click)="confirmar()" 
              [style.background-color]="data.isDanger ? '#ff4444' : '#ff6b00'" 
              style="color: white;">
        {{ data.textoBoton }}
      </button>
    </mat-dialog-actions>
  `
})
export class ConfirmModalComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirmar() {
    this.dialogRef.close(true); // Devolvemos 'true' si acepta
  }

  cancelar() {
    this.dialogRef.close(false); // Devolvemos 'false' si cancela
  }
}