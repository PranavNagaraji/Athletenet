import express from "express";
import {
    createCompetition,
    getMyCompetitions,
    getCompetitionById,
    updateCompetition,
    deleteCompetition
} from "../controllers/competitionController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("club"), createCompetition);
router.get("/", protect, authorize('club'), getMyCompetitions);
router.get("/:id", protect, authorize('club'), getCompetitionById);
router.put("/:id", protect, authorize("club"), updateCompetition);
router.delete("/:id", protect, authorize("club"), deleteCompetition);

export default router;