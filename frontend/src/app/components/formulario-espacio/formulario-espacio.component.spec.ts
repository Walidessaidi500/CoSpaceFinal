import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularioEspacio } from './formulario-espacio';

describe('FormularioEspacio', () => {
  let component: FormularioEspacio;
  let fixture: ComponentFixture<FormularioEspacio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioEspacio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormularioEspacio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
