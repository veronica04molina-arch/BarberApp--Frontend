import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucidePencil, LucidePlus, LucideScissors } from '@lucide/angular';

import { ServiciosService } from '../../../../core/services/servicios.service';
import { Servicio } from '../../../../models/servicio';
import { AlertBanner } from '../../../../shared/alert-banner/alert-banner';
import { ConfirmModal } from '../../../../shared/confirm-modal/confirm-modal';

type DatosServicio = Pick<Servicio, 'nombre' | 'precio' | 'duracion' | 'descripcion'>;

const formularioVacio = (): DatosServicio => ({
  nombre: '', precio: 0, duracion: 30, descripcion: '',
});

@Component({
  selector: 'app-servicios-barbero',
  host: { class: 'contents' },
  imports: [
    CurrencyPipe, FormsModule, AlertBanner, ConfirmModal, LucidePencil, LucidePlus, LucideScissors,
  ],
  templateUrl: './servicios-barbero.html',
  styleUrl: './servicios-barbero.css',
})
export class ServiciosBarbero {
  private readonly serviciosService = inject(ServiciosService);

  readonly servicios = signal<Servicio[]>([]);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly cambiandoEstadoId = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);
  readonly formularioAbierto = signal(false);
  readonly servicioEditando = signal<Servicio | null>(null);
  readonly servicioACambiarEstado = signal<Servicio | null>(null);

  formulario: DatosServicio = formularioVacio();

  constructor() {
    this.cargarServicios();
  }

  cargarServicios(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.serviciosService.getMisServicios().subscribe({
      next: (servicios) => {
        this.servicios.set(servicios);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.mensajeError(error, 'No fue posible cargar tus servicios.'));
        this.cargando.set(false);
      },
    });
  }

  abrirCrear(): void {
    this.error.set(null);
    this.servicioEditando.set(null);
    this.formulario = formularioVacio();
    this.formularioAbierto.set(true);
  }

  abrirEditar(servicio: Servicio): void {
    this.error.set(null);
    this.servicioEditando.set(servicio);
    this.formulario = {
      nombre: servicio.nombre,
      precio: servicio.precio,
      duracion: servicio.duracion,
      descripcion: servicio.descripcion,
    };
    this.formularioAbierto.set(true);
  }

  cerrarFormulario(): void {
    if (!this.guardando()) this.formularioAbierto.set(false);
  }

  guardarServicio(): void {
    if (this.guardando() || !this.formularioValido()) return;

    this.error.set(null);
    this.guardando.set(true);
    const editando = this.servicioEditando();
    const datos: DatosServicio = {
      nombre: this.formulario.nombre.trim(),
      precio: Number(this.formulario.precio),
      duracion: Number(this.formulario.duracion),
      descripcion: this.formulario.descripcion.trim(),
    };
    const solicitud = editando
      ? this.serviciosService.actualizarServicio(editando.id, { ...editando, ...datos })
      : this.serviciosService.crearServicio(datos);

    solicitud.subscribe({
      next: () => {
        this.guardando.set(false);
        this.formularioAbierto.set(false);
        this.exito.set(editando
          ? 'Servicio actualizado correctamente. Los cambios se aplicarán a nuevas citas; las existentes conservarán sus datos anteriores.'
          : 'El servicio fue creado y activado.');
        this.cargarServicios();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(this.mensajeError(error, editando
          ? 'No fue posible actualizar el servicio.'
          : 'No fue posible crear el servicio.'));
      },
    });
  }

  solicitarCambioEstado(servicio: Servicio): void {
    if (this.cambiandoEstadoId() === null) this.servicioACambiarEstado.set(servicio);
  }

  cancelarCambioEstado(): void {
    if (this.cambiandoEstadoId() === null) this.servicioACambiarEstado.set(null);
  }

  confirmarCambioEstado(): void {
    const servicio = this.servicioACambiarEstado();
    if (!servicio || this.cambiandoEstadoId() !== null) return;

    const activar = servicio.estado === 'inactivo';
    this.error.set(null);
    this.cambiandoEstadoId.set(servicio.id);
    const solicitud = activar
      ? this.serviciosService.activarServicio(servicio.id)
      : this.serviciosService.desactivarServicio(servicio.id);

    solicitud.subscribe({
      next: () => {
        this.cambiandoEstadoId.set(null);
        this.servicioACambiarEstado.set(null);
        this.exito.set(activar ? 'El servicio fue activado.' : 'El servicio fue desactivado.');
        this.cargarServicios();
      },
      error: (error: HttpErrorResponse) => {
        this.cambiandoEstadoId.set(null);
        this.servicioACambiarEstado.set(null);
        this.error.set(this.mensajeError(error, 'No fue posible cambiar el estado del servicio.'));
      },
    });
  }

  esActivo(servicio: Servicio): boolean {
    return servicio.estado === 'activo';
  }

  formularioValido(): boolean {
    return !!this.formulario.nombre.trim()
      && !!this.formulario.descripcion.trim()
      && Number(this.formulario.precio) > 0
      && Number.isInteger(Number(this.formulario.duracion))
      && Number(this.formulario.duracion) > 0;
  }

  private mensajeError(error: HttpErrorResponse, mensajePorDefecto: string): string {
    if (typeof error.error === 'string' && error.error.trim()) return error.error.trim();
    if (error.status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
    if (error.status === 403) return 'No tienes permiso para administrar este servicio.';
    return mensajePorDefecto;
  }
}
