import path from "path";
import type { Request } from "express";
import { MulterError } from "multer";
import type { FileFilterCallback } from "multer";

export const documentPhotoFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== ".jpg" || !file.mimetype.includes("jpeg")) {
    cb(new MulterError("LIMIT_UNEXPECTED_FILE", "documentPhoto"));
    return;
  }
  cb(null, true);
};
