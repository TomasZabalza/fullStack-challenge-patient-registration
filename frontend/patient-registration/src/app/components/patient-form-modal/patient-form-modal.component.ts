import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-patient-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-form-modal.component.html',
  styleUrls: ['./patient-form-modal.component.scss'],
})
export class PatientFormModalComponent {
  @Input() visible = false;
  @Input() form!: FormGroup;
  @Input() submitting = false;
  @Input() submitted = false;
  @Input() statusState: 'idle' | 'success' | 'error' = 'idle';
  @Input() statusMessage = '';
  @Input() isDragging = false;

  @Output() closed = new EventEmitter<void>();
  @Output() formSubmit = new EventEmitter<void>();
  @Output() fileSelect = new EventEmitter<File | null>();
  @Output() dragOverEvent = new EventEmitter<DragEvent>();
  @Output() dragLeaveEvent = new EventEmitter<DragEvent>();
  @Output() fileDrop = new EventEmitter<DragEvent>();

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    this.fileSelect.emit(file);
  }
}
