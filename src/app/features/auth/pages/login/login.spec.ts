import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/services/AuthService';
import { LoginComponent } from './login';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let emailSolicitado: string | undefined;
  let credencialesEnviadas: { email: string; password: string } | undefined;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            iniciarSesion: (credenciales: { email: string; password: string }) => {
              credencialesEnviadas = credenciales;
              return of({ id: 1, nombre: 'Cliente', email: credenciales.email, rol: 'cliente', token: 'token' });
            },
            solicitarRecuperacionPassword: (email: string) => {
              emailSolicitado = email;
              return of(undefined);
            },
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra un mensaje genérico tras solicitar la recuperación', () => {
    component.correoRecuperacion.set('no-registrado@ejemplo.com');

    component.solicitarRecuperacion();

    expect(emailSolicitado).toBe('no-registrado@ejemplo.com');
    expect(component.mensajeExitoModal()).toBe(
      'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
    );
  });

  it('rechaza la contraseña cuando supera los 20 caracteres', () => {
    component.credenciales.email = 'cliente@ejemplo.com';
    component.credenciales.password = 'c'.repeat(21);

    component.iniciarSesion();

    expect(component.errorPassword()).toBe('La contraseña no puede superar los 20 caracteres.');
  });

  it('envia la contrasena con sus espacios inicial y final', () => {
    const password = ' secreta ';
    component.credenciales.email = 'cliente@ejemplo.com';
    component.credenciales.password = password;

    component.iniciarSesion();

    expect(credencialesEnviadas?.password).toBe(password);
  });

  it('acepta exactamente 20 caracteres antes de enviar', () => {
    component.credenciales.email = 'cliente@ejemplo.com';
    component.credenciales.password = 'c'.repeat(20);

    component.iniciarSesion();

    expect(component.errorPassword()).toBe('');
    expect(credencialesEnviadas?.password).toHaveLength(20);
  });
});
