import fs from "fs";
import path from "path";
import multer from "multer";

const mode = process.env.STORAGE_MODE || "local";
const uploadDir = process.env.UPLOAD_DIR || "uploads";

function ensureDir() {
  const full = path.join(process.cwd(), uploadDir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
}

export function getMulterUploader() {
  if (mode === "local") {
    ensureDir();

    const storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, path.join(process.cwd(), uploadDir)),
      filename: (req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        cb(null, `${Date.now()}_${safe}`);
      },
    });

    return multer({
      storage,
      limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== "application/pdf") return cb(new Error("Only PDF allowed"));
        cb(null, true);
      },
    });
  }

  // If you want S3 uploads, easiest is multer-s3 (AWS SDK v2)
  // But you're already using AWS SDK v3 - so for production, prefer presigned upload method.
  // For now, keep local mode. If you want S3, tell me and I'll give presigned upload flow.
  throw new Error("STORAGE_MODE=s3 needs presigned upload flow (recommended).");
}

export function buildFileUrlLocal(filename) {
  // served from /static/uploads
  return `/static/uploads/${filename}`;
}
