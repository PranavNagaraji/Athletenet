import mongoose from "mongoose";

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
        required: true
    },
    sport: {
        type: String,
        required: true,
        trim: true
    },
    teams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team"
    }],
    matches: [{
        team1: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
        team2: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
        winner: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
        score: String,
        date: Date
    }],
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["planned", "active", "finished"],
        default: "planned"
    },
    public: {
        type: Boolean,
        default: true
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team"
    },
    banner: {
        type: String, // URL to banner image
        default: ""
    }
}, { timestamps: true });

export default mongoose.model("Tournament", tournamentSchema);
