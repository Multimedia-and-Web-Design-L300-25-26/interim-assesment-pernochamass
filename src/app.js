import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import cryptoRoutes from "./routes/cryptoRoutes.js";

dotenv.config();

const app = express();

/* ── CORS ── */
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim());

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like curl, postman)
            if (!origin) return callback(null, true);

            // If '*' is specified in env, allow ALL origins dynamically
            if (allowedOrigins.includes("*")) {
                return callback(null, true);
            }

            // Otherwise, check for exact match
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS: origin ${origin} not allowed`));
            }
        },
        credentials: true, // needed to send or receive HTTP-only cookies
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
