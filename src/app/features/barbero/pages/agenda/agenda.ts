import { HttpErrorResponse } from '@angular/common/http';
import { NgClass } from '@angular/common';

import {
  afterNextRender,
  Component,
  DestroyRef,
  Injector,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideCalendarDays,
  LucideChevronLeft,
  LucideChevronRight,
  LucideCircleAlert,
  LucideCircleCheckBig,
  LucideClock3,
  LucideEye,
  LucideLoaderCircle,
  LucideScissors,
  LucideSettings,
  LucideStickyNote,
  LucideX,
} from '@lucide/angular';
import { forkJoin, map, of, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/services/AuthService';
import { CitasService } from '../../../../core/services/CitasService';
import { Cita } from '../../../../models/cita';

type EstadoFiltro = 'todas' | 'pendiente' | 'confirmada' | 'completada' | 'cancelada';

interface FiltroAgenda {
  valor: EstadoFiltro;
  etiqueta: string;
}

interface CitaAgenda extends Cita {
  nombreCliente: string | null;
  servicios: string[];
}

const FILTROS: readonly FiltroAgenda[] = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'confirmada', etiqueta: 'Confirmadas' },
  { valor: 'completada', etiqueta: 'Completadas' },
  { valor: 'cancelada', etiqueta: 'Canceladas' },
];

@Component({
  selector: 'app-agenda',
  standalone: true,
  host: { class: 'contents' },
  imports: [
    RouterLink,
    NgClass,
    LucideCalendarDays,
    LucideChevronLeft,
    LucideChevronRight,
    LucideCircleAlert,
    LucideCircleCheckBig,
    LucideClock3,
    LucideEye,
    LucideLoaderCircle,
    LucideScissors,
    LucideSettings,
    LucideStickyNote,
    LucideX,
  ],
  templateUrl: './agenda.html',
})
export class Agenda implements OnInit {
  private readonly citasService = inject(CitasService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private idCitaSolicitada: number | null = null;
  readonly idCitaResaltada = signal<number | null>(null);
  private numeroCarga = 0;

  readonly filtros = FILTROS;
  readonly fechaSeleccionada = signal(this.fechaHoy());
  readonly filtroActivo = signal<EstadoFiltro>('todas');
  readonly citas = signal<CitaAgenda[]>([]);
  readonly cargando = signal(false);
  readonly cargandoDetalle = signal(false);
  readonly completandoId = signal<number | null>(null);
  readonly errorCompletarPorCita = signal<Record<number, string>>({});
  readonly error = signal<string | null>(null);
  readonly citaDetalle = signal<CitaAgenda | null>(null);

  readonly fechaMostrada = computed(() => this.formatearFecha(this.fechaSeleccionada()));
  readonly citasFiltradas = computed(() => {
    const filtro = this.filtroActivo();
    const citas = this.citas();

    return filtro === 'todas' ? citas : citas.filter((cita) => cita.estado === filtro);
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const valor = params.get('cita');
      const id = valor && /^\d+$/.test(valor) ? Number(valor) : null;
      this.idCitaSolicitada = id;

      if (id === null) {
        this.idCitaResaltada.set(null);
        this.cargarAgenda();
        return;
      }

      this.citasService.obtenerCita(id).subscribe({
        next: (cita) => {
          this.fechaSeleccionada.set(cita.fecha);
          this.filtroActivo.set('todas');
          this.cargarAgenda();
        },
        error: () => this.cargarAgenda(),
      });
    });
  }

  cambiarDia(dias: number): void {
    this.idCitaSolicitada = null;
    this.idCitaResaltada.set(null);

    const fecha = new Date(`${this.fechaSeleccionada()}T00:00:00`);
    fecha.setDate(fecha.getDate() + dias);
    this.fechaSeleccionada.set(this.aFechaIso(fecha));
    this.cargarAgenda();
  }

  seleccionarFiltro(filtro: EstadoFiltro): void {
    this.filtroActivo.set(filtro);
  }

  puedeCompletar(cita: CitaAgenda): boolean {
    return cita.estado !== 'cancelada' && cita.estado !== 'completada';
  }

  verDetalles(idCita: number): void {
    this.error.set(null);
    this.cargandoDetalle.set(true);

    this.citasService
      .obtenerCita(idCita)
      .pipe(switchMap((cita) => this.enriquecerCita(cita)))
      .subscribe({
        next: (cita) => {
          this.citaDetalle.set(cita);
          this.cargandoDetalle.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(
            this.mensajeError(error, 'No fue posible consultar el detalle de la cita.'),
          );
          this.cargandoDetalle.set(false);
        },
      });
  }

  cerrarDetalles(): void {
    this.citaDetalle.set(null);
  }

  marcarComoCompletada(cita: CitaAgenda): void {
    if (!this.puedeCompletar(cita) || this.completandoId() !== null) {
      return;
    }

    this.limpiarErrorCompletar(cita.id);
    this.completandoId.set(cita.id);

    this.citasService.completarCita(cita.id).subscribe({
      next: () => {
        this.citas.update((citas) =>
          citas.map((citaActual) =>
            citaActual.id === cita.id ? { ...citaActual, estado: 'completada' } : citaActual,
          ),
        );

        if (this.citaDetalle()?.id === cita.id) {
          this.citaDetalle.update((detalle) =>
            detalle ? { ...detalle, estado: 'completada' } : null,
          );
        }

        this.completandoId.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.errorCompletarPorCita.update((errores) => ({
          ...errores,
          [cita.id]: this.mensajeError(error, 'No fue posible completar la cita.'),
        }));
        this.completandoId.set(null);
      },
    });
  }

  mensajeErrorCompletar(idCita: number): string | null {
    return this.errorCompletarPorCita()[idCita] ?? null;
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

  clasesEstado(estado: string): string {
    const clases: Record<string, string> = {
      pendiente: 'bg-amber-50 text-amber-700 ring-amber-200',
      confirmada: 'bg-blue-50 text-blue-700 ring-blue-200',
      completada: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      cancelada: 'bg-rose-50 text-rose-700 ring-rose-200',
    };

    return clases[estado] ?? 'bg-gray-50 text-gray-700 ring-gray-200';
  }

  private cargarAgenda(): void {
    const idUsuario = this.authService.obtenerUsuario()?.id;
    const carga = ++this.numeroCarga;

    this.error.set(null);
    this.citaDetalle.set(null);

    if (!idUsuario) {
      this.citas.set([]);
      this.error.set('No se encontró una sesión de barbero activa.');
      return;
    }

    this.cargando.set(true);

    this.citasService.obtenerBarberos().subscribe({
      next: (barberos) => {
        const barbero = barberos.find((item) => item.usuario?.id === idUsuario);

        if (!barbero) {
          if (carga === this.numeroCarga) {
            this.citas.set([]);
            this.error.set('No existe un perfil de barbero asociado al usuario autenticado.');
            this.cargando.set(false);
          }
          return;
        }

        this.cargarCitasDeFecha(barbero.id, carga);
      },
      error: (error: HttpErrorResponse) => this.finalizarCargaConError(carga, error),
    });
  }

  private cargarCitasDeFecha(idBarbero: number, carga: number): void {
    this.citasService.obtenerCitasBarberoPorFecha(idBarbero, this.fechaSeleccionada()).subscribe({
      next: (citas) => {
        // No hay citas para la fecha seleccionada
        if (citas.length === 0) {
          if (carga !== this.numeroCarga) return;

          this.citas.set([]);
          this.cargando.set(false);
          return;
        }

        // Sí hay citas, entonces se enriquecen
        forkJoin(citas.map((cita) => this.enriquecerCita(cita))).subscribe({
          next: (citasAgenda) => {
            if (carga !== this.numeroCarga) return;

            this.citas.set(citasAgenda.sort((a, b) => a.hora.localeCompare(b.hora)));

            this.cargando.set(false);
            this.actualizarCitaResaltada();
          },
          error: (error: HttpErrorResponse) => this.finalizarCargaConError(carga, error),
        });
      },

      error: (error: HttpErrorResponse) => this.finalizarCargaConError(carga, error),
    });
  }

  private enriquecerCita(cita: Cita) {
    return forkJoin({
      cliente: this.citasService.obtenerUsuario(cita.idUsuario),
      relaciones: this.citasService.obtenerServiciosDeCita(cita.id),
    }).pipe(
      switchMap(({ cliente, relaciones }) => {
        if (relaciones.length === 0) {
          return of({ ...cita, nombreCliente: cliente?.nombre ?? null, servicios: [] });
        }

        return forkJoin(
          relaciones.map((relacion) => this.citasService.obtenerServicio(relacion.idServicio)),
        ).pipe(
          map((servicios) => ({
            ...cita,
            nombreCliente: cliente?.nombre ?? null,
            servicios: servicios.map((servicio) => servicio.nombre),
          })),
        );
      }),
    );
  }

  private actualizarCitaResaltada(): void {
    const id = this.idCitaSolicitada;
    const existe = id !== null && this.citas().some((cita) => cita.id === id);

    this.idCitaResaltada.set(existe ? id : null);
    if (!existe) return;

    afterNextRender(
      () =>
        document
          .getElementById(`cita-${id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      { injector: this.injector },
    );
  }

  private finalizarCargaConError(carga: number, error: HttpErrorResponse): void {
    if (carga !== this.numeroCarga) return;

    this.citas.set([]);
    this.error.set(
      this.mensajeError(error, 'No fue posible cargar las citas de la fecha seleccionada.'),
    );
    this.cargando.set(false);
  }

  private limpiarErrorCompletar(idCita: number): void {
    this.errorCompletarPorCita.update((errores) => {
      const { [idCita]: _, ...resto } = errores;
      return resto;
    });
  }

  private mensajeError(error: HttpErrorResponse, mensajePorDefecto: string): string {
    if (error.status === 400) {
      return (
        this.obtenerMensajeServidor(error) ?? 'La cita no puede completarse en su estado actual.'
      );
    }

    if (error.status === 401) {
      return 'Tu sesión no es válida o expiró. Inicia sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tienes permiso para realizar esta operación sobre la cita.';
    }

    if (error.status === 404) {
      return 'La cita solicitada ya no está disponible.';
    }

    return this.obtenerMensajeServidor(error) ?? mensajePorDefecto;
  }

  private obtenerMensajeServidor(error: HttpErrorResponse): string | null {
    return typeof error.error === 'string' && error.error.trim() ? error.error : null;
  }

  private formatearFecha(fecha: string): string {
    return new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${fecha}T00:00:00`));
  }

  private fechaHoy(): string {
    return this.aFechaIso(new Date());
  }

  private aFechaIso(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }
}
