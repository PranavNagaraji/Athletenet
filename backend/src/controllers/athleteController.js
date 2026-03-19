import Athlete from "../models/Athlete.js";
import Club from "../models/Club.js";
import JoinRequest from "../models/JoinRequest.js";

export const getMyProfile = async (req, res) => {
    try {
        const athlete = await Athlete.findOne({ user: req.user._id })
            .populate("user")
            .populate({
                path: "clubs",
                populate: { path: "admin", select: "name profilePic" }
            });
        if (!athlete)
            return res.status(404).json({ message: "Athlete not found" });
        return res.status(200).json(athlete);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const updateMyProfile = async (req, res) => {
    try {
        const updates = req.body;
        const athlete = await Athlete.findOneAndUpdate(
            { user: req.user._id },
            updates,
            {
                new: true,
                runValidators: true,
                upsert: true
            }
        ).populate({
            path: "clubs",
            populate: { path: "admin", select: "name profilePic" }
        });
        if (!athlete)
            return res.status(404).json({ message: "Athlete not found" });
        return res.status(200).json(athlete);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const getNearbyClubs = async (req, res) => {
    try {
        const clubs = await Club.find({}); //use geo filter here
        res.status(200).json(clubs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyJoinRequests = async (req, res) => {
    try {
        const athlete = await Athlete.findOne({ user: req.user._id });
        if (!athlete) return res.status(404).json({ message: "Athlete not found" });
        const joinRequests = await JoinRequest.find({ user: req.user._id });
        res.status(200).json(joinRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// export const getAthleteById = async (req, res) => {
//     try {
//         const athleteId = req.params.id; //decide if it is user_id or athlete id
//         const athlete = await Athlete.findById(athleteId).populate("user");
//         if (!athlete) return res.status(404).json({ message: "Athlete not found" });
//         res.status(200).json(athlete);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// }

export const getAllAthletes = async (req, res) => {
    try {
        const athletes = await Athlete.find().populate("user");
        res.status(200).json(athletes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}