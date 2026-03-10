import express from "express";
import { getCurrentUser, loginUser, signupUser, logoutUser } from "../controllers/authController.js";
import { checkCookie } from "../utils/token.js";

const router = express.Router();

router.get("/me", checkCookie, getCurrentUser);
router.post("/login", loginUser);
router.post("/signup", signupUser);
router.post("/logout", logoutUser);

export default router;