import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Patient } from '../../models/patient';
import { PatientCardComponent } from '../patient-card/patient-card.component';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, PatientCardComponent],
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss'],
})
export class PatientListComponent {
  @Input() patients: Patient[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() expandedId: string | null = null;

  @Output() listRetry = new EventEmitter<void>();
  @Output() cardToggle = new EventEmitter<string>();

  trackById(_index: number, item: Patient): string {
    return item.id;
  }
}
