import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroGoogle } from './registro-google';

describe('RegistroGoogle', () => {
  let component: RegistroGoogle;
  let fixture: ComponentFixture<RegistroGoogle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroGoogle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroGoogle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
