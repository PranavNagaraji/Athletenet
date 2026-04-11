import Coach from "../models/Coach.js";
import User from "../models/User.js";
import Club from "../models/Club.js";
import JoinRequest from "../models/JoinRequest.js";

export const getMyCoachProfile = async (req, res) => {
    try {
        const coach = await Coach.findOne({ user: req.user._id })
            .populate("user")
            .populate({
                path: "clubs",
                populate: { path: "admin", select: "name profilePic" }
            });

        if (!coach) {
            return res.status(404).json({
                message: "Coach profile not found"
            });
        }

        res.status(200).json(coach);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

export const updateMyCoachProfile = async (req, res) => {
    try {
        const coachData = req.body;
        const coach = await Coach.findOneAndUpdate(
            { user: req.user._id },
            coachData,
            {
                new: true,
                runValidators: true,
                upsert: true
            })
            .populate("user")
            .populate({
                path: "clubs",
                populate: { path: "admin", select: "name profilePic" }
            });
        if (!coach)
            return res.status(404).json({ message: "Coach profile not found" });
        res.status(200).json(coach);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getAllCoaches = async (req, res) => {
    try {
        const coaches = await Coach.find()
            .populate("user")
            .sort({ updatedAt: -1, createdAt: -1 });
        res.status(200).json(coaches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getMyJoinRequest = async (req, res) => {
    try {
        const coach = await Coach.findOne({ user: req.user._id });
        if (!coach)
            return res.status(404).json({ message: "Coach profile not found" });
        const joinRequests = await JoinRequest.find({ user: req.user._id })
            .sort({ createdAt: -1, updatedAt: -1 });
        res.status(200).json(joinRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
