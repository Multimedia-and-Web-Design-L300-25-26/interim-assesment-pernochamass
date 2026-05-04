import express from "express";
import {
  getAllCrypto,
  getGainers,
  getNew,
  addCrypto,
} from "../controllers/cryptoController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// GET /api/crypto — all tradable cryptocurrencies
router.get("/", getAllCrypto);

// GET /api/crypto/gainers — sorted by 24h change descending
router.get("/gainers", getGainers);

// GET /api/crypto/new — sorted by createdAt descending (newest first)
router.get("/new", getNew);

// POST /api/crypto — add a new crypto (requires auth)
router.post("/", authMiddleware, addCrypto);

export default router;
