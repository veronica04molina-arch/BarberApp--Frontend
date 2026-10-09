import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideCalendarDays,
  LucideCalendarRange,
  LucideCheckCheck,
  LucideClock3,
  LucideLoaderCircle,
  LucideScissors,
  LucideUsers,
} from '@lucide/angular';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { CitasService } from '../../../../core/services/CitasService';
import { ReportesService } from '../../../../core/services/reportes.service';
import { ServiciosService } from '../../../../core/services/servicios.service';
import { CitaReporte, ResumenCitasReporte, ServicioMasSolicitado } from '../../../../models/reporte';
import { Servicio } from '../../../../models/servicio';
import { AlertBanner } from '../../../../shared/alert-banner/alert-banner';

type Periodo = 'hoy' | 'semana' | 'mes' | 'personalizado';

interface OpcionPeriodo {
  valor: Periodo;
  etiqueta: string;
}

interface EstadoCita {
  etiqueta: string;
  cantidad: number;
  color: string;
  colorSuave: string;
}

interface CitaConCliente extends CitaReporte {
  nombreCliente: string | null;
}

const PERIODOS: readonly OpcionPeriodo[] = [
  { valor: 'hoy', etiqueta: 'Hoy' },
  { valor: 'semana', etiqueta: 'Semana' },
  { valor: 'mes', etiqueta: 'Mes' },
  { valor: 'personalizado', etiqueta: 'Personalizado' },
];

@Component({
  selector: 'app-reportes',
  host: { class: 'contents' },
  imports: [
    AlertBanner,
    FormsModule,
    LucideCalendarDays,
    LucideCalendarRange,
    LucideCheckCheck,
    LucideClock3,
    LucideLoaderCircle,
    LucideScissors,
    LucideUsers,
  ],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit {
  private readonly reportesService = inject(ReportesService);
  private readonly serviciosService = inject(ServiciosService);
  private readonly citasService = inject(CitasService);
  private cargaCitas = 0;

  readonly periodos = PERIODOS;
  readonly periodoActivo = signal<Periodo>('hoy');
  readonly fechaDesde = signal(this.fechaIso(new Date()));
  readonly fechaHasta = signal(this.fechaIso(new Date()));
  readonly resumen = signal<ResumenCitasReporte | null>(null);
  readonly citas = signal<CitaConCliente[]>([]);
  readonly servicios = signal<ServicioMasSolicitado[]>([]);
  readonly cantidadServiciosActivos = signal<number | null>(null);
  readonly cargandoResumen = signal(true);
  readonly cargandoServicios = signal(true);
  readonly cargandoServiciosActivos = signal(true);
  readonly cargandoCitas = signal(true);
  readonly errorResumen = signal<string | null>(null);
  readonly errorServicios = signal<string | null>(null);
  readonly errorServiciosActivos = signal<string | null>(null);
  readonly errorCitas = signal<string | null>(null);
  readonly actualizadoEn = signal(new Date());

  readonly rangoSeleccionado = computed(() => this.obtenerRango(this.periodoActivo()));
  readonly maximoServicios = computed(() => Math.max(...this.servicios().map((servicio) => servicio.cantidad), 0));
  readonly estados = computed<EstadoCita[]>(() => [
    { etiqueta: 'Completadas', cantidad: this.resumen()?.citasCompletadas ?? 0, color: '#2852c7', colorSuave: '#eff4ff' },
    { etiqueta: 'Confirmadas', cantidad: this.resumen()?.citasConfirmadas ?? 0, color: '#16a34a', colorSuave: '#ecfdf3' },
    { etiqueta: 'Pendientes', cantidad: this.resumen()?.citasPendientes ?? 0, color: '#d97706', colorSuave: '#fffbeb' },
    { etiqueta: 'Canceladas', cantidad: this.resumen()?.citasCanceladas ?? 0, color: '#e11d48', colorSuave: '#fff1f2' },
  ]);
  readonly totalEstados = computed(() => this.estados().reduce((total, estado) => total + estado.cantidad, 0));
  readonly graficoEstados = computed(() => {
    const total = this.totalEstados();
    if (!total) return 'conic-gradient(#e5e7eb 0 100%)';

    let acumulado = 0;
    const tramos = this.estados().map((estado) => {
      const inicio = (acumulado / total) * 100;
      acumulado += estado.cantidad;
      const fin = (acumulado / total) * 100;
      return `${estado.color} ${inicio}% ${fin}%`;
    });
    return `conic-gradient(${tramos.join(', ')})`;
  });

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  seleccionarPeriodo(periodo: Periodo): void {
    this.periodoActivo.set(periodo);

    if (periodo === 'personalizado') {
      const hoy = this.fechaIso(new Date());
      this.fechaDesde.set(hoy);
      this.fechaHasta.set(hoy);
    }

    this.cargarCitasDelPeriodo();
  }

  actualizarFecha(campo: 'desde' | 'hasta', valor: string): void {
    if (campo === 'desde') this.fechaDesde.set(valor);
    else this.fechaHasta.set(valor);

    this.cargarCitasDelPeriodo();
  }

  porcentajeServicio(cantidad: number): number {
    const maximo = this.maximoServicios();
    return maximo ? (cantidad / maximo) * 100 : 0;
  }

  clienteDe(cita: CitaConCliente): string {
    return cita.nombreCliente ?? `Cliente #${cita.idUsuario}`;
  }

  etiquetaEstado(estado: string): string {
    const etiquetas: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      completada: 'Completada',
      cancelada: 'Cancelada',
    };
    return etiquetas[estado.toLowerCase()] ?? estado;
  }

  clasesEstado(estado: string): string {
    const clases: Record<string, string> = {
      pendiente: 'bg-amber-50 text-amber-700 ring-amber-200',
      confirmada: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      completada: 'bg-blue-50 text-blue-700 ring-blue-200',
      cancelada: 'bg-rose-50 text-rose-700 ring-rose-200',
    };
    return clases[estado.toLowerCase()] ?? 'bg-gray-50 text-gray-700 ring-gray-200';
  }

  formatearFecha(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
      .format(new Date(anio, mes - 1, dia));
  }

  formatearActualizacion(): string {
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
      .format(this.actualizadoEn());
  }

  private cargarDatosIniciales(): void {
    this.cargarResumen();
    this.cargarServicios();
    this.cargarServiciosActivos();
    this.cargarCitasDelPeriodo();
  }

  private cargarResumen(): void {
    this.cargandoResumen.set(true);
    this.errorResumen.set(null);
    this.reportesService.obtenerResumenCitas().subscribe({
      next: (resumen) => {
        this.resumen.set(resumen);
        this.actualizadoEn.set(new Date());
        this.cargandoResumen.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorResumen.set(this.mensajeError(error, 'No fue posible cargar el resumen general.'));
        this.cargandoResumen.set(false);
      },
    });
  }

  private cargarServicios(): void {
    this.cargandoServicios.set(true);
    this.errorServicios.set(null);
    this.reportesService.obtenerServiciosMasSolicitados().subscribe({
      next: (servicios) => {
        this.servicios.set(this.ordenarServicios(servicios));
        this.actualizadoEn.set(new Date());
        this.cargandoServicios.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorServicios.set(
          this.mensajeError(error, 'No fue posible cargar los servicios más solicitados.'),
        );
        this.cargandoServicios.set(false);
      },
    });
  }

  private cargarServiciosActivos(): void {
    this.cargandoServiciosActivos.set(true);
    this.errorServiciosActivos.set(null);
    this.serviciosService.getMisServicios().subscribe({
      next: (servicios) => {
        this.cantidadServiciosActivos.set(this.contarServiciosActivos(servicios));
        this.actualizadoEn.set(new Date());
        this.cargandoServiciosActivos.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorServiciosActivos.set(
          this.mensajeError(error, 'No fue posible cargar la cantidad de servicios activos.'),
        );
        this.cargandoServiciosActivos.set(false);
      },
    });
  }

  private cargarCitasDelPeriodo(): void {
    const rango = this.obtenerRango(this.periodoActivo());
    const carga = ++this.cargaCitas;

    if (!rango.inicio || !rango.fin) {
      this.citas.set([]);
      this.errorCitas.set('Selecciona las fechas Desde y Hasta para consultar las citas.');
      this.cargandoCitas.set(false);
      return;
    }

    if (rango.inicio > rango.fin) {
      this.citas.set([]);
      this.errorCitas.set('La fecha Desde no puede ser posterior a la fecha Hasta.');
      this.cargandoCitas.set(false);
      return;
    }

    this.cargandoCitas.set(true);
    this.errorCitas.set(null);
    this.reportesService
      .obtenerCitasPorRango(rango.inicio, rango.fin)
      .pipe(switchMap((citas) => this.enriquecerCitas(citas)))
      .subscribe({
        next: (citas) => {
          if (carga !== this.cargaCitas) return;
          this.citas.set(this.ordenarCitas(citas));
          this.actualizadoEn.set(new Date());
          this.cargandoCitas.set(false);
        },
        error: (error: HttpErrorResponse) => {
          if (carga !== this.cargaCitas) return;
          this.citas.set([]);
          this.errorCitas.set(
            this.mensajeError(error, 'No fue posible cargar las citas del período seleccionado.'),
          );
          this.cargandoCitas.set(false);
        },
      });
  }

  private enriquecerCitas(citas: CitaReporte[]) {
    const idsUsuarios = [...new Set(citas.map((cita) => cita.idUsuario))];
    if (!idsUsuarios.length) return of<CitaConCliente[]>([]);

    return forkJoin(
      idsUsuarios.map((idUsuario) =>
        this.citasService.obtenerUsuario(idUsuario).pipe(
          map((usuario) => [idUsuario, usuario?.nombre ?? null] as const),
          catchError(() => of([idUsuario, null] as const)),
        ),
      ),
    ).pipe(
      map((clientes) => {
        const nombres = new Map<number, string | null>(clientes);
        return citas.map((cita) => ({ ...cita, nombreCliente: nombres.get(cita.idUsuario) ?? null }));
      }),
    );
  }

  private obtenerRango(periodo: Periodo): { inicio: string; fin: string } {
    if (periodo === 'personalizado') return { inicio: this.fechaDesde(), fin: this.fechaHasta() };

    const hoy = new Date();
    const fecha = this.fechaIso(hoy);
    if (periodo === 'hoy') return { inicio: fecha, fin: fecha };

    if (periodo === 'semana') {
      const inicio = new Date(hoy);
      const dia = inicio.getDay() || 7;
      inicio.setDate(inicio.getDate() - dia + 1);
      const fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);
      return { inicio: this.fechaIso(inicio), fin: this.fechaIso(fin) };
    }

    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    return { inicio: this.fechaIso(inicio), fin: this.fechaIso(fin) };
  }

  private ordenarCitas(citas: CitaConCliente[]): CitaConCliente[] {
    return [...citas].sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`));
  }

  private ordenarServicios(servicios: ServicioMasSolicitado[]): ServicioMasSolicitado[] {
    return [...servicios].sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
  }

  private contarServiciosActivos(servicios: Servicio[]): number {
    return servicios.filter((servicio) => servicio.estado === 'activo').length;
  }

  private mensajeError(error: HttpErrorResponse, mensajePorDefecto: string): string {
    if (typeof error.error === 'string' && error.error.trim()) return error.error.trim();
    if (error.status === 401) return 'Tu sesión no es válida o expiró. Inicia sesión nuevamente.';
    if (error.status === 403) return 'No tienes permiso para consultar estos reportes.';
    return mensajePorDefecto;
  }

  private fechaIso(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
}
