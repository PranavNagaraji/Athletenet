import mongoose from "mongoose";

const playgroundSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
        default: null
    },

    sports: [String],

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },

    location: {
        type: {
            type: String,
            enum: ["Point"],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    bookingEnabled: {
        type: Boolean,
        default: true
    },
    address: {
        type: String,
        trim: true,
        required: true
    }

}, { timestamps: true });

playgroundSchema.index({ location: "2dsphere" });

export default mongoose.model("Playground", playgroundSchema);