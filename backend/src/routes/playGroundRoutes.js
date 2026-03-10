import express from "express";
import {
    createPlayground,
    getNearbyPlaygrounds,
    getPlaygroundById,
    updatePlayground,
    deletePlayground,
    toggleBookingStatus,
    changePlaygroundStatus
} from "../controllers/playGroundController.js";
import {protect, authorize} from "../middleware/authMiddleware.js"

const router = express.Router();

router.post("/", protect, authorize('club'), createPlayground);
router.get("/nearby", getNearbyPlaygrounds);
router.get("/:id", getPlaygroundById);
router.put("/:id", protect, authorize('club'), updatePlayground);
router.delete("/:id", protect, authorize('club'), deletePlayground);
router.patch("/:id/booking", protect, authorize('club'), toggleBookingStatus);
router.patch("/:id/status", protect, authorize('club'), changePlaygroundStatus);

export default router;