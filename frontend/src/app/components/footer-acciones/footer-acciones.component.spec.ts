import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterAcciones } from './footer-acciones';

describe('FooterAcciones', () => {
  let component: FooterAcciones;
  let fixture: ComponentFixture<FooterAcciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterAcciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterAcciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
