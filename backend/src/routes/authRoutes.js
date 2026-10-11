const express = require("express");
const {
    register,
    login,
    getMe
} = require("../controllers/authController");

const {
    forgotPassword,
    resetPassword
} = require("../controllers/passwordResetController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticateToken, getMe);

module.exports = router;
