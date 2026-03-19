import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    mediaUrl: {
        type: String,
        default: ""
    },
    mediaType: {
        type: String,
        enum: ["image", "video", ""],
        default: ""
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        text: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club"
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team"
    },
    tags: [String]
}, { timestamps: true });

export default mongoose.model("Post", postSchema);
