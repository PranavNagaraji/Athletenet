import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
    getMyProfile,
    updateMyProfile,
    getNearbyClubs,
    getMyJoinRequests,
    getAllAthletes
} from "../controllers/athleteController.js";
import {
    getAthleteCoachEvents,
    getAthletePerformanceRatings,
} from "../controllers/coachToolsController.js";

const router = express.Router();

router.get("/me", protect, authorize("athlete"), getMyProfile);
router.put("/me", protect, authorize("athlete"), updateMyProfile);
router.get("/nearby-clubs", protect, authorize("athlete"), getNearbyClubs); // Add Geo Based Code
router.get("/join-requests", protect, authorize("athlete"), getMyJoinRequests);
router.get("/events", protect, authorize("athlete"), getAthleteCoachEvents);
router.get("/performance", protect, authorize("athlete"), getAthletePerformanceRatings);
router.get("/all", getAllAthletes);

export default router;
