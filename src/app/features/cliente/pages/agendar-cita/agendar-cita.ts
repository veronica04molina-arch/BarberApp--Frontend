import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideCalendarDays,
  LucideCalendarPlus,
  LucideClock,
  LucideReceipt,
  LucideUser,
} from '@lucide/angular';
import { forkJoin, Subscription } from 'rxjs';

import { AuthService } from '../../../../core/services/AuthService';
import { CitasService } from '../../../../core/services/CitasService';
import { ServiciosService } from '../../../../core/services/servicios.service';
import { Cita, CitaRequest } from '../../../../models/cita';
import { Barbero, Servicio } from '../../../../models/servicio';

const MAX_SERVICIOS = 3;

@Component({
  selector: 'app-agendar-cita',
  host: { class: 'contents' },
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideArrowLeft,
    LucideCalendarDays,
    LucideCalendarPlus,
    LucideClock,
    LucideReceipt,
    LucideUser,
  ],
  templateUrl: './agendar-cita.html',
  styleUrl: './agendar-cita.css',
})
export class AgendarCita {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly serviciosService = inject(ServiciosService);
  private readonly citasService = inject(CitasService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  idBarbero = 0;
  idsServicios: number[] = [];

  barberoSeleccionado: Barbero | null = null;
  serviciosSeleccionados: Servicio[] = [];

  totalDuracion = 0;
  totalPrecio = 0;

  fechaSeleccionada = '';
  horaSeleccionada = '';
  notas = '';

  horariosDisponibles: string[] = [];

  cargandoDatos = signal(true);
  cargandoHorarios = signal(false);
  guardandoCita = signal(false);

  errorGeneral = '';
  errorHorarios = '';
  mensajeHorarios = '';

  idCitaEditando: number | null = null;
  private citaEditando: Cita | null = null;

  private seleccionSubscription?: Subscription;
  private horariosSubscription?: Subscription;
  private versionSolicitudHorarios = 0;

  constructor() {
    this.obtenerParametros();
  }

  get estaEditando(): boolean {
    return this.idCitaEditando !== null;
  }

  /** Recupera y valida los IDs que envía la página de servicios. */
  private obtenerParametros(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const editarParam = params.get('editar');

      if (editarParam !== null) {
        const idCita = Number(editarParam);

        if (!Number.isSafeInteger(idCita) || idCita <= 0) {
          this.limpiarSeleccion();
          this.errorGeneral = 'La cita que intentas editar no es válida.';
          this.cargandoDatos.set(false);
          return;
        }

        this.cargarCitaParaEdicion(idCita);
        return;
      }

      const barberoParam = params.get('barbero');
      const serviciosParam = params.get('servicios');
      const idBarbero = Number(barberoParam);
      const idsServicios = serviciosParam?.split(',').map((id) => Number(id.trim())) ?? [];
      const idsUnicos = [...new Set(idsServicios)];

      const parametrosValidos =
        !!barberoParam &&
        Number.isSafeInteger(idBarbero) &&
        idBarbero > 0 &&
        idsServicios.length >= 1 &&
        idsServicios.length <= MAX_SERVICIOS &&
        idsServicios.every((id) => Number.isSafeInteger(id) && id > 0) &&
        idsUnicos.length === idsServicios.length;

      if (!parametrosValidos) {
        this.seleccionSubscription?.unsubscribe();
        this.limpiarSeleccion();
        this.errorGeneral = 'La selección de barbero o servicios no es válida.';
        this.cargandoDatos.set(false);
        return;
      }

      this.idBarbero = idBarbero;
      this.idsServicios = idsUnicos;
      this.idCitaEditando = null;
      this.citaEditando = null;
      this.fechaSeleccionada = '';
      this.horaSeleccionada = '';
      this.notas = '';
      this.cancelarSolicitudHorarios();
      this.horariosDisponibles = [];
      this.cargandoHorarios.set(false);
      this.errorHorarios = '';
      this.mensajeHorarios = '';
      this.errorGeneral = '';

      this.cargarSeleccion();
    });
  }

  /** Recupera el barbero y valida que los servicios sigan disponibles para él. */
  private cargarCitaParaEdicion(idCita: number): void {
    this.seleccionSubscription?.unsubscribe();
    this.limpiarSeleccion();
    this.cargandoDatos.set(true);

    this.seleccionSubscription = forkJoin({
      cita: this.citasService.obtenerCita(idCita),
      relaciones: this.citasService.obtenerServiciosDeCita(idCita),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ cita, relaciones }) => {
          if (cita.estado.toLowerCase() !== 'pendiente') {
            this.errorGeneral = cita.estado.toLowerCase() === 'confirmada'
              ? 'La cita ya fue confirmada y no puede modificarse.'
              : 'Esta cita ya no puede modificarse.';
            this.cargandoDatos.set(false);
            return;
          }

          const idsServicios = relaciones.map((relacion) => relacion.idServicio);
          const idsUnicos = [...new Set(idsServicios)];

          if (idsServicios.length === 0 || idsServicios.length > MAX_SERVICIOS || idsUnicos.length !== idsServicios.length) {
            this.errorGeneral = 'No fue posible recuperar los servicios de la cita.';
            this.cargandoDatos.set(false);
            return;
          }

          this.idCitaEditando = cita.id;
          this.citaEditando = cita;
          this.idBarbero = cita.idBarbero;
          this.idsServicios = idsUnicos;
          this.fechaSeleccionada = cita.fecha;
          this.horaSeleccionada = cita.hora;
          this.notas = cita.notas ?? '';
          this.cargarSeleccion();
        },
        error: (error: HttpErrorResponse) => {
          this.errorGeneral = this.mensajeErrorEdicion(error, 'No fue posible cargar la cita para editarla.');
          this.cargandoDatos.set(false);
        },
      });
  }

  private cargarSeleccion(): void {
    this.seleccionSubscription?.unsubscribe();
    this.cargandoDatos.set(true);
    this.barberoSeleccionado = null;
    this.serviciosSeleccionados = [];
    this.totalDuracion = 0;
    this.totalPrecio = 0;
    this.errorGeneral = '';

    this.seleccionSubscription = forkJoin({
      barberos: this.serviciosService.getBarberos(),
      servicios: this.serviciosService.getServiciosActivos(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ barberos, servicios }) => {
          this.barberoSeleccionado =
            barberos.find((barbero) => Number(barbero.id) === Number(this.idBarbero)) ?? null;

          if (!this.barberoSeleccionado) {
            this.errorGeneral = 'El barbero seleccionado ya no está disponible.';
            this.cargandoDatos.set(false);
            return;
          }

          this.serviciosSeleccionados = servicios.filter(
            (servicio) =>
              this.idsServicios.includes(Number(servicio.id)) &&
              Number(servicio.idBarbero) === Number(this.idBarbero),
          );

          if (this.serviciosSeleccionados.length !== this.idsServicios.length) {
            this.serviciosSeleccionados = [];
            this.barberoSeleccionado = null;
            this.errorGeneral = 'Uno o más servicios ya no están disponibles para este barbero.';
            this.cargandoDatos.set(false);
            return;
          }

          this.calcularResumen();
          this.cargandoDatos.set(false);
        },
        error: () => {
          this.errorGeneral = 'No fue posible cargar la información de la cita.';
          this.cargandoDatos.set(false);
        },
      });
  }

  private mensajeErrorEdicion(error: HttpErrorResponse, mensajePorDefecto: string): string {
    const mensajeServidor = typeof error.error === 'string' && error.error.trim() ? error.error.trim() : null;

    if (error.status === 400 && mensajeServidor?.includes('La cita ya fue confirmada y no puede modificarse.')) {
      return 'La cita ya fue confirmada y no puede modificarse.';
    }

    return mensajeServidor ?? mensajePorDefecto;
  }

  private limpiarSeleccion(): void {
    this.cancelarSolicitudHorarios();
    this.idBarbero = 0;
    this.idsServicios = [];
    this.barberoSeleccionado = null;
    this.serviciosSeleccionados = [];
    this.totalDuracion = 0;
    this.totalPrecio = 0;
    this.fechaSeleccionada = '';
    this.horaSeleccionada = '';
    this.notas = '';
    this.horariosDisponibles = [];
    this.cargandoHorarios.set(false);
    this.guardandoCita.set(false);
    this.errorHorarios = '';
    this.mensajeHorarios = '';
  }

  private calcularResumen(): void {
    this.totalDuracion = this.serviciosSeleccionados.reduce(
      (total, servicio) => total + servicio.duracion,
      0,
    );
    this.totalPrecio = this.serviciosSeleccionados.reduce(
      (total, servicio) => total + servicio.precio,
      0,
    );
  }

  obtenerFechaMinima(): string {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  seleccionarFecha(): void {
    this.cancelarSolicitudHorarios();
    this.horaSeleccionada = '';
    this.horariosDisponibles = [];
    this.cargandoHorarios.set(false);
    this.errorHorarios = '';
    this.mensajeHorarios = '';

    if (!this.fechaSeleccionada) {
      return;
    }

    if (this.fechaSeleccionada < this.obtenerFechaMinima()) {
      this.errorHorarios = 'Selecciona una fecha válida a partir de hoy.';
      return;
    }

    this.obtenerHorariosDisponibles();
  }

  private obtenerHorariosDisponibles(): void {
    if (!this.idBarbero || !this.fechaSeleccionada || this.totalDuracion <= 0) {
      return;
    }

    this.cargandoHorarios.set(true);
    this.errorHorarios = '';
    this.mensajeHorarios = '';
    const versionSolicitud = this.iniciarSolicitudHorarios();

    this.horariosSubscription = this.citasService
      .obtenerHorariosDisponibles(
        this.idBarbero,
        this.fechaSeleccionada,
        this.totalDuracion,
        this.idCitaEditando ?? undefined,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (horarios) => {
          if (!this.esSolicitudActual(versionSolicitud)) {
            return;
          }
          this.horariosDisponibles = horarios;
          this.cargandoHorarios.set(false);

          if (horarios.length === 0) {
            this.mensajeHorarios = 'No hay horarios disponibles para esta fecha.';
          }
        },
        error: () => {
          if (!this.esSolicitudActual(versionSolicitud)) {
            return;
          }
          this.horariosDisponibles = [];
          this.cargandoHorarios.set(false);
          this.errorHorarios = 'No fue posible consultar los horarios disponibles.';
        },
      });
  }

  seleccionarHora(hora: string): void {
    if (!this.horariosDisponibles.includes(hora)) {
      return;
    }

    this.horaSeleccionada = hora;
    this.errorGeneral = '';
  }

  formatearHora(hora: string): string {
    const [horas, minutos] = hora.split(':').map(Number);

    if (!Number.isFinite(horas) || !Number.isFinite(minutos)) {
      return hora;
    }

    const periodo = horas >= 12 ? 'PM' : 'AM';
    const horas12 = horas % 12 || 12;

    return `${horas12}:${String(minutos).padStart(2, '0')} ${periodo}`;
  }

  confirmarCita(): void {
    if (this.guardandoCita()) {
      return;
    }

    this.errorGeneral = '';

    const idUsuario = this.authService.usuario()?.id;

    if (!idUsuario) {
      this.errorGeneral = 'No se pudo identificar al usuario autenticado.';
      return;
    }

    if (!this.puedeConfirmar()) {
      this.errorGeneral = 'Completa la fecha y selecciona un horario disponible.';
      return;
    }

    const request: CitaRequest = {
      idUsuario,
      idBarbero: this.idBarbero,
      idServicios: [...this.idsServicios],
      fecha: this.fechaSeleccionada,
      hora: this.horaSeleccionada,
      notas: this.notas.trim(),
    };

    this.guardandoCita.set(true);

    const esReprogramacion = this.estaEditando;
    const guardado = esReprogramacion
      ? this.citasService.actualizarCita(this.idCitaEditando!, {
          ...this.citaEditando!,
          id: this.idCitaEditando!,
          idUsuario,
          idBarbero: this.idBarbero,
          fecha: this.fechaSeleccionada,
          hora: this.horaSeleccionada,
          notas: this.notas.trim(),
        })
      : this.citasService.crearCita(request);

    guardado
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (esReprogramacion) {
            this.refrescarDisponibilidadDespuesDeReprogramar();
            return;
          }

          void this.router.navigate(['/cliente/mis-citas']);
        },
        error: (error: HttpErrorResponse) => {
          this.guardandoCita.set(false);

          if (error.status === 400) {
            this.errorGeneral =
              typeof error.error === 'string'
                ? error.error
                : 'No fue posible crear la cita. Revisa los datos seleccionados.';
          } else if (error.status === 401) {
            this.errorGeneral = 'Tu sesión ha expirado. Inicia sesión nuevamente.';
          } else if (error.status === 403) {
            this.errorGeneral = 'No tienes permiso para crear esta cita.';
          } else if (error.status === 409) {
            this.errorGeneral = 'Ese horario acaba de ocuparse. Selecciona otro horario.';
            this.seleccionarFecha();
          } else {
            this.errorGeneral = 'Ocurrió un error al confirmar la cita. Intenta de nuevo.';
          }
        },
      });
  }

  /**
   * La cita ya se guardó. Esta consulta no debe ignorarla: así la agenda que se
   * conserva en memoria representa el estado definitivo del servidor, incluido
   * el nuevo horario ocupado y el anterior liberado.
   */
  private refrescarDisponibilidadDespuesDeReprogramar(): void {
    const idBarbero = this.idBarbero;
    const fecha = this.fechaSeleccionada;
    const duracion = this.totalDuracion;

    this.cancelarSolicitudHorarios();
    this.horariosDisponibles = [];
    this.horaSeleccionada = '';
    this.cargandoHorarios.set(true);
    this.errorHorarios = '';
    this.mensajeHorarios = '';
    const versionSolicitud = this.iniciarSolicitudHorarios();

    this.horariosSubscription = this.citasService
      .obtenerHorariosDisponibles(idBarbero, fecha, duracion)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (horarios) => {
          if (!this.esSolicitudActual(versionSolicitud)) {
            return;
          }
          this.horariosDisponibles = horarios;
          this.cargandoHorarios.set(false);
          this.mensajeHorarios =
            horarios.length === 0 ? 'No hay horarios disponibles para esta fecha.' : '';
          this.finalizarReprogramacion();
        },
        error: () => {
          if (!this.esSolicitudActual(versionSolicitud)) {
            return;
          }
          // La reprogramación sí fue persistida. No la presentamos como un error
          // si falla solamente esta recarga; al volver a entrar se consultará de
          // nuevo al servidor.
          this.horariosDisponibles = [];
          this.cargandoHorarios.set(false);
          this.finalizarReprogramacion();
        },
      });
  }

  private finalizarReprogramacion(): void {
    void this.router.navigate(['/cliente/mis-citas'], {
      queryParams: { actualizada: '1' },
    });
  }

  private cancelarSolicitudHorarios(): void {
    this.versionSolicitudHorarios += 1;
    this.horariosSubscription?.unsubscribe();
    this.horariosSubscription = undefined;
  }

  private iniciarSolicitudHorarios(): number {
    this.cancelarSolicitudHorarios();
    return this.versionSolicitudHorarios;
  }

  private esSolicitudActual(versionSolicitud: number): boolean {
    return versionSolicitud === this.versionSolicitudHorarios;
  }

  regresarServicios(): void {
    void this.router.navigate(['/cliente/servicios']);
  }

  puedeConfirmar(): boolean {
    return (
      !this.cargandoDatos() &&
      !this.cargandoHorarios() &&
      !this.guardandoCita() &&
      !!this.barberoSeleccionado &&
      this.serviciosSeleccionados.length > 0 &&
      !!this.fechaSeleccionada &&
      !!this.horaSeleccionada &&
      this.horariosDisponibles.includes(this.horaSeleccionada)
    );
  }
}
