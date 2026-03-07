import Team from "../models/Team.js";
import Club from "../models/Club.js";
import Athlete from "../models/Athlete.js";
import Coach from "../models/Coach.js";

export const createTeam = async (req, res) => {
    try {
        const { name } = req.body;
        const club = await Club.findOne({ admin: req.user._id });
        if (!club) return res.status(404).json({ message: "Club not found" });
        const team = await Team.create({ name, club: req.user._id });
        res.status(201).json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addAthleteToTeam = async (req, res) => {
    try {
        const { teamId, athleteId } = req.body;
        const team = await Team.findById(teamId);
        if (!team)
            return res.status(404).json({ message: "Team not found" });
        const athlete = await Athlete.findOne({ user: athleteId });
        if (!athlete)
            return res.status(404).json({ message: "Athlete not found" });
        if (team.athletes.includes(athleteId))
            return res.status(400).json({ message: "Athlete already in team" });
        team.athletes.push(athleteId);
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
        const { teamId, coachId } = req.body;
        const team = await Team.findById(teamId);
        if (!team)
            return res.status(404).json({ message: "Team not found" });
        const coach = await Coach.findOne({ user: coachId });
        if (!coach)
            return res.status(404).json({ message: "Coach not found" });
        if (team.coaches.includes(coachId))
            return res.status(400).json({ message: "Coach already in team" });
        team.coaches.push(coachId);
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
        const clubId = req.params.clubId;
        const club = await Club.findOne({ admin: clubId });
        if (!club) return res.status(404).json({ message: "Club not found" });
        const teams = await Team.find();
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