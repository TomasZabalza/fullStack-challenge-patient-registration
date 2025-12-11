import express, { Request, Response } from "express";
import { validationResult } from "express-validator";
import {
  CreatePatientInput,
  DuplicateEmailError,
  createPatient,
  listPatients,
} from "../services/patientService";
import {
  cleanupUploadedFile,
  upload,
} from "../utils/uploads";
import { patientValidators } from "../validators/patientValidators";

const router = express.Router();

router.get("/", async (_req: Request, res: Response) => {
  const patients = await listPatients();
  res.json({ data: patients });
});

router.post(
  "/",
  upload.single("documentPhoto"),
  patientValidators,
  async (req: Request, res: Response) => {
    const bodyInput = req.body as Partial<CreatePatientInput>;
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
      const patient = await createPatient(
        {
          fullName: bodyInput.fullName ?? "",
          email: bodyInput.email ?? "",
          phoneCountryCode: bodyInput.phoneCountryCode ?? "",
          phoneNumber: bodyInput.phoneNumber ?? "",
        },
        req.file.path
      );

      res.status(201).json({ data: patient });
    } catch (error: unknown) {
      await cleanupUploadedFile(req.file.path);

      if (error instanceof DuplicateEmailError) {
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
