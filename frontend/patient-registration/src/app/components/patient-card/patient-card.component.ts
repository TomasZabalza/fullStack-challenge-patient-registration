import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Patient } from '../../models/patient';

@Component({
  selector: 'app-patient-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-card.component.html',
  styleUrls: ['./patient-card.component.scss'],
})
export class PatientCardComponent {
  @Input() patient!: Patient;
  @Input() expanded = false;
  @Output() cardToggle = new EventEmitter<string>();

  onToggle(): void {
    this.cardToggle.emit(this.patient.id);
  }
}
