/* eslint-disable @typescript-eslint/unbound-method */
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Patient } from '../../models/patient';
import { PatientService } from '../../services/patient.service';
import { PatientListComponent } from '../../components/patient-list/patient-list.component';
import { PatientFormModalComponent } from '../../components/patient-form-modal/patient-form-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PatientListComponent, PatientFormModalComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  private readonly fb = new FormBuilder();
  private readonly patientService = inject(PatientService);

  patients = signal<Patient[]>([]);
  loading = signal<boolean>(true);
  listError = signal<string | null>(null);

  formVisible = signal<boolean>(false);
  submitting = signal<boolean>(false);
  submitted = signal<boolean>(false);
  statusState = signal<'idle' | 'success' | 'error'>('idle');
  statusMessage = signal<string>('');
  isDragging = signal<boolean>(false);
  expandedId = signal<string | null>(null);

  private gmailValidator = (control: { value: string | null }) => {
    const value = control.value?.toLowerCase() ?? '';
    if (!value.endsWith('@gmail.com')) {
      return { gmail: true };
    }
    return null;
  };

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/u)]],
    email: ['', [Validators.required, Validators.email, this.gmailValidator]],
    phoneCountryCode: ['+1', [Validators.required, Validators.pattern(/^\+\d{1,4}$/)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{6,15}$/)]],
    documentPhoto: [null as File | null, [Validators.required]],
  });

  readonly hasPatients = computed(() => this.patients().length > 0);

  constructor() {
    effect(() => {
      if (this.formVisible()) {
        this.statusState.set('idle');
        this.statusMessage.set('');
      }
    });
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading.set(true);
    this.listError.set(null);
    this.patientService.listPatients().subscribe({
      next: (data) => {
        this.patients.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.listError.set('Failed to load patients. Try again in a moment.');
        this.loading.set(false);
      },
    });
  }

  toggleExpand(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  openForm(): void {
    this.formVisible.set(true);
    this.submitted.set(false);
    this.form.reset({
      fullName: '',
      email: '',
      phoneCountryCode: '+1',
      phoneNumber: '',
      documentPhoto: null,
    });
    this.statusState.set('idle');
    this.statusMessage.set('');
  }

  closeForm(): void {
    this.formVisible.set(false);
  }

  handleFileInput(file: File | null): void {
    if (!file) {
      this.form.get('documentPhoto')?.setValue(null);
      this.form.get('documentPhoto')?.setErrors({ required: true });
      return;
    }

    const isJpeg =
      file.type === 'image/jpeg' ||
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg');

    if (!isJpeg) {
      this.form.get('documentPhoto')?.setErrors({ filetype: true });
      return;
    }

    this.form.get('documentPhoto')?.setValue(file);
    this.form.get('documentPhoto')?.setErrors(null);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.item(0);
    this.handleFileInput(file ?? null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.submitted.set(true);
    if (this.form.invalid) {
      return;
    }

    const file = this.form.value.documentPhoto as File;
    this.submitting.set(true);
    this.statusState.set('idle');
    this.statusMessage.set('');

    this.patientService
      .createPatient({
        fullName: this.form.value.fullName ?? '',
        email: (this.form.value.email ?? '').toLowerCase(),
        phoneCountryCode: this.form.value.phoneCountryCode ?? '',
        phoneNumber: this.form.value.phoneNumber ?? '',
        documentPhoto: file,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.statusState.set('success');
          this.statusMessage.set('Patient registered. Confirmation email will be sent shortly.');
          this.loadPatients();
          setTimeout(() => this.closeForm(), 900);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          const status = (err as { status?: number })?.status ?? 0;
          const emailConflict = status === 409;
          this.statusState.set('error');
          this.statusMessage.set(
            emailConflict ? 'Email already exists. Please use another Gmail.' : 'Failed to submit. Try again.'
          );
        },
      });
  }

  
}
