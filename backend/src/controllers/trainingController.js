import TrainingSession from "../models/TrainingSession.js";
import Team from "../models/Team.js";
import Coach from "../models/Coach.js";

// POST /api/training — create session
export const createSession = async (req, res) => {
  try {
    const { title, description, date, duration, location, teamId } = req.body;
    if (!title || !date || !teamId) {
      return res.status(400).json({ message: "title, date, and teamId are required" });
    }

    const team = await Team.findById(teamId).populate("athletes", "name profilePic");
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Build attendees list from team athletes
    const attendees = (team.athletes || []).map((ath) => ({
      user: ath._id,
      attended: false,
    }));

    const session = await TrainingSession.create({
      title,
      description: description || "",
      date: new Date(date),
      duration: duration || 60,
      location: location || "",
      team: teamId,
      coach: req.user._id,
      attendees,
    });

    const populated = await TrainingSession.findById(session._id)
      .populate("team", "name")
      .populate("attendees.user", "name profilePic");

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/training/coach — get all sessions for logged-in coach
export const getCoachSessions = async (req, res) => {
  try {
    const sessions = await TrainingSession.find({ coach: req.user._id })
      .populate("team", "name")
      .populate("attendees.user", "name profilePic")
      .sort({ date: -1 });

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/training/team/:teamId — get sessions for a specific team
export const getSessionsByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const sessions = await TrainingSession.find({ team: teamId })
      .populate("team", "name")
      .populate("attendees.user", "name profilePic")
      .populate("coach", "name profilePic")
      .sort({ date: -1 });

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/training/:id — update session details/status
export const updateSession = async (req, res) => {
  try {
    const session = await TrainingSession.findOne({ _id: req.params.id, coach: req.user._id });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const { title, description, date, duration, location, status } = req.body;
    if (title !== undefined) session.title = title;
    if (description !== undefined) session.description = description;
    if (date !== undefined) session.date = new Date(date);
    if (duration !== undefined) session.duration = duration;
    if (location !== undefined) session.location = location;
    if (status !== undefined) session.status = status;

    await session.save();
    const populated = await TrainingSession.findById(session._id)
      .populate("team", "name")
      .populate("attendees.user", "name profilePic");

    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/training/:id — delete session
export const deleteSession = async (req, res) => {
  try {
    const session = await TrainingSession.findOneAndDelete({ _id: req.params.id, coach: req.user._id });
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.status(200).json({ message: "Session deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/training/:id/attendance — mark attendance for athletes
export const markAttendance = async (req, res) => {
  try {
    const { attendees } = req.body; // [{ userId, attended }]
    const session = await TrainingSession.findOne({ _id: req.params.id, coach: req.user._id });
    if (!session) return res.status(404).json({ message: "Session not found" });

    attendees.forEach(({ userId, attended }) => {
      const record = session.attendees.find((a) => a.user.toString() === userId);
      if (record) record.attended = attended;
    });

    session.status = "completed";
    await session.save();

    const populated = await TrainingSession.findById(session._id)
      .populate("team", "name")
      .populate("attendees.user", "name profilePic");

    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
