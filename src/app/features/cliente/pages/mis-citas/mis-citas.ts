import { HttpErrorResponse } from '@angular/common/http';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideCalendarDays,
  LucideCircleAlert,
  LucideChevronDown,
  LucideEye,
  LucideLoaderCircle,
  LucidePencil,
  LucideTrash2,
  LucideUser,
  LucideX,
} from '@lucide/angular';

import { AuthService } from '../../../../core/services/AuthService';
import { CitasService } from '../../../../core/services/CitasService';
import { CitaCliente } from '../../../../models/cita';
import { AlertBanner } from '../../../../shared/alert-banner/alert-banner';
import { ConfirmModal } from '../../../../shared/confirm-modal/confirm-modal';

@Component({
  selector: 'app-mis-citas',
  standalone: true,
  host: { class: 'contents' },
  imports: [
    RouterLink,
    NgTemplateOutlet,
    AlertBanner,
    ConfirmModal,
    LucideArrowLeft,
    LucideCalendarDays,
    LucideCircleAlert,
    LucideChevronDown,
    LucideEye,
    LucideLoaderCircle,
    LucidePencil,
    LucideTrash2,
    LucideUser,
    LucideX,
  ],
  templateUrl: './mis-citas.html',
  styleUrl: './mis-citas.css',
})
export class MisCitas {
  private readonly citasService = inject(CitasService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  readonly citas = signal<CitaCliente[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);
  readonly citaSeleccionada = signal<CitaCliente | null>(null);
  readonly citaACancelar = signal<CitaCliente | null>(null);
  readonly cancelandoId = signal<number | null>(null);
  readonly historialAbierto = signal(true);
  readonly idCitaResaltada = signal<number | null>(null);
  private idCitaSolicitada: number | null = null;

  readonly proximasCitas = computed(() =>
    this.citas()
      .filter((cita) => this.esProxima(cita))
      .sort(
        (primera, segunda) =>
          this.aFechaHora(primera).getTime() - this.aFechaHora(segunda).getTime(),
      ),
  );

  readonly historialCitas = computed(() =>
    this.citas()
      .filter((cita) => this.esHistorial(cita))
      .sort(
        (primera, segunda) =>
          this.aFechaHora(segunda).getTime() - this.aFechaHora(primera).getTime(),
      ),
  );

  constructor() {
    if (this.route.snapshot.queryParamMap.get('actualizada') === '1') {
      this.exito.set('La cita fue actualizada correctamente.');
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { actualizada: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.idCitaSolicitada = this.idCitaValida(params.get('cita'));
      this.actualizarCitaResaltada();
    });

    this.cargarCitas();
  }

  cargarCitas(): void {
    const idUsuario = this.authService.obtenerUsuario()?.id;

    this.error.set(null);

    if (!idUsuario) {
      this.citas.set([]);
      this.cargando.set(false);
      this.error.set('No se pudo identificar al usuario autenticado. Inicia sesión nuevamente.');
      return;
    }

    this.cargando.set(true);

    this.citasService.obtenerCitasCliente(idUsuario).subscribe({
      next: (citas) => {
        this.citas.set(citas);
        this.cargando.set(false);
        this.actualizarCitaResaltada();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          this.mensajeError(error, 'No fue posible cargar tus citas. Intenta nuevamente.'),
        );
        this.cargando.set(false);
      },
    });
  }

  verDetalles(cita: CitaCliente): void {
    this.citaSeleccionada.set(cita);
  }

  cerrarDetalles(): void {
    this.citaSeleccionada.set(null);
  }

  editarCita(cita: CitaCliente): void {
    if (this.esPendiente(cita)) {
      void this.router.navigate(['/cliente/agendar-cita'], { queryParams: { editar: cita.id } });
    }
  }

  solicitarCancelacion(cita: CitaCliente): void {
    if (this.esPendiente(cita) && this.cancelandoId() === null) {
      this.citaACancelar.set(cita);
    }
  }

  cerrarCancelacion(): void {
    if (this.cancelandoId() === null) {
      this.citaACancelar.set(null);
    }
  }

  cancelarCita(): void {
    const cita = this.citaACancelar();
    const idUsuario = this.authService.obtenerUsuario()?.id;

    if (!cita || !idUsuario || this.cancelandoId() !== null) return;

    this.error.set(null);
    this.cancelandoId.set(cita.id);

    this.citasService.cancelarCita(cita.id, idUsuario).subscribe({
      next: () => {
        this.cancelandoId.set(null);
        this.citaACancelar.set(null);
        this.citaSeleccionada.set(null);
        this.exito.set('La cita fue cancelada correctamente.');
        this.cargarCitas();
      },
      error: (error: HttpErrorResponse) => {
        this.cancelandoId.set(null);
        this.citaACancelar.set(null);
        this.error.set(
          this.mensajeError(error, 'No fue posible cancelar la cita. Intenta nuevamente.'),
        );
        this.cargarCitas();
      },
    });
  }

  esPendiente(cita: CitaCliente): boolean {
    return this.normalizarEstado(cita.estado) === 'pendiente';
  }

  esCitaResaltada(cita: CitaCliente): boolean {
    return this.idCitaResaltada() === cita.id;
  }

  esProximaCitaResaltada(cita: CitaCliente): boolean {
    if (!this.esCitaResaltada(cita) || !this.esProximaVigente(cita)) return false;

    const proxima = this.citas()
      .filter((citaActual) => this.esProximaVigente(citaActual))
      .sort(
        (primera, segunda) =>
          this.aFechaHora(primera).getTime() - this.aFechaHora(segunda).getTime(),
      )[0];

    return proxima?.id === cita.id;
  }

  clasesTarjeta(cita: CitaCliente): string {
    const clasesBase =
      'flex min-w-0 flex-col rounded-[20px] bg-white p-5 shadow-[0_8px_25px_rgba(15,39,110,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,39,110,0.20)]';

    return this.esCitaResaltada(cita)
      ? 'relative flex min-w-0 flex-col overflow-hidden rounded-[20px] border-2 border-[#2563eb] bg-[#eef4ff] p-5 ring-4 ring-[#2563eb]/40 shadow-[0_16px_40px_rgba(15,39,110,0.35)]'
      : clasesBase;
  }

  etiquetaEstado(estado: string): string {
    const etiquetas: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      completada: 'Completada',
      cancelada: 'Cancelada',
    };
    return etiquetas[this.normalizarEstado(estado)] ?? estado;
  }

  clasesEstado(estado: string): string {
    const clases: Record<string, string> = {
      pendiente: 'bg-amber-50 text-amber-700 ring-amber-200',
      confirmada: 'bg-blue-50 text-blue-700 ring-blue-200',
      completada: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      cancelada: 'bg-rose-50 text-rose-700 ring-rose-200',
    };
    return clases[this.normalizarEstado(estado)] ?? 'bg-gray-50 text-gray-700 ring-gray-200';
  }

  puntoEstado(estado: string): string {
    const clases: Record<string, string> = {
      pendiente: 'bg-amber-500',
      confirmada: 'bg-blue-500',
      completada: 'bg-emerald-500',
      cancelada: 'bg-rose-500',
    };
    return clases[this.normalizarEstado(estado)] ?? 'bg-gray-400';
  }

  formatearFecha(fecha: string): string {
    const fechaLocal = new Date(`${fecha}T00:00:00`);
    if (Number.isNaN(fechaLocal.getTime())) return fecha;
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(fechaLocal);
  }

  formatearFechaTarjeta(fecha: string): string {
    const fechaLocal = new Date(`${fecha}T00:00:00`);
    if (Number.isNaN(fechaLocal.getTime())) return fecha;
    return new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(fechaLocal);
  }

  formatearHora(hora: string): string {
    const [horas, minutos] = hora.split(':').map(Number);
    if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return hora;
    return `${horas % 12 || 12}:${String(minutos).padStart(2, '0')} ${horas >= 12 ? 'PM' : 'AM'}`;
  }

  private mensajeError(error: HttpErrorResponse, mensajePorDefecto: string): string {
    const mensajeServidor =
      typeof error.error === 'string' && error.error.trim() ? error.error.trim() : null;
    if (
      error.status === 400 &&
      mensajeServidor?.includes('La cita ya fue confirmada y no puede modificarse.')
    ) {
      return 'La cita ya fue confirmada y no puede modificarse.';
    }
    if (error.status === 400 || error.status === 409) return mensajeServidor ?? mensajePorDefecto;
    if (error.status === 401) return 'Tu sesión no es válida o expiró. Inicia sesión nuevamente.';
    if (error.status === 403)
      return mensajeServidor ?? 'No tienes permiso para realizar esta operación sobre la cita.';
    if (error.status === 404) return 'La cita solicitada ya no está disponible.';
    return mensajeServidor ?? mensajePorDefecto;
  }

  private esProxima(cita: CitaCliente): boolean {
    const estado = this.normalizarEstado(cita.estado);
    return (
      (estado === 'pendiente' || estado === 'confirmada') && this.aFechaHora(cita) >= new Date()
    );
  }

  private esProximaVigente(cita: CitaCliente): boolean {
    const estado = this.normalizarEstado(cita.estado);
    return (
      (estado === 'pendiente' || estado === 'confirmada') &&
      this.aFechaHora(cita).getTime() > Date.now()
    );
  }

  private actualizarCitaResaltada(): void {
    if (this.cargando()) return;

    const cita = this.citas().find((citaActual) => citaActual.id === this.idCitaSolicitada) ?? null;
    this.idCitaResaltada.set(cita?.id ?? null);

    if (!cita) return;

    if (this.esHistorial(cita)) {
      this.historialAbierto.set(true);
    }

    afterNextRender(() => this.desplazarHastaCitaResaltada(), { injector: this.injector });
  }

  private desplazarHastaCitaResaltada(): void {
    const idCita = this.idCitaResaltada();
    if (idCita === null) return;

    document
      .getElementById(`cita-${idCita}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private idCitaValida(valor: string | null): number | null {
    if (valor === null || !/^\d+$/.test(valor)) return null;

    const idCita = Number(valor);
    return Number.isSafeInteger(idCita) && idCita > 0 ? idCita : null;
  }

  private esHistorial(cita: CitaCliente): boolean {
    const estado = this.normalizarEstado(cita.estado);
    return estado === 'completada' || estado === 'cancelada' || this.aFechaHora(cita) < new Date();
  }

  private aFechaHora(cita: CitaCliente): Date {
    const fecha = new Date(`${cita.fecha}T${cita.hora}`);
    return Number.isNaN(fecha.getTime()) ? new Date(0) : fecha;
  }

  private normalizarEstado(estado: string): string {
    return estado.trim().toLowerCase();
  }
}
