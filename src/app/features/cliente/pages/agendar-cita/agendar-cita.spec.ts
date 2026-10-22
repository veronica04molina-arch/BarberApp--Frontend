import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';

import { AuthService } from '../../../../core/services/AuthService';
import { CitasService } from '../../../../core/services/CitasService';
import { ServiciosService } from '../../../../core/services/servicios.service';
import { AgendarCita } from './agendar-cita';

describe('AgendarCita', () => {
  let component: AgendarCita;
  let fixture: ComponentFixture<AgendarCita>;
  let citasService: {
    crearCita: ReturnType<typeof vi.fn>;
    actualizarCita: ReturnType<typeof vi.fn>;
  };
  let obtenerHorariosDisponibles: ReturnType<typeof vi.fn>;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    const queryParams = new BehaviorSubject(convertToParamMap({ editar: '31' }));
    const cita = {
      id: 31,
      idUsuario: 4,
      idBarbero: 7,
      fecha: '2026-10-17',
      hora: '17:30',
      estado: 'pendiente',
      fechaCreacion: '2026-10-06T10:00:00',
      notas: 'Sin novedades',
    };

    citasService = {
      crearCita: vi.fn(() => of(cita)),
      actualizarCita: vi.fn(() => of(cita)),
    };
    obtenerHorariosDisponibles = vi.fn(() => of(['10:00']));
    router = { navigate: vi.fn(() => Promise.resolve(true)) };

    await TestBed.configureTestingModule({
      imports: [AgendarCita],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParams.asObservable() } },
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { usuario: () => ({ id: 4 }) } },
        {
          provide: CitasService,
          useValue: {
            ...citasService,
            obtenerCita: vi.fn(() => of(cita)),
            obtenerServiciosDeCita: vi.fn(() => of([{ id: 1, idCita: 31, idServicio: 11 }])),
            obtenerHorariosDisponibles,
          },
        },
        {
          provide: ServiciosService,
          useValue: {
            getBarberos: vi.fn(() => of([{ id: 7, nombre: 'Ana', especialidad: 'Corte', experiencia: 4 }])),
            getServiciosActivos: vi.fn(() => of([
              {
                id: 11,
                idBarbero: 7,
                nombre: 'Corte',
                precio: 25000,
                duracion: 30,
                descripcion: '',
                estado: 'activo',
              },
            ])),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AgendarCita);
    component = fixture.componentInstance;
  });

  it('uses PUT with the original appointment ID when saving an edit', () => {
    component.fechaSeleccionada = '2026-10-18';
    component.horaSeleccionada = '10:00';
    component.horariosDisponibles = ['10:00'];

    component.confirmarCita();

    expect(citasService.actualizarCita).toHaveBeenCalledWith(
      31,
      expect.objectContaining({
        id: 31,
        idUsuario: 4,
        idBarbero: 7,
        fecha: '2026-10-18',
        hora: '10:00',
      }),
    );
    expect(citasService.crearCita).not.toHaveBeenCalled();
    expect(obtenerHorariosDisponibles).toHaveBeenLastCalledWith(
      7,
      '2026-10-18',
      30,
    );
    expect(router.navigate).toHaveBeenCalledWith(['/cliente/mis-citas'], {
      queryParams: { actualizada: '1' },
    });
  });

  it('ignores the appointment being edited when it asks for available times', () => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaFutura = manana.toISOString().slice(0, 10);
    component.fechaSeleccionada = fechaFutura;

    component.seleccionarFecha();

    expect(obtenerHorariosDisponibles).toHaveBeenCalledWith(7, fechaFutura, 30, 31);
  });

  it('does not show a successful reschedule or refresh availability when the update fails', () => {
    citasService.actualizarCita.mockReturnValue(
      throwError(() => new Error('No se pudo guardar la cita')),
    );
    component.fechaSeleccionada = '2026-10-18';
    component.horaSeleccionada = '10:00';
    component.horariosDisponibles = ['10:00'];

    component.confirmarCita();

    expect(obtenerHorariosDisponibles).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.errorGeneral).toBe('Ocurrió un error al confirmar la cita. Intenta de nuevo.');
  });

  it('keeps the latest availability when the date changes while a request is pending', () => {
    const respuestas: Subject<string[]>[] = [];
    obtenerHorariosDisponibles.mockImplementation(() => {
      const respuesta = new Subject<string[]>();
      respuestas.push(respuesta);
      return respuesta.asObservable();
    });
    const fechaInicial = fechaFutura(1);
    const fechaNueva = fechaFutura(2);

    component.fechaSeleccionada = fechaInicial;
    component.seleccionarFecha();
    component.fechaSeleccionada = fechaNueva;
    component.seleccionarFecha();

    respuestas[0].next(['08:00']);
    respuestas[1].next(['10:00']);

    expect(component.horariosDisponibles).toEqual(['10:00']);
    expect(component.cargandoHorarios()).toBe(false);
  });

  function fechaFutura(dias: number): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
});
