import { TestBed } from '@angular/core/testing';
import { PatientListComponent } from './patient-list.component';

describe('PatientListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientListComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PatientListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
