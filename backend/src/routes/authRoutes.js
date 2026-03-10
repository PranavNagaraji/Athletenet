import express from "express";
import { loginUser, signupUser, logoutUser } from "../controllers/authController.js";
import { checkCookie } from "../utils/token.js";

const router = express.Router();

router.post("/login", checkCookie, loginUser);
router.post("/signup", signupUser);
router.post("/logout", logoutUser);

export default router;