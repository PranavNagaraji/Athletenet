import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
    createTournament,
    getMyTournaments,
    getAllTournaments,
    getParticipatingTournaments,
    getTournamentMembers,
    joinTournament,
    updateTournament,
    deleteTournament
} from "../controllers/tournamentController.js";

const router = express.Router();

router.get("/all", getAllTournaments);
router.get("/me", protect, authorize("club"), getMyTournaments);
router.get("/participating", protect, authorize("club"), getParticipatingTournaments);
router.get("/members/:id", protect, getTournamentMembers);
router.post("/create", protect, authorize("club"), createTournament);
router.post("/join", protect, joinTournament);
router.put("/:id", protect, authorize("club"), updateTournament);
router.delete("/:id", protect, authorize("club"), deleteTournament);

export default router;
