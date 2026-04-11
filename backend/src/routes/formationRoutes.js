import express from "express";
import { authorize, protect } from "../middleware/authMiddleware.js";
import {
  createFormation,
  deleteFormation,
  getFormationsByCoachId,
  getFormationsByTeam,
  getFormationById,
  updateFormation,
  addComment,
  getComments,
  deleteComment,
} from "../controllers/formationController.js";

const router = express.Router();

// Formation CRUD
router.post("/", protect, authorize("coach"), createFormation);
router.get("/team/:teamId", protect, getFormationsByTeam);
router.get("/:coachId", protect, getFormationsByCoachId);
router.get("/detail/:id", protect, getFormationById);
router.put("/:id", protect, authorize("coach"), updateFormation);
router.delete("/:id", protect, authorize("coach"), deleteFormation);

// Comments
router.post("/:id/comment", protect, addComment);
router.get("/:id/comments", protect, getComments);
router.delete("/:id/comment/:cId", protect, deleteComment);

export default router;
