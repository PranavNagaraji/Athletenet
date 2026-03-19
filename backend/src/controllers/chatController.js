import Message from "../models/Message.js";

export const getGroupMessages = async (req, res) => {
    try {
        const { clubId } = req.params;
        const messages = await Message.find({ clubGroup: clubId })
            .populate("sender", "name profilePic")
            .sort({ createdAt: 1 });
            
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTeamMessages = async (req, res) => {
    try {
        const { teamId } = req.params;
        const messages = await Message.find({ teamGroup: teamId })
            .populate("sender", "name profilePic")
            .sort({ createdAt: 1 });
            
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTournamentMessages = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const messages = await Message.find({ tournamentGroup: tournamentId })
            .populate("sender", "name profilePic")
            .sort({ createdAt: 1 });
            
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getDirectMessages = async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: otherUserId },
                { sender: otherUserId, receiver: myId }
            ]
        })
        .populate("sender", "name profilePic")
        .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
