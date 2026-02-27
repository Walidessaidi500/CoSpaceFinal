import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EspaciosDetalles } from './espacios-detalles';

describe('EspaciosDetalles', () => {
  let component: EspaciosDetalles;
  let fixture: ComponentFixture<EspaciosDetalles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspaciosDetalles]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EspaciosDetalles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
