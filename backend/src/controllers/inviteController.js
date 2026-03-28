import Invite from "../models/Invite.js";
import Club from "../models/Club.js";
import User from "../models/User.js";
import Athlete from "../models/Athlete.js";
import Coach from "../models/Coach.js";

export const createInvite = async (req, res) => {
    try {
        const club = await Club.findOne({ admin: req.user._id });
        if (!club) return res.status(404).json({ message: "Club profile not found" });

        const { recipientId, message } = req.body;
        if (!recipientId) return res.status(400).json({ message: "Recipient ID is required" });

        const recipient = await User.findById(recipientId);
        if (!recipient) return res.status(404).json({ message: "Recipient not found" });
        if (!["athlete", "coach"].includes(recipient.role)) {
            return res.status(400).json({ message: "Invitations can only be sent to athletes or coaches" });
        }

        const existingInvite = await Invite.findOne({ club: club._id, recipient: recipient._id, status: "pending" });
        if (existingInvite) {
            return res.status(400).json({ message: "An invitation is already pending for this user" });
        }

        const isAlreadyMember = recipient.role === "athlete"
            ? await Athlete.exists({ user: recipient._id, clubs: club._id })
            : await Coach.exists({ user: recipient._id, clubs: club._id });

        if (isAlreadyMember) {
            return res.status(400).json({ message: "This user is already a member of your club" });
        }

        const invite = await Invite.create({
            club: club._id,
            recipient: recipient._id,
            recipientRole: recipient.role,
            invitedBy: req.user._id,
            message: message || "",
            status: "pending"
        });

        return res.status(200).json({ message: "Invite sent successfully", invite });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getMyInvites = async (req, res) => {
    try {
        const invites = await Invite.find({ recipient: req.user._id })
            .populate({ path: "club", populate: { path: "admin", select: "name profilePic" } })
            .sort({ createdAt: -1 });
        return res.status(200).json(invites);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const acceptInvite = async (req, res) => {
    try {
        const inviteId = req.params.id;
        const invite = await Invite.findOne({ _id: inviteId, recipient: req.user._id });
        if (!invite) return res.status(404).json({ message: "Invitation not found" });
        if (invite.status !== "pending") return res.status(400).json({ message: "Only pending invitations can be accepted" });

        const club = await Club.findById(invite.club);
        if (!club) return res.status(404).json({ message: "Club not found" });

        if (invite.recipientRole === "athlete") {
            await Athlete.findOneAndUpdate(
                { user: req.user._id },
                { $addToSet: { clubs: club._id } },
                { new: true, upsert: true }
            );
        } else if (invite.recipientRole === "coach") {
            await Coach.findOneAndUpdate(
                { user: req.user._id },
                { $addToSet: { clubs: club._id } },
                { new: true, upsert: true }
            );
        }

        invite.status = "accepted";
        await invite.save();

        return res.status(200).json({ message: "Invitation accepted" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const rejectInvite = async (req, res) => {
    try {
        const inviteId = req.params.id;
        const invite = await Invite.findOne({ _id: inviteId, recipient: req.user._id });
        if (!invite) return res.status(404).json({ message: "Invitation not found" });
        if (invite.status !== "pending") return res.status(400).json({ message: "Only pending invitations can be rejected" });

        invite.status = "rejected";
        await invite.save();

        return res.status(200).json({ message: "Invitation rejected" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
