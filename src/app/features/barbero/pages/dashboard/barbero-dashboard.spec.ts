import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BarberoDashboard } from './barbero-dashboard';

describe('BarberoDashboard', () => {
  let component: BarberoDashboard;
  let fixture: ComponentFixture<BarberoDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarberoDashboard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BarberoDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
