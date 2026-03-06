import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
    getClubProfile,
    updateClubProfile,
    getAllClubs,
    getClubById,
    getCoachesByClub,
    getAthletesByClub,
    removeUserFromClub
} from "../controllers/clubController.js";

const router = express.Router();

router.get("/profile", protect, authorize("club"), getClubProfile);
router.put("/profile", protect, authorize("club"), updateClubProfile);
router.get("/all", getAllClubs);
router.get("/:id", getClubById);
router.get("/coaches/:id", getCoachesByClub);
router.get("/athlete/:id", getAthletesByClub);
router.post("/remove-user", protect, authorize("club"), removeUserFromClub);

export default router;