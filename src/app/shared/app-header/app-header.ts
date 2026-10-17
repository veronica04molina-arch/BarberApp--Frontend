import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { LucideBell, LucideLogOut, LucideMenu } from '@lucide/angular';

import { AuthService } from '../../core/services/AuthService';
import { NotificacionService } from '../../core/services/NotificacionService';
import { Notificacion } from '../../models/notificacion';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideBell, LucideLogOut, LucideMenu],
  templateUrl: './app-header.html',
  host: { class: 'block' },
})
export class AppHeader {
  readonly authService = inject(AuthService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly router = inject(Router);

  readonly usuario = this.authService.usuario;
  readonly primerNombre = this.authService.primerNombre;
  readonly iniciales = this.authService.iniciales;
  readonly rutaInicio = this.authService.rutaInicio;
  readonly menuAbierto = input(false);
  readonly abrirMenu = output<void>();

  // Ruta del perfil según el rol (barbero o cliente)
  readonly rutaPerfil = computed(() =>
    this.rutaInicio().startsWith('/barbero') ? '/barbero/perfil' : '/cliente/perfil',
  );

  // Notificaciones
  readonly notificaciones = signal<Notificacion[]>([]);
  readonly cantidadPendientes = signal(0);
  readonly mostrarNotificaciones = signal(false);

  constructor() {
    effect(() => {
      const usuarioActual = this.usuario();

      if (!usuarioActual?.id) {
        this.notificaciones.set([]);
        this.cantidadPendientes.set(0);

        return;
      }

      this.cargarNotificaciones(usuarioActual.id);
    });

    // Actualizar notificaciones cada minuto
    interval(60_000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const id = this.usuario()?.id;
        if (id) this.cargarNotificaciones(id);
      });
  }

  cargarNotificaciones(idUsuario: number): void {
    // Obtener todas las notificaciones
    this.notificacionService.listarPorUsuario(idUsuario).subscribe({
      next: (notificaciones) => {
        this.notificaciones.set(notificaciones);
      },

      error: (error) => {
        console.error('Error al cargar las notificaciones:', error);

        this.notificaciones.set([]);
      },
    });

    // Obtener cantidad de pendientes
    this.notificacionService.contarPendientes(idUsuario).subscribe({
      next: (cantidad) => {
        this.cantidadPendientes.set(cantidad);
      },

      error: (error) => {
        console.error('Error al contar las notificaciones pendientes:', error);

        this.cantidadPendientes.set(0);
      },
    });
  }

  abrirNotificacion(notificacion: Notificacion): void {
    this.marcarComoLeida(notificacion);
    this.cerrarNotificaciones();
    void this.router.navigate([this.rutaCitas()], {
      queryParams: { cita: notificacion.idCita },
    });
  }

  marcarTodasComoLeidas(): void {
    const id = this.usuario()?.id;
    if (!id || this.cantidadPendientes() === 0) return;

    this.notificacionService.marcarTodasComoLeidas(id).subscribe({
      next: () => {
        this.notificaciones.update((lista) =>
          lista.map((n) => ({ ...n, estado: 'leida' as const })),
        );
        this.cantidadPendientes.set(0);
      },
      error: (error) => {
        console.error('Error al marcar todas como leídas:', error);
      },
    });
  }

  marcarComoLeida(notificacion: Notificacion): void {
    // Si ya está leída, no hacemos petición
    if (notificacion.estado === 'leida') {
      return;
    }

    this.notificacionService.marcarComoLeida(notificacion.id).subscribe({
      next: (notificacionActualizada) => {
        // Actualizar la notificación en la lista
        this.notificaciones.update((lista) =>
          lista.map((n) => (n.id === notificacionActualizada.id ? notificacionActualizada : n)),
        );

        // Disminuir contador
        this.cantidadPendientes.update((cantidad) => Math.max(0, cantidad - 1));
      },

      error: (error) => {
        console.error('Error al marcar la notificación como leída:', error);
      },
    });
  }

  cerrarNotificaciones(): void {
    this.mostrarNotificaciones.set(false);
  }

  alternarNotificaciones(): void {
    const abrir = !this.mostrarNotificaciones();
    this.mostrarNotificaciones.set(abrir);

    const id = this.usuario()?.id;
    if (abrir && id) this.cargarNotificaciones(id);
  }

  readonly rutaCitas = computed(() =>
    this.rutaInicio().startsWith('/barbero') ? '/barbero/agenda' : '/cliente/mis-citas',
  );

  formatearFecha(fecha: string): string {
    const fechaConvertida = new Date(fecha);

    return fechaConvertida.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
  }
}
