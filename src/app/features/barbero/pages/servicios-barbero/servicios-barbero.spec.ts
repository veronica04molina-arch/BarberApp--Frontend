import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ServiciosService } from '../../../../core/services/servicios.service';
import { ServiciosBarbero } from './servicios-barbero';

registerLocaleData(localeEsCo);

describe('ServiciosBarbero', () => {
  let component: ServiciosBarbero;
  let fixture: ComponentFixture<ServiciosBarbero>;
  let serviciosService: {
    getMisServicios: ReturnType<typeof vi.fn>;
    activarServicio: ReturnType<typeof vi.fn>;
    desactivarServicio: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const servicio = {
      id: 11,
      idBarbero: 7,
      nombre: 'Arreglo de barba',
      precio: 25000,
      duracion: 30,
      descripcion: 'Perfilado',
      estado: 'activo' as const,
    };
    serviciosService = {
      getMisServicios: vi.fn(() => of([servicio])),
      activarServicio: vi.fn(() => of(void 0)),
      desactivarServicio: vi.fn(() => of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [ServiciosBarbero],
      providers: [{
        provide: ServiciosService,
        useValue: {
          ...serviciosService,
          crearServicio: vi.fn(() => of(servicio)),
          actualizarServicio: vi.fn(() => of(servicio)),
        },
      }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiciosBarbero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('desactiva el servicio sin eliminarlo', () => {
    const servicio = component.servicios()[0];
    component.solicitarCambioEstado(servicio);
    component.confirmarCambioEstado();

    expect(serviciosService.desactivarServicio).toHaveBeenCalledWith(11);
    expect(serviciosService.getMisServicios).toHaveBeenCalledTimes(2);
  });

  it('reactiva un servicio inactivo', () => {
    component.servicios.set([{ ...component.servicios()[0], estado: 'inactivo' }]);
    component.solicitarCambioEstado(component.servicios()[0]);
    component.confirmarCambioEstado();

    expect(serviciosService.activarServicio).toHaveBeenCalledWith(11);
  });
});
