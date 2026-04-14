import mongoose from "mongoose";
import PlaygroundBooking from "../models/PlaygroundBooking.js";

export const createBooking = async (req, res) => {
    try {
        const { playground: pgId, startTime, endTime } = req.body;

        // check overlaps
        const existing = await PlaygroundBooking.findOne({
            playground: pgId,
            status: "booked",
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } },
                { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
            ]
        });

        if (existing) {
            return res.status(400).json({ message: "This slot is already booked." });
        }

        const booking = await PlaygroundBooking.create({
            playground: pgId,
            bookedBy: req.user.id,
            startTime,
            endTime
        });

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAvailableSlots = async (req, res) => {
    try {
        const { playgroundId } = req.params;
        const { date } = req.query; // YYYY-MM-DD
        
        const playground = await mongoose.model("Playground").findById(playgroundId);
        if (!playground) return res.status(404).json({ message: "Playground not found" });

        const openStr = playground.openTime || "06:00";
        const closeStr = playground.closeTime || "22:00";
        const duration = playground.slotDuration || 60;
        const custom = playground.customTimings || [];

        // Fetch bookings for this day
        const dayStart = new Date(`${date}T00:00:00Z`);
        const dayEnd = new Date(`${date}T23:59:59Z`);

        const allBookings = await PlaygroundBooking.find({
            playground: playgroundId,
            status: { $in: ["booked", "blocked", "available"] }, // Added "available" status for manual mode
            startTime: { $gte: dayStart, $lte: dayEnd }
        }).populate("bookedBy", "name email");

        const slots = [];
        const mode = playground.availabilityMode || "open";
        
        // Define operational windows
        const windows = custom.length > 0 
            ? custom.map(c => ({ start: new Date(`${date}T${c.start}:00Z`), end: new Date(`${date}T${c.end}:00Z`) }))
            : [{ start: new Date(`${date}T${openStr}:00Z`), end: new Date(`${date}T${closeStr}:00Z`) }];

        windows.forEach(window => {
            let current = window.start;
            while (current < window.end) {
                const slotEnd = new Date(current.getTime() + duration * 60000);
                if (slotEnd > window.end) break;

                const existing = allBookings.find(b => {
                    const bStart = new Date(b.startTime);
                    const bEnd = new Date(b.endTime);
                    return (current < bEnd && slotEnd > bStart);
                });

                let status = "available";
                if (mode === "manual") {
                    // In manual mode, it's ONLY available if explicitly marked 'available'
                    if (!existing || existing.status !== "available") {
                        status = existing ? existing.status : "hidden"; // Hidden means not provided yet
                    }
                } else {
                    // In open mode, it's available UNLESS blocked or booked
                    status = existing ? existing.status : "available";
                }

                slots.push({
                    time: `${current.getUTCHours().toString().padStart(2, '0')}:${current.getUTCMinutes().toString().padStart(2, '0')}`,
                    start: current.toISOString(),
                    end: slotEnd.toISOString(),
                    status: status,
                    bookedBy: existing ? existing.bookedBy : null
                });

                current = slotEnd;
            }
        });

        res.status(200).json(slots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyBookings = async (req, res) => {
    try {
        const bookings = await PlaygroundBooking.find({
            bookedBy: req.user.id
        })
            .populate("playground")
            .sort({ updatedAt: -1, createdAt: -1 });

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPlaygroundBookings = async (req, res) => {
    try {
        const bookings = await PlaygroundBooking.find({
            playground: req.params.playgroundId
        })
            .populate("bookedBy", "name email")
            .populate("playground")
            .sort({ updatedAt: -1, createdAt: -1 });

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const cancelBooking = async (req, res) => {
    try {
        const booking = await PlaygroundBooking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        if (booking.bookedBy.toString() !== req.user.id.toString())
            return res.status(403).json({ message: "Not authorized to cancel this booking" });

        booking.status = "cancelled";
        await booking.save();

        res.status(200).json({ message: "Booking cancelled successfully", booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleBlockSlot = async (req, res) => {
    try {
        const { playgroundId, startTime, endTime } = req.body;
        const start = new Date(startTime);
        const end = new Date(endTime);

        const existingBlock = await PlaygroundBooking.findOne({
            playground: playgroundId,
            startTime: start,
            endTime: end,
            status: "blocked"
        });

        if (existingBlock) {
            await PlaygroundBooking.findByIdAndDelete(existingBlock._id);
            return res.status(200).json({ message: "Slot unblocked" });
        }

        const overlaps = await PlaygroundBooking.findOne({
            playground: playgroundId,
            status: "booked",
            $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }]
        });

        if (overlaps) {
            return res.status(400).json({ message: "Cannot block a slot that is already booked by an athlete." });
        }

        await PlaygroundBooking.create({
            playground: playgroundId,
            bookedBy: req.user.id,
            startTime: start,
            endTime: end,
            status: "blocked"
        });

        res.status(201).json({ message: "Slot blocked" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
