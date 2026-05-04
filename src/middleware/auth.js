import jwt from "jsonwebtoken";

/**
 * Auth middleware — verifies JWT from:
 *   1. HTTP-only cookie: `token`
 *   2. Authorization header: `Bearer <token>`
 *
 * Attaches decoded payload to req.user and continues.
 * Returns 401 for missing/invalid/expired tokens.
 */
const authMiddleware = (req, res, next) => {
  try {
    // 1. Try cookie first (preferred)
    let token = req.cookies?.token;

    // 2. Fall back to Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated. Please log in." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, email, isAdmin, iat, exp }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Session expired. Please log in again." });
    }
    return res
      .status(401)
      .json({ success: false, message: "Invalid token. Please log in." });
  }
};

export default authMiddleware;
