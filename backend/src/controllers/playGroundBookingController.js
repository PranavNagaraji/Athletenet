import PlaygroundBooking from "../models/PlaygroundBooking.js";

export const createBooking = async (req, res) => {
    try {
        const { playground, startTime, endTime } = req.body;

        const booking = await PlaygroundBooking.create({
            playground,
            bookedBy: req.user._id,
            startTime,
            endTime
        });

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getMyBookings = async (req, res) => {
    try {
        const bookings = await PlaygroundBooking.find({
            bookedBy: req.user._id
        }).populate("playground");

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
            .populate("playground");

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const cancelBooking = async (req, res) => {
    try {
        const booking = await PlaygroundBooking.findById(req.params.id);

        if (!booking)
            return res.status(404).json({ message: "Booking not found" });

        if (booking.bookedBy.toString() !== req.user._id.toString())
            return res.status(403).json({ message: "Not authorized to cancel this booking" });

        booking.status = "cancelled";
        await booking.save();

        res.status(200).json({
            message: "Booking cancelled successfully",
            booking
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};