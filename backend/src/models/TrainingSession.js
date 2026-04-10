import mongoose from "mongoose";

const attendeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  attended: { type: Boolean, default: false },
}, { _id: false });

const trainingSessionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  date: { type: Date, required: true },
  duration: { type: Number, default: 60 }, // minutes
  location: { type: String, default: "" },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  coach: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled",
  },
  attendees: [attendeeSchema],
}, { timestamps: true });

export default mongoose.model("TrainingSession", trainingSessionSchema);
