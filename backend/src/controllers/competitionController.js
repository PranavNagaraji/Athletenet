import Competition from "../models/Competition.js";
import Club from "../models/Club.js";

export const createCompetition = async (req, res) => {
    try {
        // req.user._id = admin user
        const club = await Club.findOne({ admin: req.user._id });
        if (!club) return res.status(404).json({ message: "Club not found for this user" });

        const competition = await Competition.create({
            ...req.body,
            createdBy: req.user._id
        });

        res.status(201).json(competition);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyCompetitions = async (req, res) => {
    try {
        const competitions = await Competition.find({ createdBy: req.user._id })
            .populate("clubs.club")
            .populate("clubs.team")
            .populate("matches.team1")
            .populate("matches.team2")
            .populate("playground")
            .populate("createdBy")
            .sort({ updatedAt: -1, createdAt: -1 });

        res.status(200).json(competitions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCompetitionById = async (req, res) => {
    try {
        const competition = await Competition.findById(req.params.id)
            .populate("clubs.club")
            .populate("clubs.team")
            .populate("matches.team1")
            .populate("matches.team2")
            .populate("playground");

        if (!competition)
            return res.status(404).json({ message: "Competition not found" });

        if (competition.createdBy.toString() !== req.user._id.toString() && !competition.public) {
            return res.status(403).json({ message: "Not authorized to view this competition" });
        }

        res.status(200).json(competition);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCompetition = async (req, res) => {
    try {
        const competition = await Competition.findById(req.params.id);
        if (!competition) return res.status(404).json({ message: "Competition not found" });

        const club = await Club.findOne({ admin: competition.createdBy });
        if (!club || club.admin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this competition" });
        }

        Object.assign(competition, req.body);
        await competition.save();
        res.status(200).json(competition);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteCompetition = async (req, res) => {
    try {
        const competition = await Competition.findById(req.params.id);
        if (!competition) return res.status(404).json({ message: "Competition not found" });

        const club = await Club.findOne({admin:competition.createdBy});
        if (!club || club.admin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this competition" });
        }

        await competition.deleteOne();
        res.status(200).json({ message: "Competition deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
