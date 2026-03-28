import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema({
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    recipientRole: {
        type: String,
        enum: ["athlete", "coach"],
        required: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }
}, { timestamps: true });

inviteSchema.index({ club: 1, recipient: 1, status: 1 });

export default mongoose.model("Invite", inviteSchema);
