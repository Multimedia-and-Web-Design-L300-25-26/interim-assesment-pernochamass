import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";

const TEST_DB =
  process.env.MONGO_URI_TEST ||
  (process.env.MONGO_URI
    ? process.env.MONGO_URI.replace(/\/[^/?]+(\?|$)/, "/coinbase-test$1")
    : null);

let authCookie = "";
let authToken = "";

beforeAll(async () => {
  if (!TEST_DB) {
    console.warn("No MONGO_URI set — skipping DB tests");
    return;
  }
  await mongoose.connect(TEST_DB);

  // Register + login a test user
  await request(app).post("/api/auth/register").send({
    name: "Crypto Tester",
    email: "cryptotest@example.com",
    password: "password123",
  });

  const loginRes = await request(app).post("/api/auth/login").send({
    email: "cryptotest@example.com",
    password: "password123",
  });

  authCookie = loginRes.headers["set-cookie"]?.[0] || "";
  authToken = loginRes.body.token || "";
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

describe("Crypto — GET /api/crypto", () => {
  it("→ 200 with empty array when no coins exist", async () => {
    const res = await request(app).get("/api/crypto");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("Crypto — POST /api/crypto", () => {
  it("→ 401 when unauthenticated", async () => {
    const res = await request(app).post("/api/crypto").send({
      name: "Bitcoin",
      symbol: "BTC",
      price: 50000,
      change24h: 2.5,
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("→ 201 when authenticated with valid data (cookie)", async () => {
    if (!TEST_DB || !authCookie) return;
    const res = await request(app)
      .post("/api/crypto")
      .set("Cookie", authCookie)
      .send({
        name: "Bitcoin",
        symbol: "BTC",
        price: 50000,
        image: "https://example.com/btc.png",
        change24h: 2.5,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("symbol", "BTC");
  });

  it("→ 201 when authenticated via Bearer token", async () => {
    if (!TEST_DB || !authToken) return;
    const res = await request(app)
      .post("/api/crypto")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Ethereum",
        symbol: "ETH",
        price: 3000,
        change24h: -1.2,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("symbol", "ETH");
  });

  it("→ 409 on duplicate symbol", async () => {
    if (!TEST_DB || !authCookie) return;
    const res = await request(app)
      .post("/api/crypto")
      .set("Cookie", authCookie)
      .send({
        name: "Bitcoin Copy",
        symbol: "BTC",
        price: 48000,
        change24h: 1.0,
      });
    expect(res.statusCode).toBe(409);
  });

  it("→ 400 when required fields missing", async () => {
    if (!TEST_DB || !authCookie) return;
    const res = await request(app)
      .post("/api/crypto")
      .set("Cookie", authCookie)
      .send({ name: "NoSymbol" });
    expect(res.statusCode).toBe(400);
  });
});

describe("Crypto — GET /api/crypto/gainers", () => {
  it("→ 200 sorted by change24h descending", async () => {
    if (!TEST_DB) return;
    const res = await request(app).get("/api/crypto/gainers");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const coins = res.body.data;
    for (let i = 0; i < coins.length - 1; i++) {
      expect(coins[i].change24h).toBeGreaterThanOrEqual(coins[i + 1].change24h);
    }
  });
});

describe("Crypto — GET /api/crypto/new", () => {
  it("→ 200 sorted by createdAt descending (newest first)", async () => {
    if (!TEST_DB) return;
    const res = await request(app).get("/api/crypto/new");
    expect(res.statusCode).toBe(200);
    const coins = res.body.data;
    for (let i = 0; i < coins.length - 1; i++) {
      expect(new Date(coins[i].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(coins[i + 1].createdAt).getTime()
      );
    }
  });
});
