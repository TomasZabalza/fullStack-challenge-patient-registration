import fs from "fs/promises";
import path from "path";
import multer from "multer";
import { documentPhotoFileFilter } from "../validators/uploadValidators";

export const uploadsRoot = path.join(process.cwd(), "uploads", "documents");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdir(uploadsRoot, { recursive: true })
      .then(() => cb(null, uploadsRoot))
      .catch((error: unknown) => cb(error as Error, uploadsRoot));
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path
      .extname(file.originalname)
      .toLowerCase()}`;
    cb(null, unique);
  },
});

export const upload = multer({
  storage,
  fileFilter: documentPhotoFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const cleanupUploadedFile = async (filePath?: string) => {
  if (!filePath) {
    return;
  }
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore cleanup errors
  }
};

export const toStoredDocumentPath = (absolutePath: string) =>
  path.posix.join("uploads", "documents", path.basename(absolutePath));

export const buildDocumentPhotoUrl = (documentPhotoPath: string) =>
  `/uploads/documents/${path.basename(documentPhotoPath.replace(/\\/g, "/"))}`;
