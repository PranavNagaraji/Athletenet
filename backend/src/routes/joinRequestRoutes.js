import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
    createJoinRequest,
    getAthleteJoinRequests,
    getCoachJoinRequests,
    getAllJoinRequests,
    acceptJoinRequest,
    rejectJoinRequest
} from "../controllers/joinRequestController.js";

const router = express.Router();

router.post("/request", protect, authorize("athlete", "coach"), createJoinRequest);
router.get("/athlete-requests", protect, authorize("club"), getAthleteJoinRequests);
router.get("/coach-requests", protect, authorize("club"), getCoachJoinRequests);
router.get("/all-requests", protect, authorize("club"), getAllJoinRequests);
router.put("/accept/:id", protect, authorize("club"), acceptJoinRequest);
router.put("/reject/:id", protect, authorize("club"), rejectJoinRequest);

export default router;