import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiciosCliente } from './servicios';

describe('ServiciosCliente', () => {
  let component: ServiciosCliente;
  let fixture: ComponentFixture<ServiciosCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiciosCliente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiciosCliente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
