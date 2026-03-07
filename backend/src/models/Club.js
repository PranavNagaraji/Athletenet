import mongoose from "mongoose";

const clubSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
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
        default: [],
        // required: true
    },

}, { timestamps: true });

export default mongoose.model("Club", clubSchema);