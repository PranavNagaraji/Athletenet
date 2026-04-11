import Tournament from "../models/Tournament.js";
import Club from "../models/Club.js";
import Team from "../models/Team.js";

export const createTournament = async (req, res) => {
    try {
        const { name, description, sport, startDate, endDate, banner, public: isPublic } = req.body;
        const club = await Club.findOne({ admin: req.user._id });
        if (!club) return res.status(404).json({ message: "Club profile not found" });

        const tournament = await Tournament.create({
            name, description, sport, club: club._id, startDate, endDate, banner, public: isPublic
        });
        res.status(201).json(tournament);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyTournaments = async (req, res) => {
    try {
        const club = await Club.findOne({ admin: req.user._id });
        if (!club) return res.status(404).json({ message: "Club not found" });
        const tournaments = await Tournament.find({ club: club._id })
            .populate({ path: "club", populate: { path: "admin", select: "name profilePic" } })
            .populate("teams", "name")
            .sort({ updatedAt: -1, createdAt: -1 });
        
        console.log(`[Tournament] Found ${tournaments.length} hosted tournaments for club ${club._id}`);
        res.status(200).json(tournaments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ message: "Tournament not found" });

        const club = await Club.findOne({ admin: req.user._id });
        if (!club || tournament.club.toString() !== club._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this tournament" });
        }

        Object.assign(tournament, req.body);
        await tournament.save();
        res.status(200).json(tournament);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ message: "Tournament not found" });

        const club = await Club.findOne({ admin: req.user._id });
        if (!club || tournament.club.toString() !== club._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this tournament" });
        }

        await tournament.deleteOne();
        res.status(200).json({ message: "Tournament deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllTournaments = async (req, res) => {
    try {
        const tournaments = await Tournament.find()
            .populate({ path: "club", populate: { path: "admin", select: "name profilePic" } })
            .populate("teams", "name")
            .sort({ updatedAt: -1, createdAt: -1 });
        res.status(200).json(tournaments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const joinTournament = async (req, res) => {
    try {
        const { tournamentId, teamId } = req.body;
        
        // 1. Verify User is a Club Admin
        const club = await Club.findOne({ admin: req.user._id });
        if (!club) return res.status(403).json({ message: "Only club owners can register teams for tournaments" });

        // 2. Verify Tournament exists
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ message: "Tournament not found" });

        // 3. Verify Team belongs to this Club
        const team = await Team.findOne({ _id: teamId, club: club._id });
        if (!team) return res.status(403).json({ message: "This team does not belong to your club" });

        // 4. Add team if not already joined
        if (!tournament.teams.includes(teamId)) {
            tournament.teams.push(teamId);
            await tournament.save();
            return res.status(200).json({ message: "Team registered successfully", tournament });
        } else {
            return res.status(400).json({ message: "This team is already registered for this tournament" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getParticipatingTournaments = async (req, res) => {
    try {
        const club = await Club.findOne({ admin: req.user._id });
        if (!club) return res.status(404).json({ message: "Club not found" });

        const myTeams = await Team.find({ club: club._id });
        const teamIds = myTeams.map(t => t._id);

        const tournaments = await Tournament.find({ 
            teams: { $in: teamIds },
            club: { $ne: club._id } // Not hosted by me
        })
            .populate({ path: "club", populate: { path: "admin", select: "name profilePic" } })
            .sort({ updatedAt: -1, createdAt: -1 });

        res.status(200).json(tournaments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getTournamentMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const tournament = await Tournament.findById(id)
            .populate({ path: "club", populate: { path: "admin", select: "name profilePic" } })
            .populate({ path: "teams", populate: { path: "club", populate: { path: "admin", select: "name profilePic" } } });

        if (!tournament) return res.status(404).json({ message: "Tournament not found" });

        // Build unique member list
        const membersMap = new Map();
        
        // Add Host
        const hostAdmin = tournament.club?.admin;
        if (hostAdmin) membersMap.set(hostAdmin._id.toString(), { ...hostAdmin._doc, role: "Host" });

        // Add Participants
        tournament.teams?.forEach(team => {
            const participantAdmin = team.club?.admin;
            if (participantAdmin && !membersMap.has(participantAdmin._id.toString())) {
                membersMap.set(participantAdmin._id.toString(), { ...participantAdmin._doc, role: "Participant" });
            }
        });

        res.status(200).json(Array.from(membersMap.values()));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
