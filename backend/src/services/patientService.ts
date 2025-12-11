import {
  OutboxChannel,
  Patient,
  Prisma,
} from "../generated/prisma/client";
import prisma from "../lib/prisma";
import {
  buildDocumentPhotoUrl,
  toStoredDocumentPath,
} from "../utils/uploads";

export type PatientResponse = {
  id: string;
  fullName: string;
  email: string;
  phone: {
    countryCode: string;
    number: string;
  };
  documentPhotoUrl: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePatientInput = {
  fullName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
};

export class DuplicateEmailError extends Error {
  constructor(message = "Email address already exists") {
    super(message);
    this.name = "DuplicateEmailError";
  }
}

const toResponse = (patient: Patient): PatientResponse => ({
  id: patient.id,
  fullName: patient.fullName,
  email: patient.email,
  phone: {
    countryCode: patient.phoneCountryCode,
    number: patient.phoneNumber,
  },
  documentPhotoUrl: buildDocumentPhotoUrl(patient.documentPhotoPath),
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt,
});

export const listPatients = async (): Promise<PatientResponse[]> => {
  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
  });

  return patients.map(toResponse);
};

export const createPatient = async (
  input: CreatePatientInput,
  documentPhotoPath: string
): Promise<PatientResponse> => {
  const storedPath = toStoredDocumentPath(documentPhotoPath);

  const confirmationSubject = "Patient registration confirmed";
  const confirmationBody = [
    `Hi ${input.fullName ?? ""},`,
    "",
    "We received your registration successfully.",
    "You will be notified if we need anything else.",
    "",
    "Thanks for trusting our clinic.",
  ].join("\n");

  try {
    const patient = await prisma.$transaction(async (tx) => {
      const created = await tx.patient.create({
        data: {
          fullName: input.fullName ?? "",
          email: (input.email ?? "").toLowerCase(),
          phoneCountryCode: input.phoneCountryCode ?? "",
          phoneNumber: input.phoneNumber ?? "",
          documentPhotoPath: storedPath,
        },
      });

      await tx.outbox.create({
        data: {
          patientId: created.id,
          channel: OutboxChannel.EMAIL,
          to: created.email,
          subject: confirmationSubject,
          body: confirmationBody,
        },
      });

      return created;
    });

    return toResponse(patient);
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new DuplicateEmailError();
    }

    throw error;
  }
};

