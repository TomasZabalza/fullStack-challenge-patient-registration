import { TestBed } from '@angular/core/testing';
import { PatientCardComponent } from './patient-card.component';

describe('PatientCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientCardComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PatientCardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
