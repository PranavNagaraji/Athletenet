import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getGroupMessages, getDirectMessages, getTeamMessages, getTournamentMessages } from "../controllers/chatController.js";

const router = express.Router();

router.get("/club/:clubId", protect, getGroupMessages);
router.get("/team/:teamId", protect, getTeamMessages);
router.get("/tournament/:tournamentId", protect, getTournamentMessages);
router.get("/direct/:otherUserId", protect, getDirectMessages);

export default router;
