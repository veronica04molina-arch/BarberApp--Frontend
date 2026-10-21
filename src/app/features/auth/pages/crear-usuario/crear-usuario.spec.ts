import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CrearUsuario } from './crear-usuario';

describe('CrearUsuario', () => {
  let component: CrearUsuario;
  let fixture: ComponentFixture<CrearUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearUsuario],
      providers: [provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearUsuario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('conserva los espacios inicial y final de la contrasena', () => {
    const password = ' secreta ';
    component.registroForm.controls['password'].setValue(password);

    expect(component.registroForm.controls['password'].value).toBe(password);
  });

  it('acepta 20 caracteres y rechaza 21', () => {
    const password = component.registroForm.controls['password'];
    password.setValue('a'.repeat(20));
    expect(password.hasError('maxlength')).toBeFalsy();

    password.setValue('a'.repeat(21));
    expect(password.hasError('maxlength')).toBeTruthy();
  });
});
