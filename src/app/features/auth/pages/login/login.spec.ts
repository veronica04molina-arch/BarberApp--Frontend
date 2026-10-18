import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/services/AuthService';
import { LoginComponent } from './login';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let emailSolicitado: string | undefined;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
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
});
