import { TestBed } from '@angular/core/testing';
import { PatientFormModalComponent } from './patient-form-modal.component';

describe('PatientFormModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientFormModalComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PatientFormModalComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
