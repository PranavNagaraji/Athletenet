import mongoose from "mongoose";
import Team from "../models/Team.js";
import Club from "../models/Club.js";
import Athlete from "../models/Athlete.js";
import Coach from "../models/Coach.js";

export const createTeam = async (req, res) => {
    try {
        const { name } = req.body;
        const club = await Club.findOne({ admin: req.user.id });
        if (!club) return res.status(404).json({ message: "Club not found" });
        const team = await Team.create({ name, club: club.id });
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
            // Try to find athlete by document ID first, then by user ID
            let athlete = await Athlete.findById(id);
            if (!athlete) {
                athlete = await Athlete.findOne({ user: id });
            }
            if (!athlete)
                return res.status(404).json({ message: `Athlete not found: ${id}` });
            // Store the user ID in team.athletes for consistency
            const userId = athlete.user;
            if (team.athletes.includes(userId)) continue;
            team.athletes.push(userId);
            added.push(userId);
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
        
        // Try to find athlete by document ID first, then by user ID
        let athlete = await Athlete.findById(athleteId);
        let userId = athleteId;
        if (athlete) {
            userId = athlete.user;
        }
        
        if (!team.athletes.includes(userId))
            return res.status(400).json({ message: "Athlete not in team" });
        team.athletes.pull(userId);
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
            // Try to find coach by document ID first, then by user ID
            let coach = await Coach.findById(id);
            if (!coach) {
                coach = await Coach.findOne({ user: id });
            }
            if (!coach)
                return res.status(404).json({ message: `Coach not found: ${id}` });
            // Store the user ID in team.coaches for consistency
            const userId = coach.user;
            if (team.coaches.includes(userId)) continue;
            team.coaches.push(userId);
            added.push(userId);
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
        
        // Try to find coach by document ID first, then by user ID
        let coach = await Coach.findById(coachId);
        let userId = coachId;
        if (coach) {
            userId = coach.user;
        }
        
        if (!team.coaches.includes(userId))
            return res.status(400).json({ message: "Coach not in team" });
        team.coaches.pull(userId);
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

        const athlete = await Athlete.findOne({ user: req.user.id });
        if (!athlete) return res.status(404).json({ message: "Athlete not found" });

        if (!athlete.clubs.includes(team.club)) {
            return res.status(403).json({ message: "You must be a member of the club to join its teams" });
        }

        if (team.athletes.includes(req.user.id)) {
            return res.status(400).json({ message: "You are already in this team" });
        }

        team.athletes.push(req.user.id);
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

        const coach = await Coach.findOne({ user: req.user.id });
        if (!coach) return res.status(404).json({ message: "Coach not found" });

        // Ensure coach is part of the club that owns the team
        if (!coach.clubs.includes(team.club)) {
            return res.status(403).json({ message: "You must be a member of the club to coach its teams" });
        }

        if (team.coaches.includes(req.user.id)) {
            return res.status(400).json({ message: "You are already a coach for this team" });
        }

        team.coaches.push(req.user.id);
        await team.save();
        res.status(200).json({ message: "Successfully joined team as coach", team });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
