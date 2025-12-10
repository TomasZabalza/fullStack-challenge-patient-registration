import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Patient, PatientResponse } from '../models/patient';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);

  listPatients(): Observable<Patient[]> {
    return this.http
      .get<PatientResponse>(`${environment.apiBase}/patients`)
      .pipe(map((res) => res.data.map((p) => this.withAbsolutePhoto(p))));
  }

  createPatient(payload: {
    fullName: string;
    email: string;
    phoneCountryCode: string;
    phoneNumber: string;
    documentPhoto: File;
  }): Observable<Patient> {
    const form = new FormData();
    form.append('fullName', payload.fullName);
    form.append('email', payload.email);
    form.append('phoneCountryCode', payload.phoneCountryCode);
    form.append('phoneNumber', payload.phoneNumber);
    form.append('documentPhoto', payload.documentPhoto);

    return this.http
      .post<{ data: Patient }>(`${environment.apiBase}/patients`, form)
      .pipe(map((res) => this.withAbsolutePhoto(res.data)));
  }

  private withAbsolutePhoto(patient: Patient): Patient {
    const isAbsolute = /^https?:\/\//i.test(patient.documentPhotoUrl);
    const photoUrl = isAbsolute
      ? patient.documentPhotoUrl
      : `${environment.apiBase}${patient.documentPhotoUrl.startsWith('/') ? '' : '/'}${patient.documentPhotoUrl}`;
    return { ...patient, documentPhotoUrl: photoUrl };
  }
}
