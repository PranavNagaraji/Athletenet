import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
    createInvite,
    getMyInvites,
    acceptInvite,
    rejectInvite
} from "../controllers/inviteController.js";

const router = express.Router();

router.post("/send", protect, authorize("club"), createInvite);
router.get("/received", protect, authorize("athlete", "coach"), getMyInvites);
router.put("/accept/:id", protect, authorize("athlete", "coach"), acceptInvite);
router.put("/reject/:id", protect, authorize("athlete", "coach"), rejectInvite);

export default router;
