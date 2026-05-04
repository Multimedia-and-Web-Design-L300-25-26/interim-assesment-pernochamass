import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";

// Use a separate test DB if provided, else append -test to the URI
const TEST_DB =
  process.env.MONGO_URI_TEST ||
  (process.env.MONGO_URI
    ? process.env.MONGO_URI.replace(/\/[^/?]+(\?|$)/, "/coinbase-test$1")
    : null);

beforeAll(async () => {
  if (!TEST_DB) {
    console.warn("No MONGO_URI set — skipping DB tests");
    return;
  }
  await mongoose.connect(TEST_DB);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    // Drop the test database to clean up
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

describe("Auth — Register", () => {
  it("POST /api/auth/register → 201 with valid data", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    if (!TEST_DB) return; // skip assertion when DB not available
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toHaveProperty("email", "test@example.com");
    // password must NOT be in response
    expect(res.body.user.password).toBeUndefined();
  });

  it("POST /api/auth/register → 409 on duplicate email", async () => {
    if (!TEST_DB) return;
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/auth/register → 400 when fields missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "no@example.com" });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/auth/register → 400 when password too short", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Short",
      email: "short@example.com",
      password: "abc",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("Auth — Login", () => {
  it("POST /api/auth/login → 200 with valid credentials", async () => {
    if (!TEST_DB) return;
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("token");
  });

  it("POST /api/auth/login → 401 with wrong password", async () => {
    if (!TEST_DB) return;
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "wrongpassword",
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/auth/login → 401 with unknown email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(401);
  });

  it("POST /api/auth/login → 400 when fields missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com" });
    expect(res.statusCode).toBe(400);
  });
});

describe("Auth — Profile", () => {
  let authCookie = "";

  beforeAll(async () => {
    if (!TEST_DB) return;
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });
    // Extract Set-Cookie header
    authCookie = res.headers["set-cookie"]?.[0] || "";
  });

  it("GET /api/auth/profile → 200 when authenticated via cookie", async () => {
    if (!TEST_DB || !authCookie) return;
    const res = await request(app)
      .get("/api/auth/profile")
      .set("Cookie", authCookie);
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("email", "test@example.com");
  });

  it("GET /api/auth/profile → 401 when not authenticated", async () => {
    const res = await request(app).get("/api/auth/profile");
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe("Auth — Logout", () => {
  it("POST /api/auth/logout → 200 and clears cookie", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
