import Coach from "../models/Coach.js";
import Club from "../models/Club.js";
import Athlete from "../models/Athlete.js";
import JoinRequest from "../models/JoinRequest.js";
import jwt from "jsonwebtoken";

export const createJoinRequest = async (req, res) => {
    try {
        const { clubId } = req.body;
        const club = await Club.findOne({ admin: clubId });
        if (!club)
            return res.status(404).json({ message: "Club not found" });
        const token = req.cookies.token;
        if (!token)
            return res.status(401).json({ message: "Unauthorized" });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const role = decoded.role;
        if (role === 'athlete') {
            const athlete = await Athlete.findOne({ user: req.user._id });
            if (!athlete)
                return res.status(404).json({ message: "Athlete not found" });
            if (athlete.clubs.includes(club.admin))
                return res.status(400).json({ message: "You are already a member of this club" });
        } else if (role == 'coach') {
            const coach = await Coach.findOne({ user: req.user._id });
            if (!coach)
                return res.status(404).json({ message: "Coach not found" });
            if (coach.clubs.includes(club.admin))
                return res.status(400).json({ message: "You are already a member of this club" });
        }
        const existingRequest = await JoinRequest.findOne({ user: req.user._id, club: club.admin, status: "pending" });
        if (existingRequest) return res.status(400).json({ message: "You have already sent a join request to this club" });
        const joinRequest = await JoinRequest.create({ user: req.user._id, club: club.admin });
        res.status(200).json({ message: "Join request sent successfully", joinRequest });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getAllJoinRequests = async (req, res) => {
    try {
        const club = await Club.findOne({ admin: req.user._id });
        if (!club) return res.status(404).json({ message: "Club not found" });
        const joinRequests = await JoinRequest.find({ club: club.admin }).populate("user").populate("club");
        return res.status(200).json(joinRequests);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const getAthleteJoinRequests = async (req, res) => {
    try {
        const club = await Club.findOne({ admin: req.user._id });
        if (!club) return res.status(404).json({ message: "Club not found" });
        const joinRequests = await JoinRequest.find({ club: club.admin })
            .populate({
                path: "user",
                match: { role: "athlete" }
            }).populate("club");
        const athleteRequests = joinRequests.filter(req => req.user && req.user.role === "athlete")
        return res.status(200).json({ athleteRequests });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getCoachJoinRequests = async (req, res) => {
    try {
        const club = await Club.findOne({ admin: req.user._id });
        if (!club) return res.status(404).json({ message: "Club not found" });
        const joinRequests = await JoinRequest.find({ club: club.admin })
            .populate({
                path: "user",
                match: { role: "coach" }
            }).populate("club");
        const coachRequests = joinRequests.filter(req => req.user && req.user.role === "coach")
        return res.status(200).json({ coachRequests });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const acceptJoinRequest = async (req, res) => {
    try {
        const requestId = req.params.id;

        const joinRequest = await JoinRequest.findById(requestId).populate("user");
        if (!joinRequest) return res.status(404).json({ message: "Join request not found" });

        const club = await Club.findOne({ admin: joinRequest.club });
        if (!club) return res.status(404).json({ message: "Club not found" });

        if (joinRequest.status !== "pending")
            return res.status(400).json({ message: "Join request already handled" });

        const user = joinRequest.user;

        console.log(joinRequest);

        if (!user) return res.status(404).json({ message: "User not found" });
        if (!club) return res.status(404).json({ message: "Club not found" });

        if (user.role === "athlete") {
            const athlete = await Athlete.findOne({ user: user._id });
            if (!athlete) return res.status(404).json({ message: "Athlete not found" });

            if (!athlete.clubs.includes(club.admin)) {
                athlete.clubs.push(club.admin);
                await athlete.save();
            }

        } else if (user.role === "coach") {
            const coach = await Coach.findOne({ user: user._id });
            if (!coach) return res.status(404).json({ message: "Coach not found" });

            if (!coach.clubs.includes(club.admin)) {
                coach.clubs.push(club.admin);
                await coach.save();
            }
        }
        joinRequest.status = "accepted";
        await joinRequest.save();
        return res.status(200).json({ message: "Join request accepted" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const rejectJoinRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const joinRequest = await JoinRequest.findById(requestId);
        if (!joinRequest) return res.status(404).json({ message: "Join request not found" });
        if (joinRequest.status === "pending") {
            joinRequest.status = "rejected";
            await joinRequest.save();
            return res.status(200).json({ message: "Join request rejected" });
        } else {
            return res.status(400).json({ message: "Join request already handled" });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}