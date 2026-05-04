import Crypto from "../models/Crypto.js";

/* ── GET /api/crypto — all coins (alphabetical by name) ── */
export const getAllCrypto = async (_req, res, next) => {
  try {
    const coins = await Crypto.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: coins.length, data: coins });
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/crypto/gainers — sorted by 24h change desc ── */
export const getGainers = async (_req, res, next) => {
  try {
    const coins = await Crypto.find().sort({ change24h: -1 });
    res.status(200).json({ success: true, count: coins.length, data: coins });
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/crypto/new — sorted by createdAt desc (newest first) ── */
export const getNew = async (_req, res, next) => {
  try {
    const coins = await Crypto.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coins.length, data: coins });
  } catch (err) {
    next(err);
  }
};

/* ── POST /api/crypto — add a new coin (protected) ── */
export const addCrypto = async (req, res, next) => {
  try {
    const { name, symbol, price, image, change24h } = req.body;

    // Validate required fields
    if (!name || !symbol || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: "name, symbol, and price are required.",
      });
    }

    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({
        success: false,
        message: "price must be a non-negative number.",
      });
    }

    const coin = await Crypto.create({
      name: name.trim(),
      symbol: symbol.toUpperCase().trim(),
      price,
      image: image?.trim() || "",
      change24h: change24h ?? 0,
    });

    res.status(201).json({
      success: true,
      message: "Cryptocurrency added successfully.",
      data: coin,
    });
  } catch (err) {
    // Duplicate symbol
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `A cryptocurrency with this symbol already exists.`,
      });
    }
    next(err);
  }
};
