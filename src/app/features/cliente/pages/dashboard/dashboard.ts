import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  LucideScissors,
  LucideCalendarPlus,
  LucideListChecks,
  LucideUser,
  LucideClock,
  LucideCalendarDays,
  LucideCircleAlert,
  LucideLoaderCircle,
} from '@lucide/angular';

import { AuthService } from '../../../../core/services/AuthService';
import { CitasService } from '../../../../core/services/CitasService';
import { CitaCliente } from '../../../../models/cita';

@Component({
  selector: 'app-dashboard',
  host: { class: 'contents' },
  imports: [
    RouterLink,
    LucideScissors,
    LucideCalendarPlus,
    LucideListChecks,
    LucideUser,
    LucideClock,
    LucideCalendarDays,
    LucideCircleAlert,
    LucideLoaderCircle,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly citasService = inject(CitasService);

  readonly primerNombre = this.authService.primerNombre;
  readonly proximaCita = signal<CitaCliente | null>(null);
  readonly cargandoProximaCita = signal(true);
  readonly errorProximaCita = signal<string | null>(null);

  constructor() {
    this.cargarProximaCita();
  }

  cargarProximaCita(): void {
    const idUsuario = this.authService.obtenerUsuario()?.id;

    this.errorProximaCita.set(null);
    this.proximaCita.set(null);

    if (!idUsuario) {
      this.cargandoProximaCita.set(false);
      this.errorProximaCita.set('No se pudo identificar al usuario autenticado. Inicia sesión nuevamente.');
      return;
    }

    this.cargandoProximaCita.set(true);

    this.citasService.obtenerCitasCliente(idUsuario).subscribe({
      next: (citas) => {
        const proxima = citas
          .filter((cita) => this.esProxima(cita))
          .sort((primera, segunda) => this.aFechaHora(primera).getTime() - this.aFechaHora(segunda).getTime())[0]
          ?? null;

        this.proximaCita.set(proxima);
        this.cargandoProximaCita.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorProximaCita.set(this.mensajeError(error));
        this.cargandoProximaCita.set(false);
      },
    });
  }

  formatearFechaTarjeta(fecha: string): string {
    const fechaLocal = new Date(`${fecha}T00:00:00`);
    if (Number.isNaN(fechaLocal.getTime())) return fecha;
    return new Intl.DateTimeFormat('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long',
    }).format(fechaLocal);
  }

  formatearHora(hora: string): string {
    const [horas, minutos] = hora.split(':').map(Number);
    if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return hora;
    return `${horas % 12 || 12}:${String(minutos).padStart(2, '0')} ${horas >= 12 ? 'PM' : 'AM'}`;
  }

  private esProxima(cita: CitaCliente): boolean {
    const estado = cita.estado.trim().toLowerCase();
    return (estado === 'pendiente' || estado === 'confirmada')
      && this.aFechaHora(cita).getTime() > Date.now();
  }

  private aFechaHora(cita: CitaCliente): Date {
    const fechaHora = new Date(`${cita.fecha}T${cita.hora}`);
    return Number.isNaN(fechaHora.getTime()) ? new Date(0) : fechaHora;
  }

  private mensajeError(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error.trim()) return error.error.trim();
    if (error.status === 401) return 'Tu sesión no es válida o expiró. Inicia sesión nuevamente.';
    if (error.status === 403) return 'No tienes permiso para consultar tus citas.';
    return 'No fue posible cargar tu próxima cita. Intenta nuevamente.';
  }
}
