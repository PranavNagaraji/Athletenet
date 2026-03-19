import mongoose from "mongoose";

const clubSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    name: {
        type: String,
        trim: true,
        default: null
    },
    profilePic: {
        type: String,
        default: null
    },

    establishedYear: {
        type: Number,
        default: () => new Date().getFullYear()
    },

    facilities: {
        type: [String],
        default: [],
        // required: true
    },

    specialization: {
        type: String,
        default: null,
        // required: true
    },

    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],

}, { timestamps: true });

export default mongoose.model("Club", clubSchema);