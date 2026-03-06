import mongoose from "mongoose";

const coachSchema = new mongoose.Schema({
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
    
    experience: {
        type: Number, // years
        default: 0
    },

    // certifications: [{
    //     title: String,
    //     issuedBy: String,
    //     year: Number
    // }],

    specialization: {
        type: String,
        default: null,
        // required: true
    },

    clubs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
    }]

}, { timestamps: true });

export default mongoose.model("Coach", coachSchema);