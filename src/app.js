import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import cryptoRoutes from "./routes/cryptoRoutes.js";

dotenv.config();

const app = express();

/* ── CORS ── */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ── Body / Cookie parsers ── */
app.use(express.json());
app.use(cookieParser());

/* ── Routes ── */
app.use("/api/auth", authRoutes);
app.use("/api/crypto", cryptoRoutes);

/* ── Health check ── */
app.get("/health", (_req, res) => res.json({ status: "ok" }));

/* ── Global error handler ── */
app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "Internal server error"
      : err.message || "Internal server error";

  console.error(`[ERROR] ${err.message}`, err.stack);
  res.status(status).json({ success: false, message });
});

export default app;