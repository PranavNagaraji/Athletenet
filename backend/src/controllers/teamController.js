import mongoose from "mongoose";
import Team from "../models/Team.js";
import Club from "../models/Club.js";
import Athlete from "../models/Athlete.js";
import Coach from "../models/Coach.js";

export const createTeam = async (req, res) => {
    try {
        const { name } = req.body;
        const club = await Club.findOne({ admin: req.user._id });
        if (!club) return res.status(404).json({ message: "Club not found" });
        const team = await Team.create({ name, club: club._id }); // Fix: store club._id, not req.user._id
        res.status(201).json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addAthleteToTeam = async (req, res) => {
    try {
        const { teamId, athleteId, athleteIds } = req.body;
        const ids = Array.isArray(athleteIds) ? athleteIds : athleteId ? [athleteId] : [];
        if (!ids.length)
            return res.status(400).json({ message: "No athlete IDs provided" });
        const team = await Team.findById(teamId);
        if (!team)
            return res.status(404).json({ message: "Team not found" });

        const added = [];
        for (const id of ids) {
            if (team.athletes.includes(id)) continue;
            const athlete = await Athlete.findOne({ user: id });
            if (!athlete)
                return res.status(404).json({ message: `Athlete not found: ${id}` });
            team.athletes.push(id);
            added.push(id);
        }

        if (!added.length)
            return res.status(400).json({ message: "Selected athletes are already in the team" });

        await team.save();
        res.status(200).json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteAthleteFromTeam = async (req, res) => {
    try {
        const { teamId, athleteId } = req.body;
        const team = await Team.findById(teamId);
        if (!team)
            return res.status(404).json({ message: "Team not found" });
        if (!team.athletes.includes(athleteId))
            return res.status(400).json({ message: "Athlete not in team" });
        team.athletes.pull(athleteId);
        await team.save();
        res.status(200).json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const updateTeamName = async (req, res) => {
    try {
        const teamId = req.params.id;
        const { name } = req.body;
        const team = await Team.findById(teamId);
        if (!team)
            return res.status(404).json({ message: "Team not found" });
        team.name = name;
        await team.save();
        res.status(200).json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const addCoachToTeam = async (req, res) => {
    try {
        const { teamId, coachId, coachIds } = req.body;
        const ids = Array.isArray(coachIds) ? coachIds : coachId ? [coachId] : [];
        if (!ids.length)
            return res.status(400).json({ message: "No coach IDs provided" });
        const team = await Team.findById(teamId);
        if (!team)
            return res.status(404).json({ message: "Team not found" });

        const added = [];
        for (const id of ids) {
            if (team.coaches.includes(id)) continue;
            const coach = await Coach.findOne({ user: id });
            if (!coach)
                return res.status(404).json({ message: `Coach not found: ${id}` });
            team.coaches.push(id);
            added.push(id);
        }

        if (!added.length)
            return res.status(400).json({ message: "Selected coaches are already in the team" });

        await team.save();
        res.status(200).json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteCoachFromTeam = async (req, res) => {
    try {
        const { teamId, coachId } = req.body;
        const team = await Team.findById(teamId);
        if (!team)
            return res.status(404).json({ message: "Team not found" });
        if (!team.coaches.includes(coachId))
            return res.status(400).json({ message: "Coach not in team" });
        team.coaches.pull(coachId);
        await team.save();
        res.status(200).json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getAllTeamsByClub = async (req, res) => {
    try {
        const id = req.params.clubId;
        const club = await Club.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { admin: mongoose.Types.ObjectId.isValid(id) ? id : null }] });
        if (!club) return res.status(404).json({ message: "Club not found" });
        const teams = await Team.find({ club: club._id })
            .populate("athletes", "name profilePic")
            .populate("coaches", "name profilePic")
            .sort({ updatedAt: -1, createdAt: -1 });
        res.status(200).json(teams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getTeamById = async (req, res) => {
    try {
        const teamId = req.params.id;
        const team = await Team.findById(teamId);
        if (!team)
            return res.status(404).json({ message: "Team not found" });
        res.status(200).json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteTeamById = async (req, res) => {
    try {
        const teamId = req.params.id;
        const team = await Team.findByIdAndDelete(teamId);
        if (!team)
            return res.status(404).json({ message: "Team not found" });
        res.status(200).json({ message: "Team deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const joinTeamAsAthlete = async (req, res) => {
    try {
        const { teamId } = req.body;
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        const athlete = await Athlete.findOne({ user: req.user._id });
        if (!athlete) return res.status(404).json({ message: "Athlete not found" });

        if (!athlete.clubs.includes(team.club)) {
            return res.status(403).json({ message: "You must be a member of the club to join its teams" });
        }

        if (team.athletes.includes(req.user._id)) {
            return res.status(400).json({ message: "You are already in this team" });
        }

        team.athletes.push(req.user._id);
        await team.save();
        res.status(200).json({ message: "Successfully joined team", team });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const joinTeamAsCoach = async (req, res) => {
    try {
        const { teamId } = req.body;
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        const coach = await Coach.findOne({ user: req.user._id });
        if (!coach) return res.status(404).json({ message: "Coach not found" });

        // Ensure coach is part of the club that owns the team
        if (!coach.clubs.includes(team.club)) {
            return res.status(403).json({ message: "You must be a member of the club to coach its teams" });
        }

        if (team.coaches.includes(req.user._id)) {
            return res.status(400).json({ message: "You are already a coach for this team" });
        }

        team.coaches.push(req.user._id);
        await team.save();
        res.status(200).json({ message: "Successfully joined team as coach", team });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
