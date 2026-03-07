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

const router = express.Router();

// middleware what to use??

router.post("/", createPlayground);
router.get("/nearby", getNearbyPlaygrounds);
router.get("/:id", getPlaygroundById);
router.put("/:id", updatePlayground);
router.delete("/:id", deletePlayground);
router.patch("/:id/booking", toggleBookingStatus);
router.patch("/:id/status", changePlaygroundStatus);

export default router;