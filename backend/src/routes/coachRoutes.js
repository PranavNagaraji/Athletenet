import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
    getMyCoachProfile,
    updateMyCoachProfile,
    getAllCoaches,
    getMyJoinRequest,
} from "../controllers/coachController.js";

const router = express.Router();

router.get("/me", protect, authorize("coach"), getMyCoachProfile);
router.put("/me", protect, authorize("coach"), updateMyCoachProfile);
router.get("/all", getAllCoaches);
router.get("/join-request", protect, authorize("coach"), getMyJoinRequest);

export default router;