import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/AuthService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  host: { class: 'contents' },
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuario = this.authService.usuario;
  readonly iniciales = this.authService.iniciales;

  // CONTROLES EDITABLES
  readonly passwordControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.minLength(8)],
  });

  readonly confirmPasswordControl = new FormControl('', {
    nonNullable: true,
  });

  // ESTADO
  readonly mostrarPassword = signal(false);
  readonly mostrarConfirmPassword = signal(false);
  readonly guardando = signal(false);

  readonly mensajeExito = signal('');
  readonly mensajeError = signal('');

  // GUARDAR CAMBIOS
  guardarCambios(): void {
    this.mensajeExito.set('');
    this.mensajeError.set('');

    this.passwordControl.markAsTouched();
    this.confirmPasswordControl.markAsTouched();

    const password = this.passwordControl.value;
    const confirmPassword = this.confirmPasswordControl.value;

    if (!password) {
      this.mensajeError.set('Ingresa la nueva contraseña para guardar los cambios.');
      return;
    }

    if (password.length < 8) {
      return;
    }

    if (password !== confirmPassword) {
      return;
    }

    this.guardando.set(true);

    this.authService
      .cambiarPassword({ password })
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => {
          this.mensajeExito.set('Tu contraseña se actualizó correctamente.');
          this.limpiarCamposPassword();

          setTimeout(() => {
            this.authService.cerrarSesionLocal();
          }, 2000);
        },

        error: (error) => {
          console.error('Error al cambiar la contraseña:', error);

          this.mensajeError.set(
            error?.error?.message ?? 'No pudimos actualizar la contraseña. Inténtalo de nuevo.',
          );
        },
      });
  }

  // CANCELAR
  cancelarCambios(): void {
    this.mensajeExito.set('');
    this.mensajeError.set('');

    this.limpiarCamposPassword();
  }

  // UTILIDADES
  private limpiarCamposPassword(): void {
    this.passwordControl.reset();
    this.confirmPasswordControl.reset();

    this.passwordControl.markAsUntouched();
    this.confirmPasswordControl.markAsUntouched();
  }
}
