const jwt = require("jsonwebtoken");

const MemberAcademy = require("../models/MemberAcademy.model");
const Coach = require("../models/MemberCoach.model");
const MemberDistrict = require("../models/MemberDistrict.model");
const MemberPlayer = require("../models/MemberPlayer.model");

/**
 * AUTH MIDDLEWARE
 */
const authenticateDB = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { id, type } = decoded;

    if (!id || !type) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload.",
      });
    }

    let Model;

    switch (type) {
      case "Player":
        Model = MemberPlayer;
        break;
      case "Coach":
        Model = Coach;
        break;
      case "Academy":
        Model = MemberAcademy;
        break;
      case "District":
        Model = MemberDistrict;
        break;
      default:
        return res.status(401).json({
          success: false,
          message: "Invalid user type in token.",
        });
    }

    const user = await Model.findById(id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    req.user = user.toObject();
    req.user.type = type;

    next();
  } catch (error) {
    console.error("Auth error:", error);

    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

/**
 * ADMIN MIDDLEWARE (FIXED)
 */
const isAdmin = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const email = decoded.email;
    const password = decoded.password;

    if (
      email !== process.env.ADMIN_LOGIN_USERNAME ||
      password !== process.env.ADMIN_LOGIN_PASSWORD
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Not an admin",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid token",
    });
  }
};

module.exports = {
  authenticateDB,
  isAdmin,
};