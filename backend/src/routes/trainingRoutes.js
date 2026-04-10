import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  createSession,
  getCoachSessions,
  getSessionsByTeam,
  updateSession,
  deleteSession,
  markAttendance,
} from "../controllers/trainingController.js";

const router = express.Router();

router.post("/", protect, authorize("coach"), createSession);
router.get("/coach", protect, authorize("coach"), getCoachSessions);
router.get("/team/:teamId", protect, getSessionsByTeam);
router.put("/:id", protect, authorize("coach"), updateSession);
router.delete("/:id", protect, authorize("coach"), deleteSession);
router.put("/:id/attendance", protect, authorize("coach"), markAttendance);

export default router;
