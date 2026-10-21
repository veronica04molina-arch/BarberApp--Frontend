import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../../core/services/AuthService';
import { CitasService } from '../../../../core/services/CitasService';
import { Agenda } from './agenda';

describe('Agenda', () => {
  let component: Agenda;
  let fixture: ComponentFixture<Agenda>;

  const citaPendiente = {
    id: 12,
    idUsuario: 4,
    idBarbero: 7,
    fecha: '2026-10-20',
    hora: '08:00:00',
    estado: 'pendiente' as const,
    fechaCreacion: '2026-10-20T07:00:00',
    notas: null,
    nombreCliente: 'Cliente de prueba',
    servicios: ['Corte'],
  };

  beforeEach(async () => {
    const citasService = {
      obtenerBarberos: () => of([{ id: 7, usuario: { id: 1 } }]),
      obtenerCitasBarberoPorFecha: () => of([]),
      completarCita: () =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: 'No se puede completar una cita pendiente. Debe estar confirmada.',
            }),
        ),
    };
    const authService = { obtenerUsuario: () => ({ id: 1 }) };

    await TestBed.configureTestingModule({
      imports: [Agenda],
      providers: [
        provideRouter([]),
        { provide: CitasService, useValue: citasService },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Agenda);
    component = fixture.componentInstance;
    component.citas.set([citaPendiente]);
    fixture.detectChanges();
  });

  it('muestra el rechazo de una cita pendiente solo después de pulsar Completar', () => {
    const contenidoInicial = fixture.nativeElement.textContent;
    expect(contenidoInicial).not.toContain(
      'No se puede completar una cita pendiente. Debe estar confirmada.',
    );
    expect(contenidoInicial).toContain('Marcar como completada');

    component.marcarComoCompletada(citaPendiente);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No se puede completar una cita pendiente. Debe estar confirmada.',
    );
    expect(component.citas()[0].estado).toBe('pendiente');
  });
});
