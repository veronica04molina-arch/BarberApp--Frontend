import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../../core/services/AuthService';
import { CitasService } from '../../../../core/services/CitasService';
import { DashboardComponent } from './dashboard';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let obtenerCitasCliente: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    obtenerCitasCliente = vi.fn(() => of([]));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { primerNombre: () => 'Ana', obtenerUsuario: () => ({ id: 4 }) } },
        { provide: CitasService, useValue: { obtenerCitasCliente } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the closest future pending or confirmed appointment', () => {
    obtenerCitasCliente.mockReturnValue(of([
      cita({ id: 1, fecha: '2099-01-03', hora: '10:00', estado: 'pendiente' }),
      cita({ id: 2, fecha: '2099-01-01', hora: '09:00', estado: 'cancelada' }),
      cita({ id: 3, fecha: '2099-01-02', hora: '08:00', estado: 'confirmada' }),
      cita({ id: 4, fecha: '2020-01-01', hora: '08:00', estado: 'pendiente' }),
      cita({ id: 5, fecha: '2099-01-01', hora: '08:00', estado: 'completada' }),
    ]));

    component.cargarProximaCita();

    expect(component.proximaCita()?.id).toBe(3);
    expect(component.cargandoProximaCita()).toBe(false);
  });

  it('passes the displayed appointment ID to Mis Citas', () => {
    obtenerCitasCliente.mockReturnValue(of([cita({ id: 31 })]));

    component.cargarProximaCita();
    fixture.detectChanges();

    const enlace = fixture.nativeElement.querySelector('a[href="/cliente/mis-citas?cita=31"]');
    expect(enlace).toBeTruthy();
  });

  it('shows an error instead of treating a failed request as an empty result', () => {
    obtenerCitasCliente.mockReturnValue(throwError(() => ({ status: 0 })));

    component.cargarProximaCita();

    expect(component.proximaCita()).toBeNull();
    expect(component.errorProximaCita()).toBe('No fue posible cargar tu próxima cita. Intenta nuevamente.');
  });
});

function cita(cambios: Partial<{
  id: number; fecha: string; hora: string; estado: string;
}> = {}) {
  return {
    id: 31,
    fecha: '2099-01-01',
    hora: '10:00',
    servicios: ['Corte'],
    nombreBarbero: 'Ana',
    estado: 'pendiente',
    notas: null,
    ...cambios,
  };
}
