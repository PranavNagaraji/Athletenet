import mongoose from "mongoose";

const athleteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    age: {
        type: Number,
        min: 5,
        max: 60,
        default: 18
    },

    height: {
        type: Number,
        default: 170
    },

    weight: {
        type: Number,
        default: 65
    },

    clubs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
        default: []
    }]

}, { timestamps: true });

export default mongoose.model("Athlete", athleteSchema);