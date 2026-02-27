import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearEspacioPageComponent } from './crear-espacio-page';

describe('CrearEspacioPageComponent', () => {
  let component: CrearEspacioPageComponent;
  let fixture: ComponentFixture<CrearEspacioPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearEspacioPageComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CrearEspacioPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
