import User from "../models/User.js";
import Club from "../models/Club.js";
import Coach from "../models/Coach.js";
import Athlete from "../models/Athlete.js";

export const getClubProfile = async (req, res) => {
    try {
        const club = await Club.findOne({ admin: req.user._id });
        if (!club) return res.status(404).json({ message: "Club profile not found" });
        res.status(200).json(club);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const updateClubProfile = async (req, res) => {
    try {
        const club = await Club.findOneAndUpdate(
            { admin: req.user._id },
            req.body,
            {
                new: true,
                runValidators: true,
                upsert: true
            });

        if (!club) return res.status(404).json({ message: "Club profile not found" });
        res.status(200).json(club);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getAllClubs = async (req, res) => {
    try {
        const clubs = await Club.find();
        res.status(200).json(clubs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getClubById = async (req, res) => {
    try {
        const clubId = req.params.id;
        const club = await Club.findById(clubId);
        if (!club) return res.status(404).json({ message: "Club not found" });
        res.status(200).json(club);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getCoachesByClub = async (req, res) => {
    try {
        const clubId = req.params.id;
        const coaches = await Coach.find({ clubs: clubId }).populate("user");
        res.status(200).json(coaches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAthletesByClub = async (req, res) => {
    try {
        const clubId = req.params.id;
        const athletes = await Athlete.find({ clubs: clubId }).populate("user");
        res.status(200).json(athletes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const removeUserFromClub = async (req, res) => {
    try {
        const { userId, clubId } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        const club = await Club.findOne({ admin: clubId });
        if (!club) return res.status(404).json({ message: "Club not found" });
        if (user.role === "coach") {
            const coach = await Coach.findOne({ user: userId });
            if (!coach) return res.status(404).json({ message: "Coach not found" });
            if (!coach.clubs.includes(clubId)) return res.status(400).json({ message: "User is not a member of this club" });
            await Coach.updateOne({ user: userId }, { $pull: { clubs: clubId } });
        } else if (user.role === "athlete") {
            const athlete = await Athlete.findOne({ user: userId });
            if (!athlete) return res.status(404).json({ message: "Athlete not found" });
            if (!athlete.clubs.includes(clubId)) return res.status(400).json({ message: "User is not a member of this club" });
            await Athlete.updateOne({ user: userId }, { $pull: { clubs: clubId } });
        } else {
            return res.status(400).json({ message: "User role not supported" });
        }
        res.status(200).json({ message: "User removed from club successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};