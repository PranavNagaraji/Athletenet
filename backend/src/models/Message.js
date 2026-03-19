import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        clubGroup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Club",
        },
        teamGroup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
        },
        tournamentGroup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tournament",
        },
        text: {
            type: String,
            trim: true,
        },
        fileUrl: {
            type: String,
        },
        fileType: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// A message must have either a direct receiver OR a clubGroup OR a teamGroup OR a tournamentGroup
messageSchema.pre('validate', function(next) {
    if (!this.receiver && !this.clubGroup && !this.teamGroup && !this.tournamentGroup) {
        this.invalidate('receiver', 'Message must have a receiver, clubGroup, teamGroup, or tournamentGroup');
    }
    if (!this.text && !this.fileUrl) {
         this.invalidate('text', 'Message must contain text or a file upload');
    }
    next();
});

const Message = mongoose.model("Message", messageSchema);
export default Message;
