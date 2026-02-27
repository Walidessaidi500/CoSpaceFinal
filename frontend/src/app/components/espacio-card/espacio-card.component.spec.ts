import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EspacioCard } from './espacio-card';

describe('EspacioCard', () => {
  let component: EspacioCard;
  let fixture: ComponentFixture<EspacioCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspacioCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EspacioCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
