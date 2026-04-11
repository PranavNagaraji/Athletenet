import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
    getMyCoachProfile,
    updateMyCoachProfile,
    getAllCoaches,
    getMyJoinRequest,
} from "../controllers/coachController.js";
import {
    createCoachEvent,
    deleteCoachEvent,
    getCoachEvents,
    getCoachPerformanceRatings,
    getCoachTeamsForTools,
    savePerformanceRating,
    updateCoachEvent,
} from "../controllers/coachToolsController.js";

const router = express.Router();

router.get("/me", protect, authorize("coach"), getMyCoachProfile);
router.put("/me", protect, authorize("coach"), updateMyCoachProfile);
router.get("/all", getAllCoaches);
router.get("/join-request", protect, authorize("coach"), getMyJoinRequest);
router.get("/teams", protect, authorize("coach"), getCoachTeamsForTools);
router.get("/events", protect, authorize("coach"), getCoachEvents);
router.post("/events", protect, authorize("coach"), createCoachEvent);
router.put("/events/:id", protect, authorize("coach"), updateCoachEvent);
router.delete("/events/:id", protect, authorize("coach"), deleteCoachEvent);
router.get("/performance/ratings", protect, authorize("coach"), getCoachPerformanceRatings);
router.put("/performance/:athleteUserId", protect, authorize("coach"), savePerformanceRating);

export default router;
