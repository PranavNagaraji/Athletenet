import mongoose from "mongoose";

const coachEventSchema = new mongoose.Schema(
  {
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null,
      index: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    type: {
      type: String,
      enum: ["Match", "Friendly", "Tournament", "Training Camp", "Other"],
      default: "Match",
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: "",
      maxlength: 160,
    },
    opponent: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: 600,
    },
    result: {
      type: String,
      enum: ["Won", "Lost", "Draw", "—"],
      default: "—",
    },
  },
  { timestamps: true }
);

export default mongoose.model("CoachEvent", coachEventSchema);
