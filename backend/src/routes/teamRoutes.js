import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
    createTeam,
    addAthleteToTeam,
    deleteAthleteFromTeam,
    addCoachToTeam,
    deleteCoachFromTeam,
    updateTeamName,
    getAllTeamsByClub,
    getTeamById,
    deleteTeamById,
    joinTeamAsAthlete,
    joinTeamAsCoach
} from "../controllers/teamController.js";

const router = express.Router();

// Static routes FIRST (before parameterized routes)
router.post("/create", protect, authorize("club"), createTeam);
router.post("/athlete", protect, authorize("club"), addAthleteToTeam);
router.delete("/athlete", protect, authorize("club"), deleteAthleteFromTeam);
router.post("/coach", protect, authorize("club"), addCoachToTeam);
router.delete("/coach", protect, authorize("club"), deleteCoachFromTeam);
router.post("/join", protect, authorize("athlete"), joinTeamAsAthlete);
router.post("/join/coach", protect, authorize("coach"), joinTeamAsCoach);
router.get("/club/:clubId", getAllTeamsByClub);

// Parameterized routes LAST (to avoid catching static routes)
router.put("/:id", protect, authorize("club"), updateTeamName);
router.get("/:id", getTeamById);
router.delete("/:id", protect, authorize("club"), deleteTeamById);

export default router;