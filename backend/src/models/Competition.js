import mongoose from "mongoose";

const competitionSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    sport: {
        type: String,
        required: true
    },

    clubs: [{
        club: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Club",
            required: true
        },
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: true
        }
    }],

    matches: [{
        team1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: true
        },
        team2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: true
        }
    }],

    playground: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Playground"
    },

    startDate: Date,
    endDate: Date,

    status: {
        type: String,
        enum: ["upcoming", "ongoing", "completed"],
        default: "upcoming"
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
        required: true
    },

    public:{
        type:Boolean,
        default:true,
    }
}, { timestamps: true });

export default mongoose.model("Competition", competitionSchema);