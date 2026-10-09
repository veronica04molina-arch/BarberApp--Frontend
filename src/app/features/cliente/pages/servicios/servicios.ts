import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ServiciosService } from '../../../../core/services/servicios.service';
import { Barbero, Servicio } from '../../../../models/servicio';

import {
  LucideArrowRight,
  LucideChevronDown,
  LucideReceipt,
  LucideScissors,
} from '@lucide/angular';

const MAX_SERVICIOS = 3;

@Component({
  selector: 'app-servicios-cliente',
  host: { class: 'contents' },
  imports: [
    CurrencyPipe,
    LucideArrowRight,
    LucideChevronDown,
    LucideReceipt,
    LucideScissors,
  ],
  templateUrl: './servicios.html',
  styleUrl: './servicios.css',
})
export class ServiciosCliente {
  private readonly api = inject(ServiciosService);
  private readonly router = inject(Router);

  readonly max = MAX_SERVICIOS;

  barberos = signal<Barbero[]>([]);
  servicios = signal<Servicio[]>([]);

  cargando = signal(true);
  error = signal<string | null>(null);

  barberoId = signal<number | null>(null);
  seleccionIds = signal<number[]>([]);

  grupos = computed(() =>
    this.barberos()
      .map((b) => ({
        barbero: b,
        servicios: this.servicios().filter((s) => s.idBarbero === b.id),
      }))
      .filter((g) => g.servicios.length > 0),
  );

  barberoSel = computed(() => this.barberos().find((b) => b.id === this.barberoId()) ?? null);

  seleccionados = computed(() =>
    this.servicios().filter((s) => this.seleccionIds().includes(s.id)),
  );

  total = computed(() => this.seleccionados().reduce((t, s) => t + s.precio, 0));

  duracion = computed(() => this.seleccionados().reduce((t, s) => t + s.duracion, 0));

  puedeContinuar = computed(() => this.seleccionados().length >= 1);

  constructor() {
    forkJoin({
      barberos: this.api.getBarberos(),
      servicios: this.api.getServiciosActivos(),
    })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: ({ barberos, servicios }) => {
          this.barberos.set(barberos);
          this.servicios.set(servicios);
          this.cargando.set(false);
        },

        error: (e: HttpErrorResponse) => {
          this.error.set(
            e.status === 401
              ? 'Tu sesión expiró. Inicia sesión de nuevo.'
              : e.status === 403
                ? 'No tienes permiso para ver los servicios.'
                : 'No pudimos cargar los servicios. Intenta de nuevo.',
          );

          this.cargando.set(false);
        },
      });
  }

  estaSeleccionado(s: Servicio): boolean {
    return this.seleccionIds().includes(s.id);
  }

  bloqueado(s: Servicio): boolean {
    return !this.estaSeleccionado(s) && this.seleccionIds().length >= MAX_SERVICIOS;
  }

  toggle(s: Servicio): void {
    // Si se selecciona un servicio de otro barbero,
    // se limpia la selección anterior.
    if (this.barberoId() !== s.idBarbero) {
      this.barberoId.set(s.idBarbero);
      this.seleccionIds.set([s.id]);

      return;
    }

    this.seleccionIds.update((ids) =>
      ids.includes(s.id)
        ? ids.filter((id) => id !== s.id)
        : ids.length < MAX_SERVICIOS
          ? [...ids, s.id]
          : ids,
    );

    if (this.seleccionIds().length === 0) {
      this.barberoId.set(null);
    }
  }

  iniciales(nombre: string): string {
    return nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }

  continuar(): void {
    if (!this.puedeContinuar()) {
      return;
    }

    this.router.navigate(['cliente/agendar-cita'], {
      queryParams: {
        barbero: this.barberoId(),
        servicios: this.seleccionIds().join(','),
      },
    });
  }

}
