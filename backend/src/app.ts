import cors from "cors";
import express, { Request, Response } from "express";

const app = express();

// Basic middleware for future routes
app.use(cors());
app.use(express.json());

// Simple health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

export default app;
