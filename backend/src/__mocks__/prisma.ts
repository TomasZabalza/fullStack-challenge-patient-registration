import { Prisma } from "../generated/prisma/client";

const mockPatient = {
  id: "patient-1",
  fullName: "Jane Doe",
  email: "jane.doe@gmail.com",
  phoneCountryCode: "+1",
  phoneNumber: "5551234567",
  documentPhotoPath: "uploads/documents/mock.jpg",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const createKnownRequestError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("mock error", {
    code,
    clientVersion: "mock",
  });

const prisma: any = {
  patient: {
    findMany: jest.fn().mockResolvedValue([mockPatient]),
    create: jest.fn().mockResolvedValue(mockPatient),
  },
  outbox: {
    create: jest.fn().mockResolvedValue(undefined),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue(undefined),
  },
  $transaction: jest.fn(async (fn: (tx: any) => unknown) => fn(prisma)),
  __helpers: {
    createKnownRequestError,
    reset: () => {
      prisma.patient.findMany.mockResolvedValue([mockPatient]);
      prisma.patient.create.mockResolvedValue(mockPatient);
      prisma.outbox.create.mockResolvedValue(undefined);
      prisma.outbox.findMany.mockResolvedValue([]);
      prisma.outbox.update.mockResolvedValue(undefined);
    },
    mockPatient,
  },
};

export default prisma as unknown as typeof import("../lib/prisma").default & {
  __helpers: typeof prisma.__helpers;
};
