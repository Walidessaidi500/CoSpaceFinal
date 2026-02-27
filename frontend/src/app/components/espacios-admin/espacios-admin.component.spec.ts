import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EspaciosAdminComponent } from './espacios-admin.component';

describe('EspaciosAdminComponent', () => {
    let component: EspaciosAdminComponent;
    let fixture: ComponentFixture<EspaciosAdminComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EspaciosAdminComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(EspaciosAdminComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
