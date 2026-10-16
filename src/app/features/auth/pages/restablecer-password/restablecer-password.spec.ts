import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RestablecerPassword } from './restablecer-password';

describe('RestablecerPassword', () => {
  let component: RestablecerPassword;
  let fixture: ComponentFixture<RestablecerPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestablecerPassword],
      providers: [provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestablecerPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
