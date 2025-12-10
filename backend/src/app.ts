import cors from "cors";
import express, { ErrorRequestHandler, Request, Response } from "express";
import path from "path";
import { MulterError } from "multer";
import patientsRouter from "./routes/patients";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/patients", patientsRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof MulterError) {
    return res.status(400).json({
      errors: [
        {
          type: "field",
          msg: "Document photo must be a .jpg image under 5MB",
          path: "documentPhoto",
          location: "body",
        },
      ],
    });
  }

  if (err) {
    console.error("Unhandled error", err);
  }
  return res.status(500).json({ message: "Internal server error" });
};

app.use(errorHandler);

export default app;
