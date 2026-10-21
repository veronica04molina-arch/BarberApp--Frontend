import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../../core/services/AuthService';
import { Perfil } from './perfil';

describe('Perfil', () => {
  let component: Perfil;
  let fixture: ComponentFixture<Perfil>;
  let passwordEnviada: string | undefined;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Perfil],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            usuario: signal(null),
            iniciales: signal(''),
            cambiarPassword: ({ password }: { password: string }) => {
              passwordEnviada = password;
              return of(undefined);
            },
            cerrarSesionLocal: () => undefined,
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Perfil);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('valida un máximo de 20 caracteres en la nueva contraseña', () => {
    component.passwordControl.setValue('a'.repeat(21));
    expect(component.passwordControl.hasError('maxlength')).toBeTruthy();

    component.passwordControl.setValue('a'.repeat(20));
    expect(component.passwordControl.hasError('maxlength')).toBeFalsy();
  });

  it('conserva los espacios de la contrasena al cambiarla', () => {
    const password = ' nueva-clave ';
    component.passwordControl.setValue(password);
    component.confirmPasswordControl.setValue(password);

    component.guardarCambios();

    expect(passwordEnviada).toBe(password);
  });
});
