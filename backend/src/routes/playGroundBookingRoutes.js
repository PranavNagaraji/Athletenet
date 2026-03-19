import express from "express";
import {
    createBooking,
    getMyBookings,
    getPlaygroundBookings,
    cancelBooking,
    getAvailableSlots,
    toggleBlockSlot
} from "../controllers/playGroundBookingController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/my-bookings", protect, getMyBookings);
router.get("/playground/:playgroundId", protect, getPlaygroundBookings);
router.get("/slots/:playgroundId", protect, getAvailableSlots);
router.post("/block", protect, toggleBlockSlot);
router.put("/cancel/:id", protect, cancelBooking);

export default router;