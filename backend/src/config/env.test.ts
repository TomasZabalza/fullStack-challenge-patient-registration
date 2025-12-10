describe("env config", () => {
  const originalEnv = { ...process.env };

  const setEnv = (overrides: Record<string, string | undefined>) => {
    process.env = {
      ...originalEnv,
      DOTENV_CONFIG_DISABLE: "true",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/test",
      MAILTRAP_HOST: "smtp.mailtrap.io",
      MAILTRAP_PORT: "2525",
      MAILTRAP_USER: "user",
      MAILTRAP_PASS: "pass",
      MAIL_FROM: "Test <noreply@example.com>",
      ...overrides,
    };
  };

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it("exports parsed env values when required vars exist", async () => {
    setEnv({});
    const { env } = await import("./env");
    expect(env.databaseUrl).toContain("postgresql://");
    expect(env.mailtrap.host).toBe("smtp.mailtrap.io");
    expect(env.mailtrap.port).toBe(2525);
  });

  it("throws when a required env var is missing", async () => {
    setEnv({});
    delete process.env.DATABASE_URL;
    await expect(import("./env")).rejects.toThrow("DATABASE_URL");
  });
});
jest.mock("dotenv/config");
