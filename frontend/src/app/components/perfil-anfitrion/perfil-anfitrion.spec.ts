import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilAnfitrion } from './perfil-anfitrion';

describe('PerfilAnfitrion', () => {
  let component: PerfilAnfitrion;
  let fixture: ComponentFixture<PerfilAnfitrion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilAnfitrion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerfilAnfitrion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
