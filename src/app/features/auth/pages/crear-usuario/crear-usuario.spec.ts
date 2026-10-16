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
});
