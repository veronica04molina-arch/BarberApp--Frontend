import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { AuthService } from '../../../../core/services/AuthService';
import { CitasService } from '../../../../core/services/CitasService';
import { MisCitas } from './mis-citas';

describe('MisCitas', () => {
  let component: MisCitas;
  let fixture: ComponentFixture<MisCitas>;
  let queryParamMap: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let obtenerCitasCliente: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    queryParamMap = new BehaviorSubject(convertToParamMap({ cita: '31' }));
    obtenerCitasCliente = vi.fn(() => of([
      cita({ id: 31, fecha: '2099-01-01', hora: '10:00', estado: 'pendiente' }),
      cita({ id: 32, fecha: '2099-01-02', hora: '10:00', estado: 'confirmada' }),
    ]));

    Element.prototype.scrollIntoView = vi.fn();

    await TestBed.configureTestingModule({
      imports: [MisCitas],
      providers: [
        { provide: AuthService, useValue: { obtenerUsuario: () => ({ id: 4 }) } },
        { provide: CitasService, useValue: { obtenerCitasCliente, cancelarCita: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: queryParamMap.value },
            queryParamMap: queryParamMap.asObservable(),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisCitas);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('highlights and labels the selected closest future appointment', () => {
    expect(component.idCitaResaltada()).toBe(31);

    const tarjeta = fixture.nativeElement.querySelector('#cita-31') as HTMLElement;
    expect(tarjeta).toBeTruthy();
    expect(tarjeta.className).toContain('border-[#2563eb]');
    expect(tarjeta.textContent).toContain('TU PRÓXIMA CITA');
  });

  it('opens the history and highlights a selected historical appointment without the label', () => {
    component.historialAbierto.set(false);
    obtenerCitasCliente.mockReturnValue(of([cita({ id: 31, fecha: '2020-01-01', estado: 'cancelada' })]));
    queryParamMap.next(convertToParamMap({ cita: '31' }));
    component.cargarCitas();
    fixture.detectChanges();

    expect(component.historialAbierto()).toBe(true);
    expect(component.idCitaResaltada()).toBe(31);
    expect(fixture.nativeElement.querySelector('#cita-31').textContent).not.toContain('TU PRÓXIMA CITA');
  });

  it('does not highlight an appointment that is absent from the customer list', () => {
    queryParamMap.next(convertToParamMap({ cita: '999999' }));
    fixture.detectChanges();

    expect(component.idCitaResaltada()).toBeNull();
    expect(fixture.nativeElement.querySelector('#cita-31').className).not.toContain('border-[#2563eb]');
    expect(fixture.nativeElement.textContent).not.toContain('TU PRÓXIMA CITA');
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
