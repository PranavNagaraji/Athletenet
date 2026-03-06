import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    athletes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"   // store athlete userIds
    }],

    coaches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"   // store coach userIds
    }]

}, { timestamps: true });

export default mongoose.model("Team", teamSchema);