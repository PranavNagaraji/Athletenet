import mongoose from "mongoose";

const performanceRatingSchema = new mongoose.Schema(
  {
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    scores: {
      fitness: { type: Number, min: 0, max: 5, default: 0 },
      skill: { type: Number, min: 0, max: 5, default: 0 },
      attitude: { type: Number, min: 0, max: 5, default: 0 },
      effort: { type: Number, min: 0, max: 5, default: 0 },
      teamwork: { type: Number, min: 0, max: 5, default: 0 },
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    note: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1200,
    },
  },
  { timestamps: true }
);

performanceRatingSchema.index({ coach: 1, athlete: 1 }, { unique: true });

export default mongoose.model("PerformanceRating", performanceRatingSchema);
