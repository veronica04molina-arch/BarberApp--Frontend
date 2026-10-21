import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/services/AuthService';
import { RestablecerPassword } from './restablecer-password';

describe('RestablecerPassword', () => {
  let component: RestablecerPassword;
  let fixture: ComponentFixture<RestablecerPassword>;
  let solicitudEnviada: { email: string; token: string; nuevaPassword: string } | undefined;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestablecerPassword],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            restablecerPassword: (datos: { email: string; token: string; nuevaPassword: string }) => {
              solicitudEnviada = datos;
              return of(undefined);
            },
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestablecerPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rechaza la nueva contraseña cuando supera los 20 caracteres', () => {
    component.nuevaPassword.set('x'.repeat(21));
    component.confirmarPassword.set('x'.repeat(21));

    component.actualizarContrasena();

    expect(component.errorGeneral()).toBe('La contraseña no puede superar los 20 caracteres.');
  });

  it('conserva los espacios de la contrasena al restablecerla', () => {
    const password = ' nueva-clave ';
    component.email.set('cliente@ejemplo.com');
    component.token.set('token');
    component.nuevaPassword.set(password);
    component.confirmarPassword.set(password);

    component.actualizarContrasena();

    expect(solicitudEnviada?.nuevaPassword).toBe(password);
  });

  it('acepta exactamente 20 caracteres', () => {
    const password = 'x'.repeat(20);
    component.email.set('cliente@ejemplo.com');
    component.token.set('token');
    component.nuevaPassword.set(password);
    component.confirmarPassword.set(password);

    component.actualizarContrasena();

    expect(component.errorGeneral()).toBe('');
    expect(solicitudEnviada?.nuevaPassword).toHaveLength(20);
  });
});
