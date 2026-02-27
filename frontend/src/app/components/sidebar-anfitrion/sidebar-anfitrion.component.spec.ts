import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarAnfitrion } from './sidebar-anfitrion';

describe('SidebarAnfitrion', () => {
  let component: SidebarAnfitrion;
  let fixture: ComponentFixture<SidebarAnfitrion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarAnfitrion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarAnfitrion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
