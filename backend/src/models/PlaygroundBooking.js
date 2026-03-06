import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({

    playground: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Playground",
        required: true
    },

    bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    startTime: {
        type: Date,
        required: true
    },

    endTime: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ["booked", "completed", "cancelled"],
        default: "booked"
    }

}, { timestamps: true });

export default mongoose.model("PlaygroundBooking", bookingSchema);