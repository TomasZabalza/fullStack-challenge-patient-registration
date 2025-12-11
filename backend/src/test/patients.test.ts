import fs from "fs";
import path from "path";
import request from "supertest";
jest.mock("../lib/prisma", () => require("../__mocks__/prisma").default);

import app from "../app";
import prisma from "../lib/prisma";

const prismaMock = prisma as unknown as typeof import("../__mocks__/prisma").default;

describe("patients routes", () => {
  const uploadsDir = path.join(process.cwd(), "uploads", "documents");
  const sampleFile = path.join(uploadsDir, "sample.jpg");

  beforeAll(() => {
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(sampleFile, "fake image content");
  });

  afterAll(() => {
    if (fs.existsSync(sampleFile)) {
      fs.unlinkSync(sampleFile);
    }
  });

  beforeEach(() => {
    prismaMock.__helpers.reset();
  });

  it("returns health ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("lists patients", async () => {
    const res = await request(app).get("/patients");
    expect(res.status).toBe(200);
    expect(res.body.data[0].id).toBe(prismaMock.__helpers.mockPatient.id);
  });

  it("rejects when document photo is missing", async () => {
    const res = await request(app).post("/patients").field("fullName", "Jane Doe");
    expect(res.status).toBe(400);
    expect(res.body.errors[0].path).toBe("documentPhoto");
  });

  it("handles duplicate email conflict", async () => {
    (prismaMock.$transaction as jest.Mock).mockImplementationOnce(async () => {
      throw prismaMock.__helpers.createKnownRequestError("P2002");
    });

    const res = await request(app)
      .post("/patients")
      .field("fullName", "Jane Doe")
      .field("email", "jane.doe@gmail.com")
      .field("phoneCountryCode", "+598")
      .field("phoneNumber", "99695828")
      .attach("documentPhoto", sampleFile);

    expect(res.status).toBe(409);
    expect(res.body.errors[0].path).toBe("email");
  });

  it("creates patient and enqueues outbox email", async () => {
    const res = await request(app)
      .post("/patients")
      .field("fullName", "Jane Doe")
      .field("email", "jane.doe@gmail.com")
      .field("phoneCountryCode", "+598")
      .field("phoneNumber", "99695828")
      .attach("documentPhoto", sampleFile);

    expect(res.status).toBe(201);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });
});

