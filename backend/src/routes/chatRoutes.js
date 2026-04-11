import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getGroupMessages, getDirectMessages, getTeamMessages, getTournamentMessages, togglePinMessage } from "../controllers/chatController.js";

const router = express.Router();

router.get("/club/:clubId", protect, getGroupMessages);
router.get("/team/:teamId", protect, getTeamMessages);
router.get("/tournament/:tournamentId", protect, getTournamentMessages);
router.get("/direct/:otherUserId", protect, getDirectMessages);
router.put("/message/:messageId/pin", protect, togglePinMessage);

export default router;
