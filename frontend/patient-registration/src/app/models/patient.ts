export type OutboxChannel = "EMAIL" | "SMS";
export type OutboxStatus = "PENDING" | "SENT" | "FAILED";

export interface PatientResponse {
  data: Patient[];
}

export interface Patient {
  id: string;
  fullName: string;
  email: string;
  phone: {
    countryCode: string;
    number: string;
  };
  documentPhotoUrl: string;
  createdAt: string;
  updatedAt: string;
}
