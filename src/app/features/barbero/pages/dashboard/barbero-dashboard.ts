import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideCalendarCheck,
  LucideCalendarDays,
  LucideCheckCheck,
  LucideCircleCheckBig,
  LucideHourglass,
  LucideLoaderCircle,
} from '@lucide/angular';
import { forkJoin, map, of, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/services/AuthService';
import { CitasService } from '../../../../core/services/CitasService';
import { Cita } from '../../../../models/cita';
import { AlertBanner } from '../../../../shared/alert-banner/alert-banner';

interface CitaResumen {
  id: number;
  hora: string;
  cliente: string | null;
  servicios: string[];
  estado: string;
}

@Component({
  selector: 'app-barbero-dashboard',
  host: { class: 'contents' },
  standalone: true,
  imports: [
    RouterLink,
    AlertBanner,
    LucideCalendarDays,
    LucideHourglass,
    LucideCircleCheckBig,
    LucideCheckCheck,
    LucideCalendarCheck,
    LucideLoaderCircle,
    LucideArrowRight,
  ],
  templateUrl: './barbero-dashboard.html',
  styleUrl: './barbero-dashboard.css',
})
export class BarberoDashboard implements OnInit {
  readonly authService = inject(AuthService);
  private readonly citasService = inject(CitasService);

  readonly usuario = this.authService.usuario;
  readonly primerNombre = this.authService.primerNombre;
  readonly citasDeHoy = signal<CitaResumen[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly citasHoy = computed(() => this.citasDeHoy().length);
  readonly citasPendientes = computed(
    () => this.citasDeHoy().filter((cita) => cita.estado === 'pendiente').length,
  );
  readonly citasConfirmadas = computed(
    () => this.citasDeHoy().filter((cita) => cita.estado === 'confirmada').length,
  );
  readonly citasCompletadas = computed(
    () => this.citasDeHoy().filter((cita) => cita.estado === 'completada').length,
  );
  readonly hayCitasDeHoy = computed(() => this.citasDeHoy().length > 0);

  ngOnInit(): void {
    this.cargarCitasDeHoy();
  }

  claseEstado(estado: string): string {
    const clases: Record<string, string> = {
      pendiente: 'bg-amber-50 text-amber-700',
      confirmada: 'bg-green-50 text-green-700',
      completada: 'bg-blue-50 text-blue-700',
      cancelada: 'bg-rose-50 text-rose-700',
    };

    return clases[estado] ?? 'bg-gray-100 text-gray-700';
  }

  etiquetaEstado(estado: string): string {
    const etiquetas: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      completada: 'Completada',
      cancelada: 'Cancelada',
    };

    return etiquetas[estado] ?? estado;
  }

  private cargarCitasDeHoy(): void {
    const idUsuario = this.authService.obtenerUsuario()?.id;

    this.error.set(null);

    if (!idUsuario) {
      this.citasDeHoy.set([]);
      this.error.set('No se encontró una sesión de barbero activa.');
      return;
    }

    this.cargando.set(true);

    this.citasService.obtenerBarberos().subscribe({
      next: (barberos) => {
        const barbero = barberos.find((item) => item.usuario?.id === idUsuario);

        if (!barbero) {
          this.citasDeHoy.set([]);
          this.error.set('No existe un perfil de barbero asociado al usuario autenticado.');
          this.cargando.set(false);
          return;
        }

        this.cargarCitasPorFecha(barbero.id);
      },
      error: (error: HttpErrorResponse) => this.finalizarCargaConError(error),
    });
  }

  private cargarCitasPorFecha(idBarbero: number): void {
    this.citasService.obtenerCitasBarberoPorFecha(idBarbero, this.fechaHoy()).subscribe({
      next: (citas) => {
        if (citas.length === 0) {
          this.citasDeHoy.set([]);
          this.cargando.set(false);
          return;
        }

        forkJoin(citas.map((cita) => this.enriquecerCita(cita))).subscribe({
          next: (citasResumen) => {
            this.citasDeHoy.set(
              citasResumen.sort((primera, segunda) => primera.hora.localeCompare(segunda.hora)),
            );
            this.cargando.set(false);
          },
          error: (error: HttpErrorResponse) => this.finalizarCargaConError(error),
        });
      },
      error: (error: HttpErrorResponse) => this.finalizarCargaConError(error),
    });
  }

  private enriquecerCita(cita: Cita) {
    return forkJoin({
      cliente: this.citasService.obtenerUsuario(cita.idUsuario),
      relaciones: this.citasService.obtenerServiciosDeCita(cita.id),
    }).pipe(
      switchMap(({ cliente, relaciones }) => {
        if (relaciones.length === 0) {
          return of({
            id: cita.id,
            hora: cita.hora,
            cliente: cliente?.nombre ?? null,
            servicios: [],
            estado: cita.estado,
          });
        }

        return forkJoin(
          relaciones.map((relacion) => this.citasService.obtenerServicio(relacion.idServicio)),
        ).pipe(
          map((servicios) => ({
            id: cita.id,
            hora: cita.hora,
            cliente: cliente?.nombre ?? null,
            servicios: servicios.map((servicio) => servicio.nombre),
            estado: cita.estado,
          })),
        );
      }),
    );
  }

  private finalizarCargaConError(error: HttpErrorResponse): void {
    this.citasDeHoy.set([]);
    this.error.set(this.mensajeError(error, 'No fue posible cargar las citas de hoy.'));
    this.cargando.set(false);
  }

  private mensajeError(error: HttpErrorResponse, mensajePorDefecto: string): string {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (error.status === 401) {
      return 'Tu sesión no es válida o expiró. Inicia sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tienes permiso para consultar las citas de este barbero.';
    }

    if (error.status === 404) {
      return 'El perfil de barbero solicitado ya no está disponible.';
    }

    return mensajePorDefecto;
  }

  private fechaHoy(): string {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }
}
