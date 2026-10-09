import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideCalendarClock,
  LucideCircleAlert,
  LucideClock3,
  LucideLoaderCircle,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';

import { AuthService } from '../../../../core/services/AuthService';
import { CitasService } from '../../../../core/services/CitasService';
import {
  ActualizarHorarioSemanal,
  CrearHorarioSemanal,
  HorarioSemanal,
  HorarioSemanalService,
} from '../../../../core/services/HorarioSemanalService';
import {
  ActualizarExcepcionHorario,
  CrearExcepcionHorario,
  ExcepcionHorario,
  ExcepcionHorarioService,
} from '../../../../core/services/ExcepcionHorarioService';
import { AlertBanner } from '../../../../shared/alert-banner/alert-banner';
import { ConfirmModal } from '../../../../shared/confirm-modal/confirm-modal';

interface DiaSemana {
  valor: string;
  etiqueta: string;
}

interface FormularioHorario {
  id: number | null;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
}

interface FormularioExcepcion {
  id: number | null;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipo: string;
  motivo: string;
  todoElDia: boolean;
}

const DIAS_SEMANA: readonly DiaSemana[] = [
  { valor: 'LUNES', etiqueta: 'Lunes' },
  { valor: 'MARTES', etiqueta: 'Martes' },
  { valor: 'MIERCOLES', etiqueta: 'Miércoles' },
  { valor: 'JUEVES', etiqueta: 'Jueves' },
  { valor: 'VIERNES', etiqueta: 'Viernes' },
  { valor: 'SABADO', etiqueta: 'Sábado' },
  { valor: 'DOMINGO', etiqueta: 'Domingo' },
];

@Component({
  selector: 'app-horarios',
  standalone: true,
  host: { class: 'contents' },
  imports: [
    FormsModule,
    AlertBanner,
    ConfirmModal,
    LucideCalendarClock,
    LucideCircleAlert,
    LucideClock3,
    LucideLoaderCircle,
    LucidePencil,
    LucidePlus,
    LucideTrash2,
    LucideX,
  ],
  templateUrl: './horarios.html',
})
export class Horarios implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly citasService = inject(CitasService);
  private readonly horariosService = inject(HorarioSemanalService);
  private readonly excepcionesService = inject(ExcepcionHorarioService);

  readonly dias = DIAS_SEMANA;
  readonly horarios = signal<HorarioSemanal[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly eliminandoId = signal<number | null>(null);
  readonly actualizandoEstadoId = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);
  readonly idBarbero = signal<number | null>(null);
  readonly formularioAbierto = signal(false);
  readonly formulario = signal<FormularioHorario>(this.crearFormulario('LUNES'));
  readonly excepciones = signal<ExcepcionHorario[]>([]);
  readonly cargandoExcepciones = signal(false);
  readonly guardandoExcepcion = signal(false);
  readonly eliminandoExcepcionId = signal<number | null>(null);
  readonly excepcionSeleccionadaEliminar = signal<ExcepcionHorario | null>(null);
  readonly formularioExcepcionAbierto = signal(false);
  readonly formularioExcepcion = signal<FormularioExcepcion>(this.crearFormularioExcepcion());

  readonly horariosPorDia = computed(() => {
    const horarios = this.horarios();

    return new Map(
      this.dias.map((dia) => [
        dia.valor,
        horarios
          .filter((horario) => horario.diaSemana === dia.valor)
          .sort((primero, segundo) => primero.horaInicio.localeCompare(segundo.horaInicio)),
      ]),
    );
  });

  ngOnInit(): void {
    this.cargarHorarios();
  }

  abrirNuevoHorario(diaSemana: string): void {
    this.error.set(null);
    this.formulario.set(this.crearFormulario(diaSemana));
    this.formularioAbierto.set(true);
  }

  editarHorario(horario: HorarioSemanal): void {
    this.error.set(null);
    this.formulario.set({
      id: horario.id,
      diaSemana: horario.diaSemana,
      horaInicio: this.normalizarHoraParaInput(horario.horaInicio),
      horaFin: this.normalizarHoraParaInput(horario.horaFin),
      estado: horario.estado,
    });
    this.formularioAbierto.set(true);
  }

  cerrarFormulario(): void {
    if (!this.guardando()) {
      this.formularioAbierto.set(false);
    }
  }

  guardarHorario(): void {
    const idBarbero = this.idBarbero();
    const formulario = this.formulario();

    this.error.set(null);

    if (!idBarbero) {
      this.error.set('No existe un perfil de barbero asociado al usuario autenticado.');
      return;
    }

    if (!formulario.horaInicio || !formulario.horaFin || formulario.horaInicio >= formulario.horaFin) {
      this.error.set('La hora de inicio debe ser menor que la hora de finalización.');
      return;
    }

    this.guardando.set(true);

    if (formulario.id === null) {
      const nuevoHorario: CrearHorarioSemanal = {
        idBarbero,
        diaSemana: formulario.diaSemana,
        horaInicio: formulario.horaInicio,
        horaFin: formulario.horaFin,
        estado: formulario.estado,
      };

      this.horariosService.crear(nuevoHorario).subscribe({
        next: (horario) => {
          this.horarios.update((horarios) => [...horarios, horario]);
          this.finalizarGuardado('Horario guardado correctamente.');
        },
        error: (error: HttpErrorResponse) => this.finalizarGuardadoConError(error),
      });
      return;
    }

    const cambios: ActualizarHorarioSemanal = {
      diaSemana: formulario.diaSemana,
      horaInicio: formulario.horaInicio,
      horaFin: formulario.horaFin,
      estado: formulario.estado,
    };

    this.horariosService.actualizar(formulario.id, cambios).subscribe({
      next: (horario) => {
        this.horarios.update((horarios) =>
          horarios.map((actual) => (actual.id === horario.id ? horario : actual)),
        );
        this.finalizarGuardado('Horario actualizado correctamente.');
      },
      error: (error: HttpErrorResponse) => this.finalizarGuardadoConError(error),
    });
  }

  cambiarEstado(horario: HorarioSemanal, estado: string): void {
    if (estado === horario.estado || this.actualizandoEstadoId() !== null) {
      return;
    }

    this.error.set(null);
    this.actualizandoEstadoId.set(horario.id);

    const cambios: ActualizarHorarioSemanal = {
      diaSemana: horario.diaSemana,
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
      estado,
    };

    this.horariosService.actualizar(horario.id, cambios).subscribe({
      next: (actualizado) => {
        this.horarios.update((horarios) =>
          horarios.map((actual) => (actual.id === actualizado.id ? actualizado : actual)),
        );
        this.exito.set('Estado del horario actualizado correctamente.');
        this.actualizandoEstadoId.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.mensajeError(error, 'No fue posible actualizar el estado del horario.'));
        this.actualizandoEstadoId.set(null);
      },
    });
  }

  eliminarHorario(horario: HorarioSemanal): void {
    if (this.eliminandoId() !== null) {
      return;
    }

    this.error.set(null);
    this.eliminandoId.set(horario.id);

    this.horariosService.eliminar(horario.id).subscribe({
      next: () => {
        this.horarios.update((horarios) => horarios.filter((actual) => actual.id !== horario.id));
        this.exito.set('Horario eliminado correctamente.');
        this.eliminandoId.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.mensajeError(error, 'No fue posible eliminar el horario.'));
        this.eliminandoId.set(null);
      },
    });
  }

  horariosDelDia(diaSemana: string): HorarioSemanal[] {
    return this.horariosPorDia().get(diaSemana) ?? [];
  }

  etiquetaEstado(estado: string): string {
    return estado === 'no_disponible' ? 'No disponible' : 'Disponible';
  }

  formatearHora(hora: string): string {
    const [horaTexto = '0', minuto = '00'] = hora.split(':');
    const horaNumero = Number(horaTexto);
    const periodo = horaNumero >= 12 ? 'PM' : 'AM';
    const horaDoce = horaNumero % 12 || 12;

    return `${String(horaDoce).padStart(2, '0')}:${minuto} ${periodo}`;
  }

  actualizarCampo(campo: keyof FormularioHorario, valor: string): void {
    this.formulario.update((formulario) => ({ ...formulario, [campo]: valor }));
  }

  private cargarHorarios(): void {
    const idUsuario = this.authService.obtenerUsuario()?.id;

    this.error.set(null);
    this.exito.set(null);

    if (!idUsuario) {
      this.error.set('No se encontró una sesión de barbero activa.');
      return;
    }

    this.cargando.set(true);

    this.citasService.obtenerBarberos().subscribe({
      next: (barberos) => {
        const barbero = barberos.find((item) => item.usuario?.id === idUsuario);

        if (!barbero) {
          this.error.set('No existe un perfil de barbero asociado al usuario autenticado.');
          this.cargando.set(false);
          return;
        }

        this.idBarbero.set(barbero.id);
        this.obtenerHorariosDeBarbero(barbero.id);
        this.obtenerExcepcionesDeBarbero(barbero.id);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.mensajeError(error, 'No fue posible obtener el perfil del barbero.'));
        this.cargando.set(false);
      },
    });
  }

  private obtenerHorariosDeBarbero(idBarbero: number): void {
    this.horariosService.obtenerPorBarbero(idBarbero).subscribe({
      next: (horarios) => {
        this.horarios.set(horarios);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.horarios.set([]);
        this.error.set(this.mensajeError(error, 'No fue posible cargar los horarios semanales.'));
        this.cargando.set(false);
      },
    });
  }

  abrirNuevaExcepcion(): void {
    this.error.set(null);
    this.formularioExcepcion.set(this.crearFormularioExcepcion());
    this.formularioExcepcionAbierto.set(true);
  }

  editarExcepcion(excepcion: ExcepcionHorario): void {
    this.error.set(null);
    this.formularioExcepcion.set({
      id: excepcion.id,
      fecha: excepcion.fecha,
      horaInicio: this.normalizarHoraNullableParaInput(excepcion.horaInicio),
      horaFin: this.normalizarHoraNullableParaInput(excepcion.horaFin),
      tipo: excepcion.tipo,
      motivo: excepcion.motivo ?? '',
      todoElDia: excepcion.horaInicio === null && excepcion.horaFin === null,
    });
    this.formularioExcepcionAbierto.set(true);
  }

  cerrarFormularioExcepcion(): void {
    if (!this.guardandoExcepcion()) {
      this.formularioExcepcionAbierto.set(false);
    }
  }

  actualizarCampoExcepcion(campo: keyof FormularioExcepcion, valor: string | boolean): void {
    this.formularioExcepcion.update((formulario) => ({ ...formulario, [campo]: valor }));
  }

  cambiarTipoExcepcion(tipo: string): void {
    this.formularioExcepcion.update((formulario) => ({
      ...formulario,
      tipo,
      todoElDia: tipo === 'HORARIO_ESPECIAL' ? false : formulario.todoElDia,
    }));
  }

  cambiarTodoElDia(todoElDia: boolean): void {
    this.formularioExcepcion.update((formulario) => ({
      ...formulario,
      todoElDia,
      horaInicio: todoElDia ? '' : formulario.horaInicio,
      horaFin: todoElDia ? '' : formulario.horaFin,
    }));
  }

  guardarExcepcion(): void {
    const formulario = this.formularioExcepcion();

    this.error.set(null);

    if (formulario.id !== null) {
      this.actualizarExcepcion(formulario);
      return;
    }

    const idBarbero = this.idBarbero();
    if (!idBarbero) {
      this.error.set('No existe un perfil de barbero asociado al usuario autenticado.');
      return;
    }

    const horas = this.validarHorasExcepcion(formulario);
    if (horas === null || !formulario.fecha) {
      if (!formulario.fecha) {
        this.error.set('La fecha es obligatoria.');
      }
      return;
    }

    const nuevaExcepcion: CrearExcepcionHorario = {
      idBarbero,
      fecha: formulario.fecha,
      horaInicio: horas.horaInicio,
      horaFin: horas.horaFin,
      tipo: formulario.tipo,
      motivo: formulario.motivo.trim() || null,
    };

    this.guardandoExcepcion.set(true);
    this.excepcionesService.crear(nuevaExcepcion).subscribe({
      next: (excepcion) => {
        this.excepciones.update((excepciones) => this.ordenarExcepciones([...excepciones, excepcion]));
        this.finalizarGuardadoExcepcion('Excepción agregada correctamente.');
      },
      error: (error: HttpErrorResponse) => this.finalizarGuardadoExcepcionConError(error),
    });
  }

  solicitarEliminacionExcepcion(excepcion: ExcepcionHorario): void {
    if (this.eliminandoExcepcionId() !== null) {
      return;
    }

    this.error.set(null);
    this.excepcionSeleccionadaEliminar.set(excepcion);
  }

  cancelarEliminacionExcepcion(): void {
    if (this.eliminandoExcepcionId() === null) {
      this.excepcionSeleccionadaEliminar.set(null);
    }
  }

  confirmarEliminacionExcepcion(): void {
    const excepcion = this.excepcionSeleccionadaEliminar();

    if (!excepcion || this.eliminandoExcepcionId() !== null) {
      return;
    }

    this.error.set(null);
    this.eliminandoExcepcionId.set(excepcion.id);

    this.excepcionesService.eliminar(excepcion.id).subscribe({
      next: () => {
        this.excepciones.update((excepciones) =>
          excepciones.filter((actual) => actual.id !== excepcion.id),
        );
        this.exito.set('Excepción eliminada correctamente.');
        this.eliminandoExcepcionId.set(null);
        this.excepcionSeleccionadaEliminar.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.mensajeErrorExcepcion(error, 'No fue posible eliminar la excepción.'));
        this.eliminandoExcepcionId.set(null);
      },
    });
  }

  etiquetaTipoExcepcion(tipo: string): string {
    return tipo === 'HORARIO_ESPECIAL' ? 'Horario especial' : 'No disponible';
  }

  horarioExcepcion(excepcion: ExcepcionHorario): string {
    if (excepcion.horaInicio === null && excepcion.horaFin === null) {
      return 'Todo el día';
    }

    return `${this.formatearHora(excepcion.horaInicio ?? '')} — ${this.formatearHora(excepcion.horaFin ?? '')}`;
  }

  formatearFecha(fecha: string): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${fecha}T00:00:00`));
  }

  private obtenerExcepcionesDeBarbero(idBarbero: number): void {
    this.cargandoExcepciones.set(true);

    this.excepcionesService.obtenerPorBarbero(idBarbero).subscribe({
      next: (excepciones) => {
        this.excepciones.set(this.ordenarExcepciones(excepciones));
        this.cargandoExcepciones.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.excepciones.set([]);
        this.error.set(this.mensajeErrorExcepcion(error, 'No fue posible cargar las excepciones de horario.'));
        this.cargandoExcepciones.set(false);
      },
    });
  }

  private actualizarExcepcion(formulario: FormularioExcepcion): void {
    if (formulario.id === null) {
      return;
    }

    const cambios: ActualizarExcepcionHorario = {
      tipo: formulario.tipo,
      motivo: formulario.motivo.trim() || null,
    };

    this.guardandoExcepcion.set(true);
    this.excepcionesService.actualizar(formulario.id, cambios).subscribe({
      next: (excepcion) => {
        this.excepciones.update((excepciones) =>
          this.ordenarExcepciones(
            excepciones.map((actual) => (actual.id === excepcion.id ? excepcion : actual)),
          ),
        );
        this.finalizarGuardadoExcepcion('Excepción actualizada correctamente.');
      },
      error: (error: HttpErrorResponse) => this.finalizarGuardadoExcepcionConError(error),
    });
  }

  private validarHorasExcepcion(
    formulario: FormularioExcepcion,
  ): { horaInicio: string | null; horaFin: string | null } | null {
    if (formulario.tipo === 'NO_DISPONIBLE' && formulario.todoElDia) {
      return { horaInicio: null, horaFin: null };
    }

    if (!formulario.horaInicio || !formulario.horaFin) {
      this.error.set('Debes indicar la hora de inicio y la hora de finalización.');
      return null;
    }

    if (formulario.horaInicio >= formulario.horaFin) {
      this.error.set('La hora de inicio debe ser menor que la hora de finalización.');
      return null;
    }

    return { horaInicio: formulario.horaInicio, horaFin: formulario.horaFin };
  }

  private ordenarExcepciones(excepciones: ExcepcionHorario[]): ExcepcionHorario[] {
    return [...excepciones].sort((primero, segundo) => primero.fecha.localeCompare(segundo.fecha));
  }

  private crearFormularioExcepcion(): FormularioExcepcion {
    return {
      id: null,
      fecha: '',
      horaInicio: '',
      horaFin: '',
      tipo: 'NO_DISPONIBLE',
      motivo: '',
      todoElDia: false,
    };
  }

  private normalizarHoraNullableParaInput(hora: string | null): string {
    return hora?.slice(0, 5) ?? '';
  }

  private finalizarGuardadoExcepcion(mensaje: string): void {
    this.guardandoExcepcion.set(false);
    this.formularioExcepcionAbierto.set(false);
    this.exito.set(mensaje);
  }

  private finalizarGuardadoExcepcionConError(error: HttpErrorResponse): void {
    this.error.set(this.mensajeErrorExcepcion(error, 'No fue posible guardar la excepción.'));
    this.guardandoExcepcion.set(false);
  }

  private mensajeErrorExcepcion(error: HttpErrorResponse, mensajePorDefecto: string): string {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (error.status === 401) {
      return 'Tu sesión no es válida o expiró. Inicia sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tienes permiso para realizar esta operación.';
    }

    if (error.status === 404) {
      return 'La excepción solicitada ya no está disponible.';
    }

    return mensajePorDefecto;
  }

  private crearFormulario(diaSemana: string): FormularioHorario {
    return {
      id: null,
      diaSemana,
      horaInicio: '',
      horaFin: '',
      estado: 'disponible',
    };
  }

  private normalizarHoraParaInput(hora: string): string {
    return hora.slice(0, 5);
  }

  private finalizarGuardado(mensaje: string): void {
    this.guardando.set(false);
    this.formularioAbierto.set(false);
    this.exito.set(mensaje);
  }

  private finalizarGuardadoConError(error: HttpErrorResponse): void {
    this.error.set(this.mensajeError(error, 'No fue posible guardar el horario.'));
    this.guardando.set(false);
  }

  private mensajeError(error: HttpErrorResponse, mensajePorDefecto: string): string {
    return typeof error.error === 'string' && error.error.trim() ? error.error : mensajePorDefecto;
  }
}
