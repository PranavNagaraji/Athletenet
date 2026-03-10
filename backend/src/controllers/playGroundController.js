import Club from "../models/Club.js";
import Playground from "../models/Playground.js";

export const createPlayground = async (req, res) => {
    try {
        const club = await Club.findOne({ admin: req.user._id });
        if (!club) return res.status(404).json({ message: "Club not found" });
        const playground = await Playground.create({
            ...req.body,
            club: club._id
        });
        res.status(201).json(playground);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getNearbyPlaygrounds = async (req, res) => {
    try {
        const { latitude, longitude, distance = 5000 } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                message: "Latitude and longitude are required"
            });
        }

        const playgrounds = await Playground.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseInt(distance) // meters
                }
            }
        });

        res.status(200).json(playgrounds);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getPlaygroundById = async (req, res) => {
    try {
        const playground = await Playground.findById(req.params.id)
            .populate("club");

        if (!playground)
            return res.status(404).json({ message: "Playground not found" });

        res.status(200).json(playground);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const updatePlayground = async (req, res) => {
    try {
        const playground = await Playground.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!playground)
            return res.status(404).json({ message: "Playground not found" });

        res.status(200).json(playground);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const deletePlayground = async (req, res) => {
    try {
        const playground = await Playground.findByIdAndDelete(req.params.id);

        if (!playground)
            return res.status(404).json({ message: "Playground not found" });

        res.status(200).json({ message: "Playground deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const toggleBookingStatus = async (req, res) => {
    try {
        const playground = await Playground.findById(req.params.id);

        if (!playground)
            return res.status(404).json({ message: "Playground not found" });

        playground.bookingEnabled = !playground.bookingEnabled;

        await playground.save();

        res.status(200).json({
            message: "Booking status updated",
            bookingEnabled: playground.bookingEnabled
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const changePlaygroundStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const playground = await Playground.findById(req.params.id);

        if (!playground)
            return res.status(404).json({ message: "Playground not found" });

        playground.status = status;

        await playground.save();

        res.status(200).json({
            message: "Playground status updated",
            status: playground.status
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};