import fs from "fs/promises";
import path from "path";
import express, { Request, Response } from "express";
import multer, { MulterError } from "multer";
import { body, validationResult } from "express-validator";
import prisma from "../lib/prisma";
import { Patient, Prisma } from "../generated/prisma/client";

const router = express.Router();

const uploadsRoot = path.join(process.cwd(), "uploads", "documents");

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await fs.mkdir(uploadsRoot, { recursive: true });
      cb(null, uploadsRoot);
    } catch (error) {
      cb(error as Error, uploadsRoot);
    }
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".jpg" || !file.mimetype.includes("jpeg")) {
      cb(new MulterError("LIMIT_UNEXPECTED_FILE", "documentPhoto"));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const validators = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("Full name should contain letters and spaces only"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Email is invalid")
    .custom((value) => value.toLowerCase().endsWith("@gmail.com"))
    .withMessage("Email must be a @gmail.com address"),
  body("phoneCountryCode")
    .trim()
    .matches(/^\+\d{1,4}$/)
    .withMessage("Country code must start with + followed by digits"),
  body("phoneNumber")
    .trim()
    .matches(/^\d{6,15}$/)
    .withMessage("Phone number must contain between 6 and 15 digits"),
];

const toResponse = (patient: Patient) => ({
  id: patient.id,
  fullName: patient.fullName,
  email: patient.email,
  phone: {
    countryCode: patient.phoneCountryCode,
    number: patient.phoneNumber,
  },
  documentPhotoUrl: `/uploads/documents/${path.basename(
    patient.documentPhotoPath.replace(/\\/g, "/")
  )}`,
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt,
});

const cleanupUploadedFile = async (filePath?: string) => {
  if (!filePath) {
    return;
  }
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore cleanup errors
  }
};

router.get("/", async (_req: Request, res: Response) => {
  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json({ data: patients.map(toResponse) });
});

router.post(
  "/",
  upload.single("documentPhoto"),
  validators,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!req.file) {
      await cleanupUploadedFile(undefined);
      return res.status(400).json({
        errors: [
          {
            type: "field",
            msg: "Document photo is required and must be a .jpg image",
            path: "documentPhoto",
            location: "body",
          },
        ],
      });
    }

    if (!errors.isEmpty()) {
      await cleanupUploadedFile(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const storedPath = path.posix.join(
        "uploads",
        "documents",
        path.basename(req.file.path)
      );

      const confirmationSubject = "Patient registration confirmed";
      const confirmationBody = [
        `Hi ${req.body.fullName},`,
        "",
        "We received your registration successfully.",
        "You will be notified if we need anything else.",
        "",
        "Thanks for trusting our clinic.",
      ].join("\n");

      const patient = await prisma.$transaction(async (tx) => {
        const created = await tx.patient.create({
          data: {
            fullName: req.body.fullName,
            email: req.body.email.toLowerCase(),
            phoneCountryCode: req.body.phoneCountryCode,
            phoneNumber: req.body.phoneNumber,
            documentPhotoPath: storedPath,
          },
        });

        await tx.emailOutbox.create({
          data: {
            patientId: created.id,
            toEmail: created.email,
            subject: confirmationSubject,
            body: confirmationBody,
          },
        });

        return created;
      });

      res.status(201).json({ data: toResponse(patient) });
    } catch (error: unknown) {
      await cleanupUploadedFile(req.file.path);

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return res.status(409).json({
          errors: [
            {
              type: "field",
              msg: "Email address already exists",
              path: "email",
              location: "body",
            },
          ],
        });
      }

      console.error("Failed to create patient", error);
      return res.status(400).json({ message: "Failed to create patient" });
    }
  }
);

export default router;
